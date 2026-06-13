/**
 * Security Configuration
 * 
 * Centralized security settings for the application
 */

export const securityConfig = {
  // Cookie settings
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: {
      accessToken: 15 * 60, // 15 minutes
      refreshToken: 7 * 24 * 60 * 60, // 7 days
      session: 24 * 60 * 60, // 24 hours
    },
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-API-Key',
      'X-Session-ID',
      'X-Visitor-ID',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['X-Request-ID', 'X-Cache-Status', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours
  },

  // Rate limiting configuration
  rateLimit: {
    anonymous: {
      max: 100,
      timeWindow: 15 * 60 * 1000, // 15 minutes
    },
    authenticated: {
      max: 1000,
      timeWindow: 15 * 60 * 1000, // 15 minutes
    },
    strict: {
      // For sensitive endpoints (login, register)
      max: 10,
      timeWindow: 15 * 60 * 1000, // 15 minutes
    },
  },

  // Password policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    maxLength: 128,
  },

  // OAuth redirect URIs (whitelist)
  oauth: {
    allowedRedirects: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL || '',
      process.env.APP_URL || '',
    ].filter(Boolean),
  },

  // Session configuration
  session: {
    ttl: 24 * 60 * 60, // 24 hours in seconds
    extendOnUse: true, // Extend session on activity
    maxConcurrent: 5, // Max concurrent sessions per user
  },

  // CSRF configuration
  csrf: {
    cookieName: 'XSRF-TOKEN',
    headerName: 'X-CSRF-Token',
    excludePaths: [
      '/api/v1/health',
      '/api/v1/auth/oauth',
      '/metrics',
    ],
  },

  // Security headers (Helmet configuration)
  headers: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        scriptSrc: ["'self'"],
        fontSrc: ["'self'", 'fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL || ''],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
  },

  // Account security
  account: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60, // 15 minutes in seconds
    requireEmailVerification: false, // Set to true for email verification
    enableTwoFactor: false, // Future feature
  },

  // API Key settings
  apiKey: {
    prefixLength: 8,
    defaultExpiry: 90 * 24 * 60 * 60, // 90 days in seconds
    maxKeysPerUser: 10,
  },
};

/**
 * Validate password against security policy
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { password: policy } = securityConfig;

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if redirect URI is allowed
 */
export function isAllowedRedirect(uri: string): boolean {
  try {
    const url = new URL(uri);
    return securityConfig.oauth.allowedRedirects.some((allowed) => {
      const allowedUrl = new URL(allowed);
      return url.origin === allowedUrl.origin;
    });
  } catch {
    return false;
  }
}

export default securityConfig;
