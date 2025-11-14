import { Router } from "express";
import asyncHandler from "express-async-handler";
import passport from "passport";
import "../passport/google.auth.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { ENV } from "../config/env.config.js";

const router = Router();

router.get("/google", passport.authenticate("google"));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${ENV.FRONTEND_URL}/login`,
  }),
  asyncHandler(async (req, res) => {
    console.log(req.session);
    console.log("Authenticated user:", req.user);

    const redirectURL =
      req.user.role === "admin"
        ? `${ENV.FRONTEND_URL}/admin`
        : `${ENV.FRONTEND_URL}/user-dashboard`;
    // Redirect to frontend after successful login
    res.redirect(redirectURL);
  })
);

//get the Authenticated user
router.get("/me", isAuthenticated, (req, res) => {
  if (req.isAuthenticated()) res.json({ user: req.user });
  else res.status(401).json({ message: "Not logged in" });
});

router.get("/dev-login", async (req, res) => {
  const user = {
    id: "6913a19b1b5dab9aaed2a8a3",
    email: "nelsonobuya18@gmail.com",
  };
  req.login(user, (err) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Login failed", error: err.message });
    res.json({ message: "Dev login successful", user });
  });
});

router.post("/logout", (req, res, next) => {
  req.logout(function (error) {
    if (error) return next(error);
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

export { router as authRoutes };
