import { Redis } from '@upstash/redis';

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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
    processedBy?: string;
}

const JOB_PREFIX = 'email-job:';
const QUEUE_KEY = 'email-queue:pending';
const PROCESSING_KEY = 'email-queue:processing';

export async function createEmailJob(
    templateId: string,
    userIds: string[],
    subject?: string
): Promise<EmailJob> {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
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
    };

    await redis.set(`${JOB_PREFIX}${id}`, JSON.stringify(job));
    await redis.lpush(QUEUE_KEY, id);

    return job;
}

export async function getEmailJob(jobId: string): Promise<EmailJob | null> {
    const data = await redis.get<string>(`${JOB_PREFIX}${jobId}`);
    return data ? JSON.parse(data) : null;
}

export async function updateEmailJob(jobId: string, updates: Partial<EmailJob>): Promise<EmailJob | null> {
    const job = await getEmailJob(jobId);
    if (!job) return null;

    const updatedJob = { ...job, ...updates };
    await redis.set(`${JOB_PREFIX}${jobId}`, JSON.stringify(updatedJob));
    return updatedJob;
}

export async function getNextJob(): Promise<EmailJob | null> {
    const jobId = await redis.rpop(QUEUE_KEY);
    if (!jobId) return null;

    const jobIdStr = jobId as string;
    await redis.lpush(PROCESSING_KEY, jobIdStr);

    const job = await getEmailJob(jobIdStr);
    if (!job) {
        await redis.lrem(PROCESSING_KEY, 0, jobIdStr);
        return null;
    }

    return job;
}

export async function markJobComplete(jobId: string): Promise<void> {
    await redis.lrem(PROCESSING_KEY, 0, jobId);
}

export async function requeueJob(jobId: string): Promise<void> {
    await redis.lrem(PROCESSING_KEY, 0, jobId);
    await redis.lpush(QUEUE_KEY, jobId);
}

export async function getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    total: number;
}> {
    const [pending, processing] = await Promise.all([
        redis.llen(QUEUE_KEY),
        redis.llen(PROCESSING_KEY),
    ]);

    return {
        pending: pending || 0,
        processing: processing || 0,
        total: (pending || 0) + (processing || 0),
    };
}

export async function getRecentJobs(limit: number = 20): Promise<EmailJob[]> {
    const keys = await redis.keys(`${JOB_PREFIX}*`);
    if (!keys || keys.length === 0) return [];

    const jobs = await Promise.all(
        keys.map(async (key) => {
            const data = await redis.get<string>(key as string);
            return data ? JSON.parse(data) as EmailJob : null;
        })
    );

    return jobs
        .filter((job): job is EmailJob => job !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
}
