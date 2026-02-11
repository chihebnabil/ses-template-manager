import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { AuthMiddleware, getClientIp } from '@/lib/auth-middleware';

// Initialize SES client
const sesClient = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

// Rate limiter for bulk email operations (max 5 requests per hour per user)
const bulkEmailRateLimiter = AuthMiddleware.createRateLimiter(5, 60 * 60 * 1000);

interface BulkEmailRequest {
    templateId: string;
    userIds: string[];
    subject?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Authenticate and authorize the request
        const authResult = await AuthMiddleware.authenticate(request, {
            requireApiKey: false,
            requireSession: true,
            validateOrigin: false,
            validateAwsCredentials: true
        });

        if (!authResult.success) {
            console.warn('Unauthorized bulk email attempt:', authResult.error);
            return authResult.response!;
        }

        const { context } = authResult;
        
        // Apply rate limiting per IP
        const clientId = getClientIp(request);
        if (!bulkEmailRateLimiter(clientId)) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Maximum 5 bulk email requests per hour.' },
                { status: 429 }
            );
        }

        const body: BulkEmailRequest = await request.json();
        const { templateId, userIds, subject } = body;

        if (!templateId || !userIds || userIds.length === 0) {
            return NextResponse.json(
                { error: 'Template ID and user IDs are required' },
                { status: 400 }
            );
        }

        // Log bulk email operation for security audit
        console.log('Bulk email operation initiated:', {
            templateId,
            recipientCount: userIds.length,
            timestamp: new Date().toISOString(),
            clientIp: getClientIp(request),
            authenticated: context?.isAuthenticated
        });

        // Create a streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                let sent = 0;
                let failed = 0;
                const errors: string[] = [];

                const sendUpdate = (data: any) => {
                    const message = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                };

                try {
                    // Send initial status
                    sendUpdate({
                        status: 'running',
                        progress: 0,
                        sent: 0,
                        failed: 0,
                        total: userIds.length,
                        errors: []
                    });

                    // Process users in batches to avoid rate limits
                    const batchSize = 5;
                    const delay = 1000; // 1 second delay between batches

                    const adminAuth = getAdminAuth();

                    for (let i = 0; i < userIds.length; i += batchSize) {
                        const batch = userIds.slice(i, i + batchSize);
                        
                        // Process each user in the batch
                        const batchPromises = batch.map(async (userId) => {
                            try {
                                // Get user details from Firebase Auth
                                const userRecord = await adminAuth.getUser(userId);
                                
                                if (!userRecord.email) {
                                    throw new Error(`User ${userId} has no email address`);
                                }

                                // Send email using SES
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
                                const errorMessage = `Failed to send to ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                                errors.push(errorMessage);
                                return { success: false, userId, error: errorMessage };
                            }
                        });

                        // Wait for batch to complete
                        const batchResults = await Promise.all(batchPromises);
                        
                        // Update counters
                        batchResults.forEach(result => {
                            if (result.success) {
                                sent++;
                            } else {
                                failed++;
                            }
                        });

                        // Send progress update
                        const progress = Math.round(((sent + failed) / userIds.length) * 100);
                        sendUpdate({
                            status: 'running',
                            progress,
                            sent,
                            failed,
                            total: userIds.length,
                            errors: errors.slice(-10) // Last 10 errors
                        });

                        // Add delay between batches (except for the last batch)
                        if (i + batchSize < userIds.length) {
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    }

                    // Send final status
                    sendUpdate({
                        status: 'completed',
                        progress: 100,
                        sent,
                        failed,
                        total: userIds.length,
                        errors
                    });

                } catch (error) {
                    console.error('Bulk email error:', error);
                    sendUpdate({
                        status: 'failed',
                        progress: 0,
                        sent,
                        failed,
                        total: userIds.length,
                        errors: [...errors, `System error: ${error instanceof Error ? error.message : 'Unknown error'}`]
                    });
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Error in bulk email API:', error);
        return NextResponse.json(
            { error: 'Failed to process bulk email request' },
            { status: 500 }
        );
    }
}
