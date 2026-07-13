/**
 * Rate Limiter Middleware
 *
 * Uses `rate-limiter-flexible` backed by Redis (when available) or in-memory
 * as a transparent fallback. All limiters share the same behaviour contract:
 *
 *   - On limit exceeded → 429 Too Many Requests with Retry-After header
 *   - On Redis failure  → fail-open (request passes through) to prevent
 *                         outages from blocking legitimate users
 *
 * Three limiter tiers:
 *   1. loginLimiter    — POST /api/auth/login      (10 attempts / 5 min per IP)
 *   2. otpLimiter      — POST /api/auth/signup
 *                        POST /api/auth/verify-otp  (5 attempts / 5 min per IP)
 *   3. generalLimiter  — All /api/* routes          (100 req   / 1 min per IP)
 */

import {
  RateLimiterRedis,
  RateLimiterMemory,
} from "rate-limiter-flexible";
import redisClient, { isRedisReady } from "../config/redis.js";

// ─── Helper: build limiter (Redis if available, else Memory) ─────────────────

function buildLimiter({ keyPrefix, points, duration }) {
  const opts = { keyPrefix, points, duration };

  if (isRedisReady()) {
    console.log(`✅ Rate limiter [${keyPrefix}] using Redis`);
    return new RateLimiterRedis({ storeClient: redisClient, ...opts });
  }

  console.warn(
    `⚠️  Rate limiter [${keyPrefix}] using in-memory fallback (no Redis)`
  );
  return new RateLimiterMemory(opts);
}

// ─── Limiter Instances ────────────────────────────────────────────────────────

const loginLimiter = buildLimiter({
  keyPrefix: "rl_login",
  points: 10,     // max 10 attempts
  duration: 300,  // per 5 minutes — resets automatically after 5 min
});

const otpLimiter = buildLimiter({
  keyPrefix: "rl_otp",
  points: 5,      // max 5 attempts
  duration: 300,  // per 5 minutes
});

const generalLimiter = buildLimiter({
  keyPrefix: "rl_general",
  points: 100,    // max 100 requests
  duration: 60,   // per 1 minute
});

// ─── Middleware Factory ───────────────────────────────────────────────────────

/**
 * Wraps a RateLimiter instance into Express middleware.
 * @param {RateLimiterRedis|RateLimiterMemory} limiter
 * @returns {Function} Express middleware
 */
function createMiddleware(limiter) {
  return async (req, res, next) => {
    // Use IP address as the rate limit key
    const key = req.ip || req.connection?.remoteAddress || "unknown";

    try {
      const result = await limiter.consume(key);

      // Expose standard rate-limit headers to the client
      res.set({
        "X-RateLimit-Limit": limiter.points,
        "X-RateLimit-Remaining": result.remainingPoints,
        "X-RateLimit-Reset": new Date(Date.now() + result.msBeforeNext)
          .toUTCString(),
      });

      next();
    } catch (err) {
      // RateLimiterRes is thrown when limit is exceeded
      if (err?.remainingPoints !== undefined) {
        const retrySecs = Math.ceil(err.msBeforeNext / 1000);

        res.set({
          "Retry-After": retrySecs,
          "X-RateLimit-Limit": limiter.points,
          "X-RateLimit-Remaining": 0,
          "X-RateLimit-Reset": new Date(Date.now() + err.msBeforeNext)
            .toUTCString(),
        });

        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
          retryAfter: retrySecs,
        });
      }

      // Unexpected error (e.g. Redis crash mid-request) — fail open
      console.error("Rate limiter unexpected error:", err.message);
      next();
    }
  };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const loginRateLimiter  = createMiddleware(loginLimiter);
export const otpRateLimiter    = createMiddleware(otpLimiter);
export const generalRateLimiter = createMiddleware(generalLimiter);
