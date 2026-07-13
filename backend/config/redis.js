/**
 * Redis Client Configuration
 *
 * Uses ioredis to connect to Redis when REDIS_URL is provided in .env.
 * If REDIS_URL is absent or the connection fails, the client is set to null
 * and all dependent middleware automatically falls back to in-memory mode.
 *
 * This ensures the app never crashes due to Redis being unavailable.
 */

import dotenv from "dotenv";
import Redis from "ioredis";

dotenv.config();

let redisClient = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 5) {
          console.warn("Warning: Redis max reconnect attempts reached. Giving up.");
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      enableOfflineQueue: false,
    });

    redisClient.on("connect", () => console.log("Redis connected"));
    redisClient.on("error",   (err) => console.error("Redis error:", err.message));
    redisClient.on("close",   () => console.warn("Warning: Redis connection closed"));
  } catch (err) {
    console.error("Redis init failed:", err.message);
    redisClient = null;
  }
} else {
  console.warn("Warning: REDIS_URL not set - rate limiters will use in-memory fallback");
}

/**
 * Returns whether the Redis client is currently connected and ready.
 * @returns {boolean}
 */
export function isRedisReady() {
  return redisClient !== null && redisClient.status === "ready";
}

export default redisClient;
