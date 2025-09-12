
export interface EmailTemplate {
  id: string;
  TemplateName: string;
  SubjectPart: string;
  HtmlPart: string;
  TextPart: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEmailTemplateInput = Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEmailTemplateInput = Partial<CreateEmailTemplateInput>;

export interface SendEmailParams {
  templateName: string;
  fromEmail: string;
  toEmails: string[];
  templateData?: Record<string, any>;
}

// Firebase Auth User interfaces (updated for Firebase Auth instead of Firestore)
export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
  disabled: boolean;
  createdAt: Date;
  lastSignInTime?: Date;
  providerData: Array<{
    providerId: string;
    uid: string;
    email?: string;
    displayName?: string;
  }>;
  customClaims?: Record<string, any>;
}

export interface UserFilters {
  emailVerified?: boolean;
  disabled?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  emailDomain?: string;
  searchQuery?: string;
  provider?: string;
}

// Bulk Email interfaces
export interface BulkEmailRequest {
  templateName: string;
  fromEmail: string;
  templateData?: Record<string, any>;
  userFilters?: UserFilters;
  maxUsers?: number;
  batchSize?: number;
  delayBetweenBatches?: number;
}

export interface BulkEmailResult {
  totalUsers: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    userEmail: string;
    error: string;
  }>;
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
