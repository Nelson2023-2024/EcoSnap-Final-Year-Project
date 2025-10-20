import { Router } from "express";
import asyncHandler from "express-async-handler";
import passport from "passport";
import "../passport/google.auth.js";

const router = Router();

router.get("/google", passport.authenticate("google"));

router.get(
  "/google/callback",
  passport.authenticate("google"),
  asyncHandler(async (req, res) => {
    console.log(req.session)
    console.log(req.user)
    res.sendStatus(200)
  })
);


export { router as authRoutes };
