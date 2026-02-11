import { NextRequest, NextResponse } from 'next/server';
import { getNextJob, updateEmailJob, markJobComplete, requeueJob } from '@/lib/redis-queue';
import { getAdminAuth } from '@/lib/firebase-admin';
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BATCH_SIZE = 5;
const PROCESSING_TIMEOUT_MS = 50000; // 50 seconds to stay under Vercel's 60s limit

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            console.warn('Unauthorized cron job attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const startTime = Date.now();
        const results = {
            processed: 0,
            sent: 0,
            failed: 0,
            errors: [] as string[],
        };

        console.log('Starting cron job to process email queue...');

        while (Date.now() - startTime < PROCESSING_TIMEOUT_MS) {
            const job = await getNextJob();
            
            if (!job) {
                console.log('No jobs in queue');
                break;
            }

            console.log(`Processing job ${job.id} - ${job.totalEmails} emails total`);

            try {
                await updateEmailJob(job.id, {
                    status: 'processing',
                    startedAt: new Date().toISOString(),
                });

                const remainingUserIds = job.userIds.slice(job.currentIndex);
                const batch = remainingUserIds.slice(0, BATCH_SIZE);

                const adminAuth = getAdminAuth();
                const batchResults = await Promise.all(
                    batch.map(async (userId) => {
                        try {
                            const userRecord = await adminAuth.getUser(userId);
                            
                            if (!userRecord.email) {
                                throw new Error(`User ${userId} has no email address`);
                            }

                            const command = new SendTemplatedEmailCommand({
                                Source: process.env.FROM_EMAIL || 'noreply@example.com',
                                Destination: {
                                    ToAddresses: [userRecord.email],
                                },
                                Template: job.templateId,
                                TemplateData: JSON.stringify({
                                    displayName: userRecord.displayName || userRecord.email,
                                    email: userRecord.email,
                                    subject: job.subject || undefined,
                                }),
                            });

                            await sesClient.send(command);
                            return { success: true, userId, email: userRecord.email };
                        } catch (error) {
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            return { success: false, userId, error: errorMessage };
                        }
                    })
                );

                const newSent = batchResults.filter(r => r.success).length;
                const newFailed = batchResults.filter(r => !r.success).length;
                const newErrors = batchResults
                    .filter(r => !r.success)
                    .map(r => `Failed to send to ${r.userId}: ${r.error}`);

                const updatedSent = job.sentEmails + newSent;
                const updatedFailed = job.failedEmails + newFailed;
                const updatedIndex = job.currentIndex + batch.length;
                const isComplete = updatedIndex >= job.totalEmails;

                await updateEmailJob(job.id, {
                    sentEmails: updatedSent,
                    failedEmails: updatedFailed,
                    currentIndex: updatedIndex,
                    errors: [...job.errors, ...newErrors].slice(-50),
                    ...(isComplete ? {
                        status: 'completed',
                        completedAt: new Date().toISOString(),
                    } : {}),
                });

                results.processed++;
                results.sent += newSent;
                results.failed += newFailed;

                if (isComplete) {
                    await markJobComplete(job.id);
                    console.log(`Job ${job.id} completed: ${updatedSent} sent, ${updatedFailed} failed`);
                } else {
                    await requeueJob(job.id);
                    console.log(`Job ${job.id} partially processed (${updatedIndex}/${job.totalEmails}), requeued`);
                }

                if (batch.length < BATCH_SIZE) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                console.error(`Error processing job ${job.id}:`, error);
                results.errors.push(`Job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                
                await updateEmailJob(job.id, {
                    status: 'failed',
                    completedAt: new Date().toISOString(),
                    errors: [...job.errors, `System error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                });
                await markJobComplete(job.id);
            }
        }

        console.log('Cron job completed:', results);

        return NextResponse.json({
            success: true,
            ...results,
            duration: Date.now() - startTime,
        });

    } catch (error) {
        console.error('Error in cron job:', error);
        return NextResponse.json(
            { error: 'Cron job failed' },
            { status: 500 }
        );
    }
}
