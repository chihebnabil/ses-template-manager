/**
 * Utility for making authenticated API calls with session tokens
 */
export class AuthenticatedApiClient {
  private static getSessionToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    const credentials = localStorage.getItem('awsCredentials');
    return credentials;
  }

  private static isSessionValid(): boolean {
    if (typeof window === 'undefined') return false;
    
    const credentials = localStorage.getItem('awsCredentials');
    if (!credentials) return false;

    try {
      const sessionData = JSON.parse(credentials);
      if (!sessionData.isAuthenticated || !sessionData.timestamp) return false;

      // Check if session is not too old (24 hours)
      const sessionAge = Date.now() - sessionData.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      return sessionAge < maxAge;
    } catch {
      return false;
    }
  }

  /**
   * Make an authenticated API request
   */
  public static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      // Check if session is valid
      if (!this.isSessionValid()) {
        throw new Error('Session expired. Please log in again.');
      }

      // Get session token
      const sessionToken = this.getSessionToken();
      if (!sessionToken) {
        throw new Error('No authentication session found. Please log in.');
      }

      // Prepare headers
      const headers = new Headers(options.headers);
      headers.set('x-session-token', sessionToken);
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