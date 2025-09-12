# SES Template Manager

SES Template Manager is a web application for managing and sending emails using AWS SES (Simple Email Service). Now includes bulk email capabilities with Firebase user management integration.

## Screenshot

![Features Preview](./screenshot.PNG)

## Features

- **Template Management**: Create, edit, and manage SES email templates with a clean UI
- **Bulk Email Campaigns**: Send templated emails to your Firebase user base
- **User Filtering**: Target specific users based on various criteria (active status, creation date, email domain, etc.)
- **Batch Processing**: Send emails in configurable batches with rate limiting
- **Real-time Progress**: Track campaign progress with detailed results and error reporting
- **Mobile Responsive**: Modern UI that works on all devices

## New: Bulk Email Feature

The bulk email feature allows you to:
- Send campaigns to users from Firebase Authentication
- Filter recipients by email verification, creation date, auth provider, etc.
- Preview recipients before sending
- Monitor sending progress in real-time
- View detailed results and error logs
- Respect AWS SES rate limits with batch processing

See [BULK_EMAIL_SETUP.md](./BULK_EMAIL_SETUP.md) for detailed setup instructions.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/chihebnabil/ses-template-manager
   cd ses-template-manager


2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Firebase configuration values.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Configuration

### AWS SES
- Configure your AWS SES credentials through the application login
- Ensure your sender email is verified in AWS SES
- Check your SES sending limits and quotas

### Firebase (for Bulk Email)
- Create a Firebase project with Firebase Authentication enabled
- Add users through your authentication flow or Firebase Console
- Generate a service account key for server-side access
- Configure Firebase Admin SDK credentials in your `.env.local` file

See [BULK_EMAIL_SETUP.md](./BULK_EMAIL_SETUP.md) for detailed Firebase setup instructions.

## Usage

### Template Management
- Open the application in your browser
- Login with your AWS SES credentials
- Create, edit, and manage email templates
- Test templates with sample data

### Bulk Email Campaigns
- Navigate to "Bulk Email" in the top menu
- Select an email template and configure campaign settings
- Set user filters to target specific recipients
- Preview recipients and review campaign settings
- Send the campaign and monitor progress

## Security Considerations

**Credentials Storage**: AWS SES credentials are stored in the browser's `localStorage`. Ensure that you are using the application in a secure environment to prevent unauthorized access.

**Firebase Security**: Implement proper Firebase Admin SDK security. The bulk email feature uses server-side API routes to access Firebase Auth users securely.


## License

This project is licensed under the MIT License.
