import express from "express";
import passport from "passport";
import { ENV } from "./config/env.config.js";
import { connectToMongoDBWithRetry } from "./config/db.config.js";
import { sessionMiddleware } from "./middleware/redis.middleware.js";
import { rootRouter } from "./routes/root.routes.js";
import cors from "cors"

const app = express();

// 1️⃣ Enable CORS BEFORE routes
app.use(
  cors({
    origin: ENV.FRONTEND_URL || "http://localhost:3000", // your frontend URL
    credentials: true, // allows cookies to be sent cross-origin
  })
);

app.use(express.json());
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
  connectToMongoDBWithRetry();
  console.log(`Google API AI`, ENV.GOOGLE_API_KEY)
});
