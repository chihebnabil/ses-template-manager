# Authentication Changes

## Simplified AWS Credentials Authentication

The authentication system has been simplified to use only AWS credentials matching environment variables, removing the Firebase authentication requirement for basic template management.

### How It Works

1. **Login Process**: Users enter their AWS credentials (Access Key ID, Secret Access Key, Region)
2. **Validation**: Credentials are validated against environment variables on the server
3. **Session**: A simple session token is stored in localStorage for subsequent requests

### Environment Variables Required

```bash
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
```

### API Routes

- **Templates API** (`/api/templates`) - Requires valid session token
- **Auth Validation** (`/api/auth/validate`) - Validates AWS credentials against env vars

### Security Notes

- Only users with credentials matching the server environment variables can authenticate
- Sessions expire after 24 hours
- All API requests require valid session tokens
- No external authentication providers required for basic functionality

### Firebase Dependencies

Firebase authentication is still used for:
- Bulk email features (user management)
- User listing and management APIs

If you don't need these features, you can ignore the Firebase configuration.