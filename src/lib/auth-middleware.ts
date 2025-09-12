import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export interface AuthContext {
  isAuthenticated: boolean;
  userId?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

/**
 * Comprehensive authentication and authorization middleware
 */
export class AuthMiddleware {
  /**
   * Validate API key from request headers
   */
  private static validateApiKey(request: NextRequest): boolean {
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.API_KEY;
    
    if (!expectedApiKey) {
      console.warn('API_KEY environment variable not set');
      return false;
    }
    
    return apiKey === expectedApiKey;
  }

  /**
   * Validate Firebase authentication token
   */
  private static async validateFirebaseToken(request: NextRequest): Promise<{ isValid: boolean; userId?: string; userEmail?: string }> {
    try {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { isValid: false };
      }
      
      const token = authHeader.substring(7);
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      return {
        isValid: true,
        userId: decodedToken.uid,
        userEmail: decodedToken.email
      };
    } catch (error) {
      console.error('Firebase token validation failed:', error);
      return { isValid: false };
    }
  }

  /**
   * Validate request origin
   */
  private static validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    // For development, allow localhost
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
    }
    
    if (!origin) {
      // Allow requests without origin (e.g., server-to-server)
      return true;
    }
    
    return allowedOrigins.includes(origin);
  }

  /**
   * Validate AWS credentials are configured
   */
  private static validateAwsCredentials(): boolean {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS credentials not configured');
      return false;
    }
    
    return true;
  }

  /**
   * Check if user has admin privileges
   */
  private static async checkAdminPrivileges(userId: string): Promise<boolean> {
    try {
      const userRecord = await adminAuth.getUser(userId);
      return userRecord.customClaims?.admin === true;
    } catch (error) {
      console.error('Error checking admin privileges:', error);
      return false;
    }
  }

  /**
   * Main authentication method
   */
  public static async authenticate(
    request: NextRequest,
    options: {
      requireApiKey?: boolean;
      requireFirebaseAuth?: boolean;
      requireAdmin?: boolean;
      validateOrigin?: boolean;
      validateAwsCredentials?: boolean;
    } = {}
  ): Promise<{ 
    success: boolean; 
    context?: AuthContext; 
    error?: string; 
    response?: NextResponse 
  }> {
    const {
      requireApiKey = true,
      requireFirebaseAuth = true,
      requireAdmin = false,
      validateOrigin = true,
      validateAwsCredentials = true
    } = options;

    try {
      // Validate origin
      if (validateOrigin && !this.validateOrigin(request)) {
        return {
          success: false,
          error: 'Invalid request origin',
          response: NextResponse.json(
            { error: 'Unauthorized: Invalid origin' },
            { status: 403 }
          )
        };
      }

      // Validate AWS credentials
      if (validateAwsCredentials && !this.validateAwsCredentials()) {
        return {
          success: false,
          error: 'AWS credentials validation failed',
          response: NextResponse.json(
            { error: 'Server configuration error' },
            { status: 500 }
          )
        };
      }

      // Validate API key
      if (requireApiKey && !this.validateApiKey(request)) {
        return {
          success: false,
          error: 'Invalid API key',
          response: NextResponse.json(
            { error: 'Unauthorized: Invalid API key' },
            { status: 401 }
          )
        };
      }

      let authContext: AuthContext = { isAuthenticated: false };

      // Validate Firebase authentication
      if (requireFirebaseAuth) {
        const firebaseAuth = await this.validateFirebaseToken(request);
        
        if (!firebaseAuth.isValid) {
          return {
            success: false,
            error: 'Invalid Firebase token',
            response: NextResponse.json(
              { error: 'Unauthorized: Invalid authentication token' },
              { status: 401 }
            )
          };
        }

        authContext = {
          isAuthenticated: true,
          userId: firebaseAuth.userId,
          userEmail: firebaseAuth.userEmail
        };

        // Check admin privileges if required
        if (requireAdmin && firebaseAuth.userId) {
          const isAdmin = await this.checkAdminPrivileges(firebaseAuth.userId);
          
          if (!isAdmin) {
            return {
              success: false,
              error: 'Admin privileges required',
              response: NextResponse.json(
                { error: 'Forbidden: Admin privileges required' },
                { status: 403 }
              )
            };
          }
          
          authContext.isAdmin = true;
        }
      } else if (requireApiKey) {
        // If only API key is required, mark as authenticated
        authContext.isAuthenticated = true;
      }

      return {
        success: true,
        context: authContext
      };

    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
        response: NextResponse.json(
          { error: 'Internal server error during authentication' },
          { status: 500 }
        )
      };
    }
  }

  /**
   * Simple rate limiting helper
   */
  public static createRateLimiter(maxRequests: number = 100, windowMs: number = 60000) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier);

      if (!userRequests || now > userRequests.resetTime) {
        requests.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (userRequests.count >= maxRequests) {
        return false;
      }

      userRequests.count++;
      return true;
    };
  }
}

/**
 * Utility function to get client IP address
 */
export function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIp) {
    return xRealIp;
  }
  
  return 'unknown';
}