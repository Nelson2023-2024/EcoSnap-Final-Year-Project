import session from "express-session";
import { redisStore } from "../config/redis.config.js";
import { ENV } from "../config/env.config.js";

// Initialize session storage.
export const sessionMiddleware = session({
  store: redisStore,
  secret: ENV.SESSION_SECRET,
  cookie: {
    maxAge:  7 * 24 * 60 * 60 * 1000,
    secure: false,
    httpOnly: true,
  },
  resave: false,
  saveUninitialized: false,
});