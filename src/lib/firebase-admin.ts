import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

// Firebase Admin SDK configuration - lazy loaded for build-time compatibility
let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let initializationError: Error | null = null;

function initializeFirebaseAdmin(): App | null {
  // Check if admin app is already initialized
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Skip initialization during build phase
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI) {
    console.log('Skipping Firebase Admin initialization during build');
    return null;
  }

  // Validate required environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const error = new Error(
      'Missing required Firebase Admin environment variables. ' +
      'Please ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.'
    );
    initializationError = error;
    console.error(error.message);
    return null;
  }

  try {
    // Initialize with service account
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      }),
      projectId
    });
    console.log('Firebase Admin initialized successfully');
    return app;
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error('Failed to initialize Firebase Admin');
    console.error('Error initializing Firebase Admin:', error);
    return null;
  }
}

// Lazy getter for Firebase Admin Auth - initializes on first use
export function getAdminAuth(): Auth {
  if (adminAuthInstance) {
    return adminAuthInstance;
  }

  if (!adminApp) {
    adminApp = initializeFirebaseAdmin();
  }

  if (!adminApp) {
    if (initializationError) {
      throw initializationError;
    }
    throw new Error('Firebase Admin is not initialized. Check your environment variables.');
  }

  adminAuthInstance = getAuth(adminApp);
  return adminAuthInstance;
}

// Backward compatibility: export an object that throws on method access
class AdminAuthProxy {
  private getAuth(): Auth {
    return getAdminAuth();
  }

  getUser(uid: string) {
    return this.getAuth().getUser(uid);
  }

  getUserByEmail(email: string) {
    return this.getAuth().getUserByEmail(email);
  }

  listUsers(maxResults?: number, pageToken?: string) {
    return this.getAuth().listUsers(maxResults, pageToken);
  }

  verifyIdToken(idToken: string, checkRevoked?: boolean) {
    return this.getAuth().verifyIdToken(idToken, checkRevoked);
  }

  createCustomToken(uid: string, developerClaims?: object) {
    return this.getAuth().createCustomToken(uid, developerClaims);
  }

  // Add any other methods you need here
}

export const adminAuth = new AdminAuthProxy() as unknown as Auth;
export default adminApp;
