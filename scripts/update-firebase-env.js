#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to update .env file with Firebase credentials from service-account.json
 * This script reads the service-account.json file and updates the FIREBASE_PRIVATE_KEY
 * in the .env file with the proper format (single line with \n escape sequences)
 */

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', 'service-account.json');
const ENV_PATH = path.join(__dirname, '..', '.env');

try {
  // Read service account JSON
  console.log('Reading service-account.json...');
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  
  // Get the private key and format it for .env (replace actual newlines with \n)
  const privateKey = serviceAccount.private_key.replace(/\n/g, '\\n');
  const projectId = serviceAccount.project_id;
  const clientEmail = serviceAccount.client_email;
  
  console.log('Private key formatted successfully');
  
  // Read current .env file
  console.log('Reading .env file...');
  let envContent = fs.readFileSync(ENV_PATH, 'utf8');
  
  // Update or add FIREBASE_PRIVATE_KEY
  const privateKeyRegex = /^FIREBASE_PRIVATE_KEY=.*$/m;
  if (privateKeyRegex.test(envContent)) {
    console.log('Updating existing FIREBASE_PRIVATE_KEY...');
    envContent = envContent.replace(privateKeyRegex, `FIREBASE_PRIVATE_KEY=${privateKey}`);
  } else {
    console.log('Adding FIREBASE_PRIVATE_KEY...');
    // Find the Firebase Admin SDK Configuration section
    const adminSdkRegex = /(# Firebase Admin SDK Configuration[^\n]*\n)/;
    if (adminSdkRegex.test(envContent)) {
      envContent = envContent.replace(
        adminSdkRegex,
        `$1FIREBASE_PRIVATE_KEY=${privateKey}\n`
      );
    } else {
      // If section doesn't exist, add it at the end
      envContent += `\n# Firebase Admin SDK Configuration\nFIREBASE_PRIVATE_KEY=${privateKey}\n`;
    }
  }
  
  // Update or add FIREBASE_PROJECT_ID
  const projectIdRegex = /^FIREBASE_PROJECT_ID=.*$/m;
  if (projectIdRegex.test(envContent)) {
    console.log('Updating existing FIREBASE_PROJECT_ID...');
    envContent = envContent.replace(projectIdRegex, `FIREBASE_PROJECT_ID=${projectId}`);
  } else {
    console.log('Adding FIREBASE_PROJECT_ID...');
    const adminSdkRegex = /(# Firebase Admin SDK Configuration[^\n]*\n)/;
    if (adminSdkRegex.test(envContent)) {
      envContent = envContent.replace(
        adminSdkRegex,
        `$1FIREBASE_PROJECT_ID=${projectId}\n`
      );
    } else {
      envContent += `FIREBASE_PROJECT_ID=${projectId}\n`;
    }
  }
  
  // Update or add FIREBASE_CLIENT_EMAIL
  const clientEmailRegex = /^FIREBASE_CLIENT_EMAIL=.*$/m;
  if (clientEmailRegex.test(envContent)) {
    console.log('Updating existing FIREBASE_CLIENT_EMAIL...');
    envContent = envContent.replace(clientEmailRegex, `FIREBASE_CLIENT_EMAIL=${clientEmail}`);
  } else {
    console.log('Adding FIREBASE_CLIENT_EMAIL...');
    const adminSdkRegex = /(# Firebase Admin SDK Configuration[^\n]*\n)/;
    if (adminSdkRegex.test(envContent)) {
      envContent = envContent.replace(
        adminSdkRegex,
        `$1FIREBASE_CLIENT_EMAIL=${clientEmail}\n`
      );
    } else {
      envContent += `FIREBASE_CLIENT_EMAIL=${clientEmail}\n`;
    }
  }
  
  // Write updated .env file
  console.log('Writing updated .env file...');
  fs.writeFileSync(ENV_PATH, envContent);
  
  console.log('\n✅ Successfully updated .env file with Firebase credentials!');
  console.log('\nUpdated fields:');
  console.log(`- FIREBASE_PROJECT_ID: ${projectId}`);
  console.log(`- FIREBASE_CLIENT_EMAIL: ${clientEmail}`);
  console.log(`- FIREBASE_PRIVATE_KEY: [UPDATED - ${privateKey.length} characters]`);
  console.log('\nNote: The private key is stored with \\n escape sequences.');
  console.log('The firebase-admin.ts file will convert these to actual newlines using .replace(/\\\\n/g, \'\\n\')');
  
} catch (error) {
  console.error('❌ Error updating .env file:', error.message);
  
  if (error.code === 'ENOENT') {
    if (error.path.includes('service-account.json')) {
      console.error('\nPlease make sure service-account.json exists in the project root.');
      console.error('You can download it from Firebase Console:');
      console.error('https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk');
    } else if (error.path.includes('.env')) {
      console.error('\nPlease create a .env file in the project root first.');
    }
  }
  
  process.exit(1);
}
