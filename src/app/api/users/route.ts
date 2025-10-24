import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { UserRecord } from 'firebase-admin/auth';
import { AuthMiddleware, getClientIp } from '@/lib/auth-middleware';

export interface FirebaseAuthUser {
    uid: string;
    email: string;
    displayName?: string;
    emailVerified: boolean;
    disabled: boolean;
    createdAt: Date;
    lastSignInTime?: Date;
    providerData: Array<{
        providerId: string;
        uid: string;
        email?: string;
        displayName?: string;
    }>;
    customClaims?: Record<string, any>;
}

function convertUserRecord(userRecord: UserRecord): FirebaseAuthUser {
    return {
        uid: userRecord.uid,
        email: userRecord.email || '',
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        createdAt: new Date(userRecord.metadata.creationTime),
        lastSignInTime: userRecord.metadata.lastSignInTime ? new Date(userRecord.metadata.lastSignInTime) : undefined,
        providerData: userRecord.providerData,
        customClaims: userRecord.customClaims
    };
}

export async function GET(request: NextRequest) {
    try {
        // Authenticate the request - allow any authenticated user
        const authResult = await AuthMiddleware.authenticate(request, {
            requireApiKey: false,
            requireSession: true,
            validateOrigin: true,
            validateAwsCredentials: true
        });

        if (!authResult.success) {
            console.warn('Unauthorized users API access attempt:', authResult.error);
            return authResult.response!;
        }

        const { context } = authResult;
        
        // Log user data access for audit
        console.log('Users API accessed:', {
            timestamp: new Date().toISOString(),
            clientIp: getClientIp(request),
            authenticated: context?.isAuthenticated
        });

        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const requestedMaxResults = parseInt(searchParams.get('maxResults') || '5000');
        const pageToken = searchParams.get('pageToken') || undefined;

        // Firebase Auth has a hard limit of 1000 users per request
        // If more users are requested, we need to paginate
        const allUsers: FirebaseAuthUser[] = [];
        let currentPageToken: string | undefined = pageToken;
        let usersToFetch = requestedMaxResults;

        while (usersToFetch > 0) {
            const batchSize = Math.min(usersToFetch, 1000); // Firebase limit is 1000
            const listUsersResult = await adminAuth.listUsers(batchSize, currentPageToken);
            
            // Convert and filter users
            const batchUsers = listUsersResult.users
                .map(convertUserRecord)
                .filter(user => user.email && !user.disabled); // Only active users with email
            
            allUsers.push(...batchUsers);
            
            // Update for next iteration
            currentPageToken = listUsersResult.pageToken;
            usersToFetch -= batchSize;
            
            // If there's no more pages or we have enough users, break
            if (!currentPageToken || allUsers.length >= requestedMaxResults) {
                break;
            }
        }

        // Sort by creation date (newest first)
        allUsers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Limit to requested max results
        const users = allUsers.slice(0, requestedMaxResults);

        return NextResponse.json({
            users,
            nextPageToken: currentPageToken,
            totalReturned: users.length,
            hasMore: !!currentPageToken
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users from Firebase Auth' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, maxResults = 100 } = body;

        if (action === 'count') {
            // Get user count
            const listUsersResult = await adminAuth.listUsers(maxResults);
            const users = listUsersResult.users
                .map(convertUserRecord)
                .filter(user => user.email && !user.disabled);

            return NextResponse.json({
                count: users.length,
                hasMore: !!listUsersResult.pageToken
            });
        }

        if (action === 'sample') {
            // Get sample users for preview
            const listUsersResult = await adminAuth.listUsers(Math.min(maxResults, 20));
            const users = listUsersResult.users
                .map(convertUserRecord)
                .filter(user => user.email && !user.disabled)
                .slice(0, 5); // Return max 5 sample users

            return NextResponse.json({
                users,
                totalEstimate: users.length
            });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Error in POST /api/users:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
