import { Router } from "express";
import asyncHandler from "express-async-handler";
import passport from "passport";
import "../passport/google.auth.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/google", passport.authenticate("google"));

router.get(
  "/google/callback",
  passport.authenticate("google"),
  asyncHandler(async (req, res) => {
    console.log(req.session);
    console.log(req.user);
    res.sendStatus(200);
  })
);

//get the Authenticated user
router.get("/me", isAuthenticated, (req, res) => {
  if (req.isAuthenticated()) res.json({ user: req.user });
  else res.status(401).json({ message: "Not logged in" });
});

router.get("/dev-login", async (req, res) => {
  const user = {
    id: "68f688242a1be6be9cf213f7",
    email: "nelsonobuya18@gmail.com",
  };
  req.login(user, (err) => {
    if (err) return res.status(500).json({ message: "Login failed" });
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
