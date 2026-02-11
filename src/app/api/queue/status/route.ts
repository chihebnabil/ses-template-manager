import { NextRequest, NextResponse } from 'next/server';
import { AuthMiddleware } from '@/lib/auth-middleware';
import { getEmailJob, getRecentJobs } from '@/lib/qstash-queue';

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

        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');

        if (jobId) {
            const job = await getEmailJob(jobId);
            
            if (!job) {
                return NextResponse.json(
                    { error: 'Job not found' },
                    { status: 404 }
                );
            }

            const progress = job.totalEmails > 0 
                ? Math.round(((job.sentEmails + job.failedEmails) / job.totalEmails) * 100)
                : 0;

            return NextResponse.json({
                success: true,
                job: {
                    ...job,
                    progress,
                },
            });
        }

        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const jobs = await getRecentJobs(limit);

        return NextResponse.json({
            success: true,
            jobs: jobs.map(job => ({
                ...job,
                progress: job.totalEmails > 0 
                    ? Math.round(((job.sentEmails + job.failedEmails) / job.totalEmails) * 100)
                    : 0,
            })),
        });

    } catch (error) {
        console.error('Error in job status API:', error);
        return NextResponse.json(
            { error: 'Failed to get job status' },
            { status: 500 }
        );
    }
}
