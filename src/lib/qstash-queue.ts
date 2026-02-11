import { Client as QStashClient } from '@upstash/qstash';
import { Redis } from '@upstash/redis';

// Lazy initialization of clients to avoid build-time errors
let qstashClient: QStashClient | null = null;
let redisClient: Redis | null = null;

function getQStashClient(): QStashClient {
    if (!qstashClient) {
        const token = process.env.QSTASH_TOKEN;
        if (!token) {
            throw new Error('QSTASH_TOKEN is not set');
        }
        qstashClient = new QStashClient({ token });
    }
    return qstashClient;
}

function getRedisClient(): Redis {
    if (!redisClient) {
        const url = process.env.UPSTASH_REDIS_REST_URL;
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;
        if (!url || !token) {
            throw new Error('Redis configuration is not set');
        }
        redisClient = new Redis({ url, token });
    }
    return redisClient;
}

export interface EmailJob {
    id: string;
    templateId: string;
    userIds: string[];
    subject?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    totalEmails: number;
    sentEmails: number;
    failedEmails: number;
    errors: string[];
    currentIndex: number;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    qstashMessages?: number; // Number of QStash messages created
    processedMessages?: number; // Number of messages processed
}

const JOB_PREFIX = 'email-job:';
const BATCH_SIZE = 10; // Process 10 emails per QStash message

export function calculateBatchCount(totalEmails: number): number {
    return Math.ceil(totalEmails / BATCH_SIZE);
}

export async function createEmailJob(
    templateId: string,
    userIds: string[],
    subject?: string
): Promise<EmailJob> {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const batchCount = calculateBatchCount(userIds.length);
    
    const job: EmailJob = {
        id,
        templateId,
        userIds,
        subject,
        status: 'pending',
        totalEmails: userIds.length,
        sentEmails: 0,
        failedEmails: 0,
        errors: [],
        currentIndex: 0,
        createdAt: new Date().toISOString(),
        qstashMessages: batchCount,
        processedMessages: 0,
    };

    const redis = getRedisClient();
    const qstash = getQStashClient();

    // Store job in Redis
    await redis.set(`${JOB_PREFIX}${id}`, JSON.stringify(job));

    // Create QStash messages for each batch
    const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const publishPromises = [];
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        const batch = userIds.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / BATCH_SIZE);
        
        publishPromises.push(
            qstash.publishJSON({
                url: `${baseUrl}/api/cron/process-emails`,
                body: {
                    jobId: id,
                    templateId,
                    userIds: batch,
                    subject,
                    batchIndex,
                    totalBatches: batchCount,
                },
                retries: 3,
            })
        );
    }

    await Promise.all(publishPromises);

    return job;
}

export async function getEmailJob(jobId: string): Promise<EmailJob | null> {
    const redis = getRedisClient();
    const data = await redis.get<EmailJob>(`${JOB_PREFIX}${jobId}`);
    return data || null;
}

export async function updateEmailJob(jobId: string, updates: Partial<EmailJob>): Promise<EmailJob | null> {
    const redis = getRedisClient();
    const job = await getEmailJob(jobId);
    if (!job) return null;

    const updatedJob = { ...job, ...updates };
    await redis.set(`${JOB_PREFIX}${jobId}`, JSON.stringify(updatedJob));
    return updatedJob;
}

export async function processBatchResult(
    jobId: string,
    batchResults: { success: boolean; userId: string; email?: string; error?: string }[],
    batchIndex: number,
    totalBatches: number
): Promise<EmailJob | null> {
    const job = await getEmailJob(jobId);
    if (!job) return null;

    const newSent = batchResults.filter(r => r.success).length;
    const newFailed = batchResults.filter(r => !r.success).length;
    const newErrors = batchResults
        .filter(r => !r.success && r.error)
        .map(r => `Failed to send to ${r.userId}: ${r.error}`);

    const updatedSent = job.sentEmails + newSent;
    const updatedFailed = job.failedEmails + newFailed;
    const processedMessages = (job.processedMessages || 0) + 1;
    const isComplete = processedMessages >= totalBatches;

    const updatedJob: EmailJob = {
        ...job,
        sentEmails: updatedSent,
        failedEmails: updatedFailed,
        errors: [...job.errors, ...newErrors].slice(-50),
        processedMessages,
        status: isComplete ? 'completed' : 'processing',
        ...(isComplete ? {
            completedAt: new Date().toISOString(),
        } : {}),
        ...(job.status === 'pending' ? {
            startedAt: new Date().toISOString(),
        } : {}),
    };

    const redis = getRedisClient();
    await redis.set(`${JOB_PREFIX}${jobId}`, JSON.stringify(updatedJob));
    return updatedJob;
}

export async function getRecentJobs(limit: number = 20): Promise<EmailJob[]> {
    const redis = getRedisClient();
    const keys = await redis.keys(`${JOB_PREFIX}*`);
    if (!keys || keys.length === 0) return [];

    const jobs = await Promise.all(
        keys.map(async (key) => {
            const data = await redis.get<EmailJob>(key as string);
            return data;
        })
    );

    return jobs
        .filter((job): job is EmailJob => job !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
}
