import { NextRequest, NextResponse } from 'next/server';
import { processBatchResult } from '@/lib/qstash-queue';
import { getAdminAuth } from '@/lib/firebase-admin';
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { Receiver } from '@upstash/qstash';

// Force dynamic rendering to access request headers at runtime
export const dynamic = 'force-dynamic';

const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

interface ProcessEmailRequest {
    jobId: string;
    templateId: string;
    userIds: string[];
    subject?: string;
    batchIndex: number;
    totalBatches: number;
}

export async function POST(request: NextRequest) {
    try {
        // Log all headers for debugging
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            headers[key] = value;
        });
        console.log('QStash webhook headers:', JSON.stringify(headers, null, 2));

        // Log env vars (masked)
        console.log('QSTASH_CURRENT_SIGNING_KEY exists:', !!process.env.QSTASH_CURRENT_SIGNING_KEY);
        console.log('QSTASH_NEXT_SIGNING_KEY exists:', !!process.env.QSTASH_NEXT_SIGNING_KEY);

        // Get signature from headers
        const signature = request.headers.get('upstash-signature');
        if (!signature) {
            console.error('Missing upstash-signature header');
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        // Get the body for verification
        const body = await request.text();
        console.log('Request body length:', body.length);

        // Verify signature manually with detailed error logging
        try {
            const receiver = new Receiver({
                currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
                nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
            });

            const isValid = await receiver.verify({
                body,
                signature,
            });

            if (!isValid) {
                console.error('Signature verification returned false');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }

            console.log('Signature verification passed');
        } catch (verifyError) {
            console.error('Signature verification error:', verifyError);
            return NextResponse.json({
                error: 'Signature verification failed',
                details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
            }, { status: 401 });
        }

        // Parse the body
        const data: ProcessEmailRequest = JSON.parse(body);
        const { jobId, templateId, userIds, subject, batchIndex, totalBatches } = data;

        console.log(`Processing QStash message for job ${jobId}, batch ${batchIndex + 1}/${totalBatches}`);

        const adminAuth = getAdminAuth();

        // Process this batch of emails
        const batchResults = await Promise.all(
            userIds.map(async (userId) => {
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
                        Template: templateId,
                        TemplateData: JSON.stringify({
                            displayName: userRecord.displayName || userRecord.email,
                            email: userRecord.email,
                            subject: subject || undefined,
                        }),
                    });

                    await sesClient.send(command);
                    return { success: true, userId, email: userRecord.email };
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`Failed to send to ${userId}:`, errorMessage);
                    return { success: false, userId, error: errorMessage };
                }
            })
        );

        // Update job status
        const updatedJob = await processBatchResult(jobId, batchResults, batchIndex, totalBatches);

        const sent = batchResults.filter(r => r.success).length;
        const failed = batchResults.filter(r => !r.success).length;

        console.log(`Batch ${batchIndex + 1}/${totalBatches} completed: ${sent} sent, ${failed} failed`);

        // Return success - QStash will handle retries if needed
        return NextResponse.json({
            success: true,
            jobId,
            batchIndex,
            sent,
            failed,
            jobStatus: updatedJob?.status,
        });

    } catch (error) {
        console.error('Error processing email batch:', error);
        // Return 500 to trigger QStash retry
        return NextResponse.json(
            { error: 'Failed to process email batch' },
            { status: 500 }
        );
    }
}

// Keep GET for backward compatibility during transition
export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: 'Use POST for QStash webhook',
        status: 'deprecated',
    });
}
