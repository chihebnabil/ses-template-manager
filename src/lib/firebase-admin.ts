import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

// Firebase Admin SDK configuration
let adminApp: App | undefined;

function initializeFirebaseAdmin(): App {
  // Check if admin app is already initialized
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Validate required environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing required Firebase Admin environment variables. ' +
      'Please ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.'
    );
  }

  // Initialize with service account
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n')
    }),
    projectId
  });
}

// Initialize the app
try {
  adminApp = initializeFirebaseAdmin();
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  throw error;
}

// Export a function to get the auth instance safely
export function getAdminAuth(): Auth {
  if (!adminApp) {
    adminApp = initializeFirebaseAdmin();
  }
  return getAuth(adminApp);
}

export const adminAuth = getAdminAuth();
export default adminApp;
