import { NextRequest, NextResponse } from 'next/server';

export interface AuthContext {
  isAuthenticated: boolean;
  region?: string;
}

/**
 * Simple authentication middleware for AWS credentials
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
   * Validate session token (simple check for authenticated session)
   */
  private static validateSession(request: NextRequest): { isValid: boolean; region?: string } {
    try {
      const sessionHeader = request.headers.get('x-session-token');
      
      if (!sessionHeader) {
        return { isValid: false };
      }
      
      // Simple session validation - in a real app you'd check against a database/redis
      // For now, we just check if it's a valid JSON with required fields
      const sessionData = JSON.parse(sessionHeader);
      
      if (sessionData.isAuthenticated && sessionData.timestamp) {
        // Check if session is not too old (24 hours)
        const sessionAge = Date.now() - sessionData.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge < maxAge) {
          return {
            isValid: true,
            region: sessionData.region
          };
        }
      }
      
      return { isValid: false };
    } catch (error) {
      console.error('Session validation failed:', error);
      return { isValid: false };
    }
  }

  /**
   * Main authentication method
   */
  public static async authenticate(
    request: NextRequest,
    options: {
      requireApiKey?: boolean;
      requireSession?: boolean;
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
      requireApiKey = false,
      requireSession = true,
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

      // Validate session
      if (requireSession) {
        const sessionAuth = this.validateSession(request);
        
        if (!sessionAuth.isValid) {
          return {
            success: false,
            error: 'Invalid session',
            response: NextResponse.json(
              { error: 'Unauthorized: Invalid or expired session' },
              { status: 401 }
            )
          };
        }

        authContext = {
          isAuthenticated: true,
          region: sessionAuth.region
        };
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