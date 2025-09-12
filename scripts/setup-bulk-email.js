#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🔧 SES Template Manager - Bulk Email Setup');
  console.log('==========================================\n');
  
  console.log('This script will help you set up the environment variables for the bulk email feature.');
  console.log('You will need your Firebase project configuration and service account details.\n');
  
  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      process.exit(0);
    }
  }
  
  console.log('\n📋 Firebase Client Configuration (from Firebase Console > Project Settings > General):');
  const apiKey = await question('Firebase API Key: ');
  const authDomain = await question('Firebase Auth Domain: ');
  const projectId = await question('Firebase Project ID: ');
  const storageBucket = await question('Firebase Storage Bucket: ');
  const messagingSenderId = await question('Firebase Messaging Sender ID: ');
  const appId = await question('Firebase App ID: ');
  const measurementId = await question('Firebase Measurement ID (optional): ');
  
  console.log('\n🔑 Firebase Admin SDK Configuration (from Firebase Console > Project Settings > Service Accounts):');
  const adminProjectId = await question('Admin Project ID (same as above): ') || projectId;
  const clientEmail = await question('Service Account Client Email: ');
  
  console.log('\n📝 For the private key, paste the entire key including BEGIN/END lines:');
  console.log('Tip: Copy from the downloaded service account JSON file');
  const privateKey = await question('Service Account Private Key: ');
  
  // Create .env.local content
  const envContent = `# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${apiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${authDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${projectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${storageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${appId}
${measurementId ? `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${measurementId}` : ''}

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=${adminProjectId}
FIREBASE_CLIENT_EMAIL=${clientEmail}
FIREBASE_PRIVATE_KEY="${privateKey}"
`;
  
  // Write .env.local file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Environment configuration saved to .env.local');
  console.log('\n🚀 Next steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Login with your AWS SES credentials');
  console.log('3. Navigate to "Bulk Email" to test the feature');
  console.log('4. Make sure you have users in Firebase Authentication');
  console.log('\n📖 For detailed setup instructions, see BULK_EMAIL_SETUP.md');
  
  rl.close();
}

setupEnvironment().catch((error) => {
  console.error('Error during setup:', error);
  process.exit(1);
});
