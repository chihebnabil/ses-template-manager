import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware, getClientIp } from '@/lib/auth-middleware';
import { createEmailJob, getRecentJobs } from '@/lib/qstash-queue';

const bulkEmailRateLimiter = AuthMiddleware.createRateLimiter(5, 60 * 60 * 1000);

interface EnqueueRequest {
    templateId: string;
    userIds: string[];
    subject?: string;
}

export async function POST(request: NextRequest) {
    try {
        const authResult = await AuthMiddleware.authenticate(request, {
            requireApiKey: false,
            requireSession: true,
            validateOrigin: false,
            validateAwsCredentials: true
        });

        if (!authResult.success) {
            console.warn('Unauthorized queue request:', authResult.error);
            return authResult.response!;
        }

        const clientId = getClientIp(request);
        if (!bulkEmailRateLimiter(clientId)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Maximum 5 bulk email requests per hour.' },
                { status: 429 }
            );
        }

        const body: EnqueueRequest = await request.json();
        const { templateId, userIds, subject } = body;

        if (!templateId || !userIds || userIds.length === 0) {
            return NextResponse.json(
                { error: 'Template ID and user IDs are required' },
                { status: 400 }
            );
        }

        if (userIds.length > 5000) {
            return NextResponse.json(
                { error: 'Maximum 5000 users per batch. Please split into smaller batches.' },
                { status: 400 }
            );
        }

        console.log('Bulk email queued via QStash:', {
            templateId,
            recipientCount: userIds.length,
            timestamp: new Date().toISOString(),
            clientIp: getClientIp(request),
        });

        const job = await createEmailJob(templateId, userIds, subject);

        return NextResponse.json({
            success: true,
            jobId: job.id,
            status: job.status,
            totalEmails: job.totalEmails,
            qstashMessages: job.qstashMessages,
            message: `Email job created successfully. ${userIds.length} emails queued in ${job.qstashMessages} batches.`,
        });

    } catch (error) {
        console.error('Error in queue API:', error);
        return NextResponse.json(
            { error: 'Failed to queue email job' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const authResult = await AuthMiddleware.authenticate(request, {
            requireApiKey: false,
            requireSession: true,
            validateOrigin: false,
        });

        if (!authResult.success) {
            return authResult.response!;
        }

        const recentJobs = await getRecentJobs(20);
        
        // Calculate queue stats from recent jobs
        const pending = recentJobs.filter(j => j.status === 'pending').length;
        const processing = recentJobs.filter(j => j.status === 'processing').length;
        
        return NextResponse.json({
            success: true,
            queue: {
                pending,
                processing,
                total: pending + processing,
            },
            recentJobs: recentJobs.map(job => ({
                id: job.id,
                status: job.status,
                totalEmails: job.totalEmails,
                sentEmails: job.sentEmails,
                failedEmails: job.failedEmails,
                progress: job.totalEmails > 0 
                    ? Math.round(((job.sentEmails + job.failedEmails) / job.totalEmails) * 100)
                    : 0,
                createdAt: job.createdAt,
            })),
        });

    } catch (error) {
        console.error('Error getting queue status:', error);
        return NextResponse.json(
            { error: 'Failed to get queue status' },
            { status: 500 }
        );
    }
}
