import { getAuth } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Utility for making authenticated API calls with required headers
 */
export class AuthenticatedApiClient {
  private static getApiKey(): string {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    if (!apiKey) {
      throw new Error('API key not configured. Please set NEXT_PUBLIC_API_KEY environment variable.');
    }
    return apiKey;
  }

  private static async getFirebaseToken(): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated. Please log in first.');
    }
    
    try {
      const token = await currentUser.getIdToken();
      return token;
    } catch (error) {
      throw new Error('Failed to get authentication token. Please log in again.');
    }
  }

  /**
   * Make an authenticated API request
   */
  public static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      // Get authentication credentials
      const apiKey = this.getApiKey();
      const firebaseToken = await this.getFirebaseToken();

      // Prepare headers
      const headers = new Headers(options.headers);
      headers.set('x-api-key', apiKey);
      headers.set('Authorization', `Bearer ${firebaseToken}`);
      headers.set('Content-Type', 'application/json');

      // Make the request
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      console.error('Authenticated API call failed:', error);
      throw error;
    }
  }

  /**
   * Make an authenticated GET request and return JSON
   */
  public static async get<T = any>(url: string): Promise<T> {
    const response = await this.fetch(url, { method: 'GET' });
    return response.json();
  }

  /**
   * Make an authenticated POST request and return JSON
   */
  public static async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.fetch(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
    return response.json();
  }

  /**
   * Make an authenticated PUT request and return JSON
   */
  public static async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.fetch(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
    return response.json();
  }

  /**
   * Make an authenticated DELETE request and return JSON
   */
  public static async delete<T = any>(url: string): Promise<T> {
    const response = await this.fetch(url, { method: 'DELETE' });
    return response.json();
  }
}

/**
 * Convenience wrapper for authenticated API calls
 */
export const apiClient = AuthenticatedApiClient;