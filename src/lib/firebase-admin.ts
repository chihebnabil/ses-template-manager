import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Firebase Admin SDK configuration
let adminApp;

try {
  // Check if admin app is already initialized
  if (getApps().length === 0) {
    // Initialize with service account
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  } else {
    adminApp = getApps()[0];
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

export const adminAuth = getAuth(adminApp);
export default adminApp;
