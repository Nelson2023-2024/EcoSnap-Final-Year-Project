import { Router } from "express";
import asyncHandler from "express-async-handler";
import passport from "passport";
import "../passport/google.auth.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { ENV } from "../config/env.config.js";
import { prisma } from "../config/prisma.config.js"; // ✅ ADD THIS IMPORT

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
      req.user.user_role === "admin"
        ? `${ENV.FRONTEND_URL}/admin`
        : `${ENV.FRONTEND_URL}/user-dashboard`;
    // Redirect to frontend after successful login
    res.redirect(redirectURL);
  })
);

//get the Authenticated user
// ✅ FIXED: Transform user data to match frontend expectations
router.get("/me", isAuthenticated, (req, res) => {
  if (req.isAuthenticated() && req.user) {
    // Transform Prisma fields to frontend format
    const transformedUser = {
      user_id: req.user.user_id,
      email: req.user.user_email,
      username: req.user.user_username,
      firstName: req.user.user_firstName,
      lastName: req.user.user_lastName,
      fullName: req.user.user_fullName,
      profileImage: req.user.user_profileImage,
      phoneNumber: req.user.user_phoneNumber,
      role: req.user.user_role,
      points: req.user.user_points,
      googleID: req.user.user_googleID,
      authProvider: req.user.user_authProvider,
      createdAt: req.user.user_createdAt,
      updatedAt: req.user.user_updatedAt,
    };

    res.json({ user: transformedUser });
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

router.get("/dev-login", async (req, res) => {
  const user = {
    user_id: "9af423bc-19ec-4273-90dc-88f9aad22a8c", // must be user_id
    user_email: "nelsonobuya18@gmail.com",
  };
  req.login(user, (err) => {
    if (err)
      return res
        .status(500)
        .json({ message: "Login failed", error: err.message });
    res.json({ message: "Dev login successful", user });
  });
});

// Update authenticated user's profile
router.put(
  "/profile",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;

    const { firstName, lastName, username, phoneNumber, profileImage } =
      req.body;

    // Build update object dynamically (prevents overwriting with undefined)
    const updateData = {};

    if (firstName !== undefined) updateData.user_firstName = firstName;
    if (lastName !== undefined) updateData.user_lastName = lastName;
    if (username !== undefined) updateData.user_username = username;
    if (phoneNumber !== undefined) updateData.user_phoneNumber = phoneNumber;
    if (profileImage !== undefined)
      updateData.user_profileImage = profileImage;

    // ✅ Auto-generate fullName if first/last name changed
    if (firstName !== undefined || lastName !== undefined) {
      const newFirstName = firstName !== undefined ? firstName : req.user.user_firstName;
      const newLastName = lastName !== undefined ? lastName : req.user.user_lastName;
      updateData.user_fullName = `${newFirstName || ""} ${newLastName || ""}`.trim();
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { user_id: userId },
        data: updateData,
      });

      // ✅ Update session with new user data
      req.user = updatedUser;

      // Transform to frontend format
      const transformedUser = {
        user_id: updatedUser.user_id,
        email: updatedUser.user_email,
        username: updatedUser.user_username,
        firstName: updatedUser.user_firstName,
        lastName: updatedUser.user_lastName,
        fullName: updatedUser.user_fullName,
        profileImage: updatedUser.user_profileImage,
        phoneNumber: updatedUser.user_phoneNumber,
        role: updatedUser.user_role,
        points: updatedUser.user_points,
        googleID: updatedUser.user_googleID,
        authProvider: updatedUser.user_authProvider,
        createdAt: updatedUser.user_createdAt,
        updatedAt: updatedUser.user_updatedAt,
      };

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: transformedUser,
      });
    } catch (error) {
      // Handle unique constraint errors
      if (error.code === "P2002") {
        return res.status(400).json({
          success: false,
          message: `${error.meta.target[0]} already in use`,
        });
      }

      throw error;
    }
  })
);

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