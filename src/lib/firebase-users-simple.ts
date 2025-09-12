import { FirebaseAuthUser } from '@/app/api/users/route';

/**
 * Fetch all Firebase Auth users
 */
export const fetchAllUsers = async (): Promise<FirebaseAuthUser[]> => {
  try {
    const response = await fetch('/api/users');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    
    const data = await response.json();
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
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'count' })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user count: ${response.statusText}`);
    }
    
    const data = await response.json();
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
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sample', maxResults: count })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get sample users: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Error getting sample users:', error);
    throw error;
  }
};
