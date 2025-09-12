import { sendTemplatedEmail } from './aws-ses';
import { getUsers, UserFilters, BulkEmailResult, FirebaseUser } from './firebase-users';
import { toast } from 'sonner';

export interface BulkEmailRequest {
  templateName: string;
  fromEmail: string;
  templateData?: Record<string, any>;
  userFilters?: UserFilters;
  maxUsers?: number;
  batchSize?: number;
  delayBetweenBatches?: number; // in milliseconds
}

export interface BulkEmailProgress {
  totalUsers: number;
  processedUsers: number;
  successCount: number;
  failureCount: number;
  currentBatch: number;
  totalBatches: number;
  isComplete: boolean;
  errors: Array<{
    userEmail: string;
    error: string;
  }>;
}

// Send bulk emails with progress tracking
export const sendBulkTemplatedEmails = async (
  request: BulkEmailRequest,
  onProgress?: (progress: BulkEmailProgress) => void
): Promise<BulkEmailResult> => {
  const {
    templateName,
    fromEmail,
    templateData = {},
    userFilters,
    maxUsers = 1000,
    batchSize = 10,
    delayBetweenBatches = 1000 // 1 second delay between batches
  } = request;

  try {
    // Get users based on filters
    const users = await getUsers(userFilters, maxUsers);
    
    if (users.length === 0) {
      toast.error('No users found matching the specified criteria');
      throw new Error('No users found matching the specified criteria');
    }

    const totalUsers = users.length;
    const totalBatches = Math.ceil(totalUsers / batchSize);
    
    let processedUsers = 0;
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ userEmail: string; error: string }> = [];

    // Process users in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, totalUsers);
      const batchUsers = users.slice(startIndex, endIndex);

      // Send emails to current batch
      const batchPromises = batchUsers.map(async (user: FirebaseUser) => {
        try {
          // Merge user data with template data
          const emailTemplateData = {
            ...templateData,
            user_email: user.email,
            user_name: user.displayName || user.email.split('@')[0],
            user_id: user.uid,
            user_verified: user.emailVerified,
            user_created: user.createdAt.toISOString(),
            user_last_signin: user.lastSignInTime?.toISOString() || null,
            ...user.customClaims // Include any custom claims as template variables
          };

          await sendTemplatedEmail(
            templateName,
            fromEmail,
            [user.email],
            emailTemplateData
          );

          return { success: true, user };
        } catch (error) {
          console.error(`Failed to send email to ${user.email}:`, error);
          return { 
            success: false, 
            user, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Update counters
      batchResults.forEach(result => {
        processedUsers++;
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          errors.push({
            userEmail: result.user.email,
            error: result.error || 'Unknown error'
          });
        }
      });

      // Report progress
      if (onProgress) {
        onProgress({
          totalUsers,
          processedUsers,
          successCount,
          failureCount,
          currentBatch: batchIndex + 1,
          totalBatches,
          isComplete: processedUsers === totalUsers,
          errors: [...errors] // Create a copy of errors array
        });
      }

      // Add delay between batches (except for the last batch)
      if (batchIndex < totalBatches - 1 && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const result: BulkEmailResult = {
      totalUsers,
      successCount,
      failureCount,
      errors
    };

    // Show completion message
    if (successCount === totalUsers) {
      toast.success(`Successfully sent ${successCount} emails!`);
    } else if (successCount > 0) {
      toast.warning(`Sent ${successCount} emails successfully, ${failureCount} failed`);
    } else {
      toast.error('All email sends failed');
    }

    return result;

  } catch (error) {
    console.error('Error in bulk email send:', error);
    toast.error('Failed to send bulk emails');
    throw error;
  }
};

// Estimate the impact of a bulk email (without sending)
export const estimateBulkEmail = async (
  userFilters?: UserFilters,
  maxUsers: number = 1000
): Promise<{
  estimatedUsers: number;
  sampleUsers: FirebaseUser[];
}> => {
  try {
    const users = await getUsers(userFilters, Math.min(maxUsers, 100)); // Limit to 100 for estimation
    
    return {
      estimatedUsers: users.length,
      sampleUsers: users.slice(0, 5) // Return first 5 as sample
    };
  } catch (error) {
    console.error('Error estimating bulk email:', error);
    throw error;
  }
};
