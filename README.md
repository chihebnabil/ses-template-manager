# SES Template Manager

A secure web application for managing and sending emails using AWS SES (Simple Email Service) with simplified AWS credentials authentication and comprehensive security features.

## Screenshot

![Features Preview](./screenshot.PNG)

## Features

### 🔐 Security First
- **AWS Credentials Authentication**: Simple authentication using AWS credentials validation
- **Session-based Security**: Secure session management with 24-hour expiration
- **Server-side Validation**: All AWS operations handled securely on the server
- **Origin Validation**: CORS protection with configurable allowed origins
- **Rate Limiting**: Prevent abuse with configurable request limits
- **Audit Logging**: Complete security audit trail for all operations

### 📧 Email Management
- **Template Management**: Create, edit, and manage SES email templates with a clean UI
- **Bulk Email Campaigns**: Send templated emails to your Firebase user base (Firebase still used for user management)
- **User Filtering**: Target specific users based on various criteria (active status, creation date, email domain, etc.)
- **Batch Processing**: Send emails in configurable batches with rate limiting
- **Real-time Progress**: Track campaign progress with detailed results and error reporting

### 🎨 User Experience
- **Mobile Responsive**: Modern UI that works on all devices
- **Real-time Updates**: Live progress tracking for bulk email campaigns
- **Error Handling**: Comprehensive error reporting and recovery

## Authentication Model

This application uses a simplified authentication system:

1. **AWS Credentials Validation**: Login requires AWS credentials that match environment variables
2. **Session Management**: Secure 24-hour sessions stored in localStorage
3. **Server-side Security**: All AWS operations are handled server-side for security
4. **Template Management**: Full CRUD operations with session validation
5. **Bulk Email**: Firebase integration maintained for user management features

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

#### AWS SES Configuration (Required for Login)
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
FROM_EMAIL=noreply@yourdomain.com
```

#### Firebase Configuration (Optional - for bulk email features only)
```bash
# Public Firebase config (frontend) - Only needed for bulk email features
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (server-side) - Only needed for bulk email features
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
```

#### Security Configuration (Optional)
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
2. **Set required environment variables** in Vercel dashboard:
   - AWS SES credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, FROM_EMAIL)
   - Optional: Firebase configuration variables (only if using bulk email features)
   - Optional: `API_KEY` and `NEXT_PUBLIC_API_KEY` (for additional security)
   - Optional: `ALLOWED_ORIGINS` (your production domain for CORS)
3. **Test authentication** with your AWS credentials after deployment

#### Environment Variables for Production
- Use production AWS SES credentials with appropriate permissions
- Set `ALLOWED_ORIGINS` to your production domain only if using CORS protection
- Use production Firebase project credentials if using bulk email features

### Authentication Setup

#### Login Credentials
- **Username**: Your AWS Access Key ID
- **Password**: Your AWS Secret Access Key
- These must match the values in your environment variables (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`)

The application validates these credentials against your environment variables and creates a 24-hour session for authenticated access.

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

### Firebase Setup (Optional - for bulk email features only)

1. **Create a Firebase project** with Authentication enabled
2. **Generate service account key:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Add the credentials to your `.env.local`
3. **Enable Authentication** for user management features

See [BULK_EMAIL_SETUP.md](./BULK_EMAIL_SETUP.md) for detailed setup instructions.

## Authentication

The application uses AWS credentials for authentication:

1. **Login** with your AWS Access Key ID (username) and Secret Access Key (password)
2. **Credentials are validated** against environment variables server-side
3. **Session created** with 24-hour expiration stored in localStorage
4. **All AWS operations** are handled securely on the server

### API Authentication

Template management endpoints require session authentication. Include this header in requests:

```bash
# Session token authentication
x-session-token: your_session_token_from_login
```

### API Endpoints

- `POST /api/auth/validate` - Validate AWS credentials and create session
- `GET /api/templates` - List email templates (requires session)
- `POST /api/templates` - Create email template (requires session)
- `GET /api/templates/[id]` - Get specific template (requires session)
- `PUT /api/templates/[id]` - Update template (requires session)
- `DELETE /api/templates/[id]` - Delete template (requires session)
- `GET /api/users` - List Firebase users (requires Firebase setup)
- `POST /api/bulk-email` - Send bulk emails (requires Firebase setup)

## Usage

### Authentication
1. **Navigate** to the application URL
2. **Enter your AWS credentials** (Access Key ID and Secret Access Key)
3. **Login** to create a 24-hour session

### Template Management
1. **Navigate** to template management after login
2. **Create/Edit** email templates with the visual editor
3. **Test** templates with sample data
4. **Delete** templates as needed

### Bulk Email Campaigns (requires Firebase setup)
1. **Navigate** to "Bulk Email" section
2. **Select** an email template
3. **Configure** user filters and campaign settings
4. **Preview** recipients list
5. **Send** campaign and monitor real-time progress

## Security Best Practices

### For Production Deployment

1. **Use HTTPS only** for all communications
2. **Secure AWS credentials** with minimal required permissions
3. **Monitor access logs** for suspicious activity
4. **Set strict CORS origins** to your production domains only (if using CORS)
5. **Regular security audits** of user permissions
6. **Implement IP allowlisting** if possible
7. **Monitor AWS CloudTrail** for SES API usage

### Environment Security

- Never commit `.env.local` to version control
- Use production AWS credentials for production deployments
- Implement least-privilege access for AWS IAM users
- Monitor AWS SES sending limits and quotas

## Monitoring and Logging

The application logs security-relevant events:

- Authentication attempts and failures
- Session creation and validation
- Template management operations
- AWS SES operations
- Bulk email operations (when Firebase is configured)

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

1. **Authentication failures**: Check that your AWS credentials match the environment variables exactly
2. **AWS SES errors**: Verify SES setup, sending limits, and IAM permissions
3. **CORS errors**: Check ALLOWED_ORIGINS configuration (if using CORS protection)
4. **Session expiration**: Sessions expire after 24 hours - login again
5. **Template not saving**: Check session validity and AWS SES permissions

### Login Issues

- **Invalid credentials**: Ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local match your login credentials
- **Environment variables**: Restart the development server after changing .env.local
- **AWS permissions**: Ensure your AWS user has SES permissions (ListTemplates, GetTemplate, etc.)

### Support

For issues and questions:
1. Check the [AUTH_CHANGES_SUMMARY.md](./AUTH_CHANGES_SUMMARY.md) for authentication details
2. Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
3. Review [BULK_EMAIL_SETUP.md](./BULK_EMAIL_SETUP.md) for Firebase features
4. Create an issue on GitHub

## License

This project is licensed under the MIT License.
