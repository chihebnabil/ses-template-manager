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

interface EmailResult {
    success: boolean;
    userId: string;
    email?: string;
    error?: string;
}

const MAX_RETRIES = 3;
const DELAY_BETWEEN_EMAILS_MS = 100; // 100ms delay between emails

async function sendEmailWithRetry(
    userId: string,
    templateId: string,
    subject: string | undefined,
    adminAuth: any
): Promise<EmailResult> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
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
            
            // Check if it's a rate limit error
            if (errorMessage.includes('Maximum sending rate exceeded')) {
                if (attempt < MAX_RETRIES - 1) {
                    // Exponential backoff: 1s, 2s, 4s
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`Rate limit hit for ${userId}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
            }
            
            // Other errors or max retries reached
            console.error(`Failed to send to ${userId} after ${attempt + 1} attempts:`, errorMessage);
            return { success: false, userId, error: errorMessage };
        }
    }
    
    return { success: false, userId, error: 'Max retries exceeded' };
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

        // Process emails sequentially with retry logic to avoid SES rate limits
        const batchResults: EmailResult[] = [];
        for (let i = 0; i < userIds.length; i++) {
            const userId = userIds[i];
            const result = await sendEmailWithRetry(userId, templateId, subject, adminAuth);
            batchResults.push(result);
            
            // Add small delay between emails to respect SES rate limits (14 emails/second)
            // 100ms delay = ~10 emails per second, which is safely under the limit
            if (i < userIds.length - 1) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_EMAILS_MS));
            }
        }

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
