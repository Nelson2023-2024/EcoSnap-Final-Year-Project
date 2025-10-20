import { RedisStore } from "connect-redis";
import redis from "redis";
import { ENV } from "./env.config.js";

// Initialize client.
let redisClient = redis.createClient({
  socket: {
    host: ENV.REDIS_URL,
    port: ENV.REDIS_PORT,
  },
});

await redisClient.connect();

// Initialize store.
export let redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp:",
});


