import { RedisStore } from "connect-redis";
import redis from "redis";
import { ENV } from "./env.config.js";

// Create Redis client
export const redisClient = redis.createClient({
  socket: {
    host: "localhost",
    port: ENV.REDIS_PORT,
  },
});

// 🔍 Redis event logs
redisClient.on("connect", () => {
  console.log("🟡 Redis client connecting...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis connected and ready");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

redisClient.on("end", () => {
  console.warn("⚠️ Redis connection closed");
});

// Connect function (recommended)
export async function connectRedis() {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
    process.exit(1); // optional but good for backend services
  }
}

// Initialize session store
export const redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:",
});
