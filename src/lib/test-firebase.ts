// Test Firebase Auth Connection via API
// This is a simple test to verify Firebase Auth API connection
// Run this in browser console or call from component

const testFirebaseAuthConnection = async () => {
  try {
    console.log('Testing Firebase Auth API connection...');
    
    // Test API connection by fetching a few users
    const response = await fetch('/api/users?maxResults=5');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Connected to Firebase Auth API successfully!`);
    console.log(`📊 Found ${data.users.length} users (showing first 5)`);
    
    if (data.users.length === 0) {
      console.log('⚠️  No users found in Firebase Auth. Create some test users:');
      console.log(`
// You can create users through:
// 1. Firebase Console → Authentication → Users
// 2. Your app's sign-up flow
// 3. Firebase CLI: firebase auth:import users.json
      `);
    } else {
      console.log('👥 Sample users:');
      data.users.forEach((user: any) => {
        console.log(`   ${user.uid}: ${user.email} (${user.displayName || 'No name'}) - ${user.emailVerified ? 'Verified' : 'Unverified'}`);
      });
    }
    
    // Test filters
    console.log('🔍 Testing filters...');
    const filteredResponse = await fetch('/api/users?emailVerified=true&maxResults=3');
    const filteredData = await filteredResponse.json();
    console.log(`📧 Found ${filteredData.users.length} verified users`);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase Auth API connection failed:', error);
    console.log('🔧 Check your configuration:');
    console.log('   1. Verify .env.local file has correct Firebase Admin config');
    console.log('   2. Ensure Firebase Admin SDK is properly initialized');
    console.log('   3. Check service account has proper permissions');
    console.log('   4. Verify Firebase Authentication is enabled');
    console.log('   5. Make sure API route is accessible');
    return false;
  }
};

// Export for use in component or run directly
export default testFirebaseAuthConnection;

// To test in browser console:
// testFirebaseAuthConnection();
