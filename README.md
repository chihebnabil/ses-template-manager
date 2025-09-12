# SES Template Manager

A secure web application for managing and sending emails using AWS SES (Simple Email Service) with Firebase user management integration and comprehensive security features.

## Screenshot

![Features Preview](./screenshot.PNG)

## Features

### 🔐 Security First
- **API Key Authentication**: Secure server-to-server authentication
- **Firebase Authentication**: User authentication and authorization
- **Admin-only Operations**: Sensitive operations require admin privileges
- **Origin Validation**: CORS protection with configurable allowed origins
- **Rate Limiting**: Prevent abuse with configurable request limits
- **Audit Logging**: Complete security audit trail for all operations

### 📧 Email Management
- **Template Management**: Create, edit, and manage SES email templates with a clean UI
- **Bulk Email Campaigns**: Send templated emails to your Firebase user base
- **User Filtering**: Target specific users based on various criteria (active status, creation date, email domain, etc.)
- **Batch Processing**: Send emails in configurable batches with rate limiting
- **Real-time Progress**: Track campaign progress with detailed results and error reporting

### 🎨 User Experience
- **Mobile Responsive**: Modern UI that works on all devices
- **Real-time Updates**: Live progress tracking for bulk email campaigns
- **Error Handling**: Comprehensive error reporting and recovery

## Security Model

This application implements multiple layers of security:

1. **API Authentication**: All API endpoints require a valid API key
2. **Firebase Authentication**: Users must authenticate through Firebase
3. **Role-based Access**: Admin privileges required for sensitive operations
4. **Request Validation**: Origin validation and input sanitization
5. **Rate Limiting**: Protection against abuse and DoS attacks
6. **Audit Logging**: Complete logging of all security-relevant events

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chihebnabil/ses-template-manager
   cd ses-template-manager/next-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
4. **Configure your environment** (see Configuration section below)

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## Configuration

### Required Environment Variables

#### Firebase Configuration
```bash
# Public Firebase config (frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (server-side)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
```

#### AWS SES Configuration
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
FROM_EMAIL=noreply@yourdomain.com
```

#### Security Configuration
```bash
# Generate with: openssl rand -hex 32
API_KEY=your_secure_api_key_here
NEXT_PUBLIC_API_KEY=your_secure_api_key_here

# Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Deployment

#### Vercel Deployment
1. **Deploy to Vercel** and configure environment variables
2. **Set all environment variables** in Vercel dashboard:
   - All Firebase configuration variables
   - AWS SES credentials
   - `API_KEY` and `NEXT_PUBLIC_API_KEY` (same value)
   - `ALLOWED_ORIGINS` (your production domain)
3. **Test authentication** after deployment

#### Environment Variables for Production
- Use different API keys for different environments
- Set `ALLOWED_ORIGINS` to your production domain only
- Use production Firebase project credentials

### AWS SES Setup

1. **Verify your sending domain/email** in AWS SES
2. **Configure AWS IAM** with minimal required permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendTemplatedEmail",
           "ses:ListTemplates",
           "ses:GetTemplate"
         ],
         "Resource": "*"
       }
     ]
   }
   ```
3. **Check your SES sending limits** and quotas

### Firebase Setup

1. **Create a Firebase project** with Authentication enabled
2. **Generate service account key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Add the credentials to your `.env.local`
3. **Set up admin users:**
   ```javascript
   // Use Firebase Admin SDK or Console to set custom claims
   admin.auth().setCustomUserClaims(uid, { admin: true });
   ```

See [BULK_EMAIL_SETUP.md](./BULK_EMAIL_SETUP.md) for detailed setup instructions.

## API Authentication

All API endpoints require authentication. Include these headers in your requests:

```bash
# API Key authentication
x-api-key: your_secure_api_key

# Firebase authentication token
Authorization: Bearer your_firebase_id_token
```

### API Endpoints

- `GET /api/templates` - List email templates (requires authentication)
- `GET /api/users` - List Firebase users (requires admin privileges)
- `POST /api/bulk-email` - Send bulk emails (requires authentication)

## Usage

### Template Management
1. **Login** with your Firebase account
2. **Navigate** to template management
3. **Create/Edit** email templates with the visual editor
4. **Test** templates with sample data

### Bulk Email Campaigns
1. **Navigate** to "Bulk Email" section
2. **Select** an email template
3. **Configure** user filters and campaign settings
4. **Preview** recipients list
5. **Send** campaign and monitor real-time progress

### Admin Operations
- **User Management**: View and manage Firebase users
- **Campaign Monitoring**: Access detailed campaign logs
- **Security Audit**: Review access logs and security events

## Security Best Practices

### For Production Deployment

1. **Use HTTPS only** for all communications
2. **Rotate API keys regularly** (monthly recommended)
3. **Monitor access logs** for suspicious activity
4. **Set strict CORS origins** to your production domains only
5. **Use Firebase Security Rules** for additional protection
6. **Enable Firebase App Check** for mobile/web app attestation
7. **Implement IP allowlisting** if possible
8. **Regular security audits** of user permissions

### Environment Security

- Never commit `.env.local` to version control
- Use different API keys for different environments
- Implement least-privilege access for all services
- Monitor AWS CloudTrail and Firebase Auth logs

## Monitoring and Logging

The application logs all security-relevant events:

- Authentication attempts and failures
- API access with user context
- Bulk email operations
- Admin operations
- Rate limiting events

Monitor these logs for:
- Unusual access patterns
- Failed authentication attempts
- High-volume operations
- Geographic anomalies

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## Troubleshooting

### Common Issues

1. **Authentication failures**: Check Firebase configuration and API keys
2. **AWS SES errors**: Verify SES setup and sending limits
3. **CORS errors**: Check ALLOWED_ORIGINS configuration
4. **Rate limiting**: Adjust rate limits or implement backoff strategies

### Support

For issues and questions:
1. Check the [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
2. Review [BULK_EMAIL_SETUP.md](./BULK_EMAIL_SETUP.md)
3. Create an issue on GitHub

## License

This project is licensed under the MIT License.
