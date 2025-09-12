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

import { apiClient } from './api-client';

export interface UserFilters {
  emailVerified?: boolean;
  disabled?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  emailDomain?: string;
  searchQuery?: string;
  provider?: string;
}

export interface BulkEmailOptions {
  templateName: string;
  fromEmail: string;
  templateData?: Record<string, any>;
  userFilters?: UserFilters;
  maxUsers?: number;
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

// Get users from Firebase Auth via API route
export const getUsers = async (filters?: UserFilters, maxResults: number = 1000): Promise<FirebaseUser[]> => {
  try {
    const searchParams = new URLSearchParams();
    
    if (maxResults) searchParams.set('maxResults', maxResults.toString());
    
    // Add filters to search params
    if (filters?.emailVerified !== undefined) {
      searchParams.set('emailVerified', filters.emailVerified.toString());
    }
    if (filters?.disabled !== undefined) {
      searchParams.set('disabled', filters.disabled.toString());
    }
    if (filters?.createdAfter) {
      searchParams.set('createdAfter', filters.createdAfter.toISOString());
    }
    if (filters?.createdBefore) {
      searchParams.set('createdBefore', filters.createdBefore.toISOString());
    }
    if (filters?.emailDomain) {
      searchParams.set('emailDomain', filters.emailDomain);
    }
    if (filters?.searchQuery) {
      searchParams.set('searchQuery', filters.searchQuery);
    }
    if (filters?.provider) {
      searchParams.set('provider', filters.provider);
    }

    const response = await apiClient.get(`/api/users?${searchParams.toString()}`);
    
    const data = response;
    
    // Convert date strings back to Date objects
    return data.users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      lastSignInTime: user.lastSignInTime ? new Date(user.lastSignInTime) : undefined
    }));
    
  } catch (error) {
    console.error('Error fetching users from Firebase Auth:', error);
    throw new Error('Failed to fetch users from Firebase Auth');
  }
};

// Get user count with filters (for estimation before bulk send)
export const getUserCount = async (filters?: UserFilters): Promise<number> => {
  try {
    const data = await apiClient.post('/api/users', {
      action: 'count',
      filters,
      maxResults: 10000
    });

    return data.count;
  } catch (error) {
    console.error('Error counting users:', error);
    throw new Error('Failed to count users');
  }
};

// Get sample users for preview (first 5 users that match filters)
export const getSampleUsers = async (filters?: UserFilters): Promise<FirebaseUser[]> => {
  try {
    const data = await apiClient.post('/api/users', {
      action: 'sample',
      filters,
      maxResults: 20
    });
    
    // Convert date strings back to Date objects
    return data.users.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      lastSignInTime: user.lastSignInTime ? new Date(user.lastSignInTime) : undefined
    }));
  } catch (error) {
    console.error('Error fetching sample users:', error);
    throw new Error('Failed to fetch sample users');
  }
};
