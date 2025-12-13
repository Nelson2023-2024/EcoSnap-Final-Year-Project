import express from "express";
import passport from "passport";
import { ENV } from "./config/env.config.js";
import { connectToMongoDBWithRetry } from "./config/db.config.js";
import { sessionMiddleware } from "./middleware/redis.middleware.js";
import { rootRouter } from "./routes/root.routes.js";
import cors from "cors";
import { testConnection } from "./config/prisma.config.js";

const app = express();

// 1️⃣ Enable CORS BEFORE routes
app.use(
  cors({
    origin: ENV.FRONTEND_URL || "http://localhost:3000", // your frontend URL
    credentials: true, // allows cookies to be sent cross-origin
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Increase the limit (e.g., to 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(sessionMiddleware);

//Intializes Passport for incoming requests, allowing authentication strategies to be applied.
app.use(passport.initialize());
app.use(passport.session());

app.get("/api/health", async (req, res) => {
  console.log("Object1");
  res.status(200).json({ status: "ok", message: "Health" });
});

app.use("/api", rootRouter);

app.listen(ENV.PORT, () => {
  console.log(`Server running on http://localhost:${ENV.PORT}`);
  console.log(`Google API AI`, ENV.GOOGLE_API_KEY);
  connectToMongoDBWithRetry();
  testConnection();
});
