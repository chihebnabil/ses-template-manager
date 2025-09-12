# Bulk Email Feature Setup

This guide explains how to set up and use the new bulk email feature in your SES Template Manager.

## Overview

The bulk email feature allows you to:
- Send templated emails to your Firebase Auth user base
- Filter users based on various criteria (email verification, creation date, provider, etc.)
- Send emails in batches to avoid rate limits
- Track progress and see detailed results
- Preview recipients before sending

## Prerequisites

1. **Firebase Project**: You need a Firebase project with Firebase Authentication enabled
2. **AWS SES**: Already configured in your application
3. **Firebase Admin SDK**: For server-side access to Firebase Auth users

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Firebase Authentication
4. Set up sign-in methods (Email/Password, Google, etc.)

### 2. Generate Service Account Key
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the required values for environment variables

### 3. Environment Variables
Create a `.env.local` file in your project root:

```env
# Firebase Client Configuration (for frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin SDK Configuration (for server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

## User Data Structure

The bulk email feature works with Firebase Auth users, which have this structure:

```javascript
{
  uid: "user-unique-id",               // Firebase user ID
  email: "user@example.com",           // Required
  displayName: "John Doe",             // Optional
  emailVerified: true,                 // Email verification status
  disabled: false,                     // Account status
  createdAt: Date,                     // Account creation time
  lastSignInTime: Date,                // Last sign-in time
  providerData: [                      // Authentication providers
    {
      providerId: "password",          // or "google.com", "facebook.com", etc.
      uid: "user@example.com",
      email: "user@example.com",
      displayName: "John Doe"
    }
  ],
  customClaims: {                      // Optional custom claims
    role: "admin",
    subscription: "premium"
  }
}
```

## Using the Bulk Email Feature

### 1. Access the Feature
- Login with your AWS credentials
- Navigate to "Bulk Email" in the top navigation

### 2. Setup Email Campaign
1. **Select Template**: Choose from your existing SES templates
2. **From Email**: Enter the sender email address
3. **Template Data**: Add JSON data that will be merged with user data
4. **Batch Settings**: Configure batch size and delays

### 3. Filter Users
Apply filters to target specific users:
- **Search**: Filter by email or display name
- **Email Domain**: Target users with specific email domains
- **Email Verified**: Include only users with verified emails
- **Active Status**: Exclude disabled accounts
- **Date Range**: Filter by account creation date
- **Auth Provider**: Filter by authentication method (Email, Google, etc.)

### 4. Preview Recipients
- Click "Preview Recipients" to see who will receive emails
- Review the estimated count and sample users
- Check the campaign summary

### 5. Send Campaign
- Review all settings in the preview tab
- Click "Send Bulk Email" to start the campaign
- Monitor progress in real-time
- View detailed results including errors

## Template Data Merging

The system automatically merges your template data with user data:

```json
{
  "company_name": "Your Company",           // From template data
  "user_email": "user@example.com",        // From user record
  "user_name": "John Doe",                 // From user displayName or email
  "user_id": "firebase-uid-123",           // From user uid
  "user_verified": true,                   // From user emailVerified
  "user_created": "2023-01-15T10:30:00Z",  // From user createdAt
  "user_last_signin": "2023-12-01T14:20:00Z", // From lastSignInTime
  "role": "admin",                         // From customClaims
  "subscription": "premium"                // From customClaims
}
```

## Best Practices

### Rate Limiting
- Use appropriate batch sizes (10-50 emails per batch)
- Add delays between batches (1-5 seconds)
- Monitor AWS SES sending quotas

### Testing
- Always test with a small group first
- Use the preview feature to verify recipients
- Check template data is correctly merged

### Error Handling
- Review failed sends in the results tab
- Check AWS SES bounce/complaint rates
- Maintain clean email lists

### Performance
- For large campaigns (1000+ users), consider:
  - Smaller batch sizes
  - Longer delays between batches
  - Running during off-peak hours

## Troubleshooting

### Common Issues

1. **"No users found"**
   - Check Firebase connection
   - Verify user collection exists
   - Review filter criteria

2. **Template not loading**
   - Ensure AWS credentials are valid
   - Check SES region configuration
   - Verify template exists in SES

3. **Firebase connection errors**
   - Verify environment variables
   - Check Firebase project permissions
   - Ensure Firestore is enabled

4. **Email sending failures**
   - Check AWS SES sending limits
   - Verify sender email is verified in SES
   - Review recipient email validity

### Debug Mode
Enable debug logging by opening browser console to see detailed error messages.

## Security Considerations

- Store Firebase config in environment variables
- Use Firebase Security Rules to protect user data
- Implement proper authentication for admin features
- Monitor AWS SES usage and costs
- Regular audit of email campaigns and results

## Support

For issues or questions:
1. Check the browser console for errors
2. Review AWS SES logs
3. Verify Firebase Firestore permissions
4. Test with a small batch first
