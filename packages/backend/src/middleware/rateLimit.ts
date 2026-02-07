import rateLimit from 'express-rate-limit';

/**
 * Rate Limiting Configuration
 *
 * Provides preconfigured rate limiters for different endpoint tiers.
 * Uses express-rate-limit with IP-based key generation.
 */

// General API rate limit: 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => {
    // Skip rate limiting if AFW_RATE_LIMIT_DISABLED is set
    return process.env.AFW_RATE_LIMIT_DISABLED === 'true';
  },
});

// Write endpoint rate limit: 30 requests per 15 minutes per IP
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please try again later.' },
  skip: (req) => {
    return process.env.AFW_RATE_LIMIT_DISABLED === 'true';
  },
});

// Session creation rate limit: 10 requests per 15 minutes per IP
export const sessionCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many session creation requests, please try again later.' },
  skip: (req) => {
    return process.env.AFW_RATE_LIMIT_DISABLED === 'true';
  },
});
