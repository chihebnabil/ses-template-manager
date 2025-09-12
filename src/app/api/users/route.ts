import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { UserRecord } from 'firebase-admin/auth';

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
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const maxResults = parseInt(searchParams.get('maxResults') || '1000');
        const pageToken = searchParams.get('pageToken') || undefined;

        // Fetch users from Firebase Auth
        const listUsersResult = await adminAuth.listUsers(maxResults, pageToken);
        
        // Convert users and filter out those without email
        const users = listUsersResult.users
            .map(convertUserRecord)
            .filter(user => user.email && !user.disabled); // Only active users with email

        // Sort by creation date (newest first)
        users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return NextResponse.json({
            users,
            nextPageToken: listUsersResult.pageToken,
            totalReturned: users.length,
            hasMore: !!listUsersResult.pageToken
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
