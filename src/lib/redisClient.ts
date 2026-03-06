import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

/**
 * Singleton ioredis client shared across the application.
 * Uses lazyConnect so the process starts even if Redis is unavailable.
 */
const redisClient = new Redis(REDIS_URL, {
    lazyConnect: true,
    enableOfflineQueue: false, // fail-fast: don't queue commands when disconnected
    maxRetriesPerRequest: 1,
});

redisClient.on("error", (err) => {
    // Surface connection errors without crashing the process
    console.error("[Redis] Connection error:", err.message);
});

redisClient.on("connect", () => {
    console.error("[Redis] Connected to", REDIS_URL);
});

export default redisClient;
