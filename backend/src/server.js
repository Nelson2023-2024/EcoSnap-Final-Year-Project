// src/server.js
import express from "express";
import passport from "passport";
import { ENV } from "./config/env.config.js";
import { sessionMiddleware } from "./middleware/redis.middleware.js";
import { rootRouter } from "./routes/root.routes.js";
import cors from "cors";
import { testConnection } from "./config/prisma.config.js";
import { connectRedis } from "./config/redis.config.js";
import { bullRouter, closeQueues } from "./config/queue.config.js";

const app = express();

// 1️⃣ Enable CORS BEFORE routes
app.use(
  cors({
    origin: ENV.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Increase the limit (e.g., to 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(sessionMiddleware);

// Initializes Passport for incoming requests
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", async (req, res) => {
  res.status(200).json({ status: "ok", message: "Health" });
});

// Bull Board Dashboard - MUST be before /api routes
app.use("/admin/queues", bullRouter);

app.use("/api", rootRouter);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server and queues");
  await closeQueues();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing HTTP server and queues");
  await closeQueues();
  process.exit(0);
});

const server = app.listen(ENV.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${ENV.PORT}`);
  console.log(`📊 Bull Board UI: http://localhost:${ENV.PORT}/admin/queues`);
  testConnection();
  connectRedis();
});

export default server;
