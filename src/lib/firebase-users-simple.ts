import { FirebaseAuthUser } from '@/app/api/users/route';
import { apiClient } from './api-client';

/**
 * Fetch all Firebase Auth users
 */
export const fetchAllUsers = async (): Promise<FirebaseAuthUser[]> => {
  try {
    const data = await apiClient.get('/api/users');
    return data.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get users count
 */
export const getUsersCount = async (): Promise<number> => {
  try {
    const data = await apiClient.post('/api/users', { action: 'count' });
    return data.count || 0;
  } catch (error) {
    console.error('Error getting user count:', error);
    throw error;
  }
};

/**
 * Get sample users for preview
 */
export const getSampleUsers = async (count: number = 5): Promise<FirebaseAuthUser[]> => {
  try {
    const data = await apiClient.post('/api/users', { action: 'sample', maxResults: count });
    return data.users || [];
  } catch (error) {
    console.error('Error getting sample users:', error);
    throw error;
  }
};
