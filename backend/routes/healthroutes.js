/**
 * Health Check Route
 *
 * GET /api/health
 *
 * Returns the live operational status of all critical services:
 *   - Redis connection
 *   - MongoDB connection
 *   - Server uptime
 *
 * Designed to be used by:
 *   - Load balancers / Kubernetes liveness probes
 *   - Uptime monitoring tools (UptimeRobot, Betterstack, etc.)
 *   - Manual developer inspection
 *
 * HTTP 200 → all systems operational (or partially degraded but running)
 * HTTP 503 → MongoDB is down (critical dependency)
 */

import express from "express";
import mongoose from "mongoose";
import { isRedisReady } from "../config/redis.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const mongoState = mongoose.connection.readyState;

  // mongoose readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const mongoStatus =
    mongoState === 1
      ? "connected"
      : mongoState === 2
      ? "connecting"
      : "disconnected";

  const redisStatus = isRedisReady() ? "connected" : "disconnected";

  const isHealthy = mongoState === 1; // MongoDB is the critical service

  const payload = {
    status: isHealthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),   // seconds since server start
    services: {
      mongo: {
        status: mongoStatus,
      },
      redis: {
        status: redisStatus,
        mode: isRedisReady() ? "redis" : "in-memory-fallback",
      },
    },
    version: process.env.npm_package_version || "1.0.0",
  };

  return res.status(isHealthy ? 200 : 503).json(payload);
});

export default router;
