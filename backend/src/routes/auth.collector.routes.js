import { Router } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.config.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * @desc Collector login
 * @route POST /auth/collector/login
 * @access Public (collector only)
 */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { user_email: email },
    });

    if (!user || user.user_role !== "collector") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.user_password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Log in the collector using Express session
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Login failed", error: err.message });
      }

      // Transform user data to frontend-friendly format
      const transformedUser = {
        user_id: user.user_id,
        email: user.user_email,
        username: user.user_username,
        firstName: user.user_firstName,
        lastName: user.user_lastName,
        fullName: user.user_fullName,
        profileImage: user.user_profileImage,
        phoneNumber: user.user_phoneNumber,
        role: user.user_role,
        points: user.user_points,
        googleID: user.user_googleID,
        authProvider: user.user_authProvider,
        createdAt: user.user_createdAt,
        updatedAt: user.user_updatedAt,
      };

      res.json({ message: "Login successful", user: transformedUser });
    });
  })
);

/**
 * @desc Get currently logged-in collector
 * @route GET /auth/collector/me
 * @access Private (collector)
 */
router.get("/me", isAuthenticated, (req, res) => {
  if (req.isAuthenticated() && req.user?.user_role === "collector") {
    const user = req.user;
    const transformedUser = {
      user_id: user.user_id,
      email: user.user_email,
      username: user.user_username,
      firstName: user.user_firstName,
      lastName: user.user_lastName,
      fullName: user.user_fullName,
      profileImage: user.user_profileImage,
      phoneNumber: user.user_phoneNumber,
      role: user.user_role,
      points: user.user_points,
      googleID: user.user_googleID,
      authProvider: user.user_authProvider,
      createdAt: user.user_createdAt,
      updatedAt: user.user_updatedAt,
    };
    res.json({ user: transformedUser });
  } else {
    res.status(401).json({ message: "Not logged in as collector" });
  }
});


export { router as authCollectorRoutes };
