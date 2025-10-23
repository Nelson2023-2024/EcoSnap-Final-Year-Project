import { Router } from "express";
import asyncHandler from "express-async-handler";
import upload from "../middleware/upload.middleware.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { wasteAnalysis } from "../models/wasteAnalysis.model.js";
import { User } from "../models/user.model.js";
import { Reward } from "../models/Reward.model.js";
import { analyzeWasteImage } from "../lib/gemini.process.js";
import { Notification } from "../models/Notification.model.js";

const router = Router();

router.post(
  "/",
  isAuthenticated,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    try {
      const authUser = req.user._id;

      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      const { latitude, longitude, address } = req.body;

      // 🔹 Analyze image using Gemini
      const analysis = await analyzeWasteImage(
        req.file.buffer,
        req.file.mimetype
      );

      // 🔹 Save result to MongoDB
      const wasteDoc = await wasteAnalysis.create({
        analysedBy: authUser,
        imageURL: `data:${req.file.mimetype};base64,${analysis.imageBase64}`,
        containsWaste: analysis.containsWaste,
        wasteCategories: analysis.wasteCategories || [],
        possibleSource: analysis.possibleSource || "Unknown",
        environmentalImpact: analysis.environmentalImpact || "Not assessed",
        confidenceLevel: analysis.confidenceLevel || "0%",
        status: analysis.containsWaste ? "valid" : "no_waste",
        errorMessage:
          analysis.errorMessage ||
          (analysis.containsWaste ? null : "No visible waste detected."),
        location: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
          address: address || "Unknown",
        },
      });

      // 🔹 Notify user about successful waste report
      await Notification.create({
        user: authUser,
        type: "waste_report",
        title: "Waste Report Submitted",
        message: "Your waste analysis has been completed successfully.",
        relatedModel: "WasteAnalysis",
        relatedId: wasteDoc._id,
        metadata: { wasteId: wasteDoc._id },
      });

      // 🎯 Award points for valid waste detection
      const pointsEarned = analysis.containsWaste ? 10 : 0;

      // 🔹 Update user's total points
      const updatedUser = await User.findByIdAndUpdate(
        authUser,
        { $inc: { points: pointsEarned } },
        { new: true }
      );

      // 🔹 Log the reward
      const reward = await Reward.create({
        user: authUser,
        pointsEarned,
        reason: "waste_report",
      });

      // 🔹 Notification for reward earned
      await Notification.create({
        user: authUser,
        type: "reward_earned",
        title: "Reward Earned! 🎉",
        message: `You earned ${pointsEarned} points for reporting waste.`,
        relatedModel: "Reward",
        relatedId: reward._id,
        metadata: { rewardId: reward._id },
      });

      // 🏆 Bonus logic — if user reaches 100 points for first time
      if (updatedUser.points >= 100 && updatedUser.points < 150) {
        await User.findByIdAndUpdate(authUser, { $inc: { points: 50 } });
        const bonusReward = await Reward.create({
          user: authUser,
          pointsEarned: 50,
          reason: "bonus_awarded",
          status: "earned",
        });

        // 🔹 Notification for bonus
        await Notification.create({
          user: authUser,
          type: "bonus_awarded",
          title: "Bonus Unlocked! 🏅",
          message:
            "Congratulations! You’ve reached 100 points and earned a 50-point bonus reward!",
          relatedModel: "Reward",
          relatedId: bonusReward._id,
          metadata: { rewardId: bonusReward._id },
        });
      }

      res.status(201).json({
        success: true,
        message: "Waste analysis completed successfully",
        data: wasteDoc,
        pointsAwarded: pointsEarned,
      });
    } catch (error) {
      console.error("AI analysis error:", error.message);

      // 🔹 Save failed analysis attempt
      const failedDoc = await wasteAnalysis.create({
        analysedBy: req.user._id,
        imageURL: `data:${
          req.file?.mimetype
        };base64,${req.file?.buffer?.toString("base64")}`,
        containsWaste: false,
        wasteCategories: [],
        possibleSource: "N/A",
        environmentalImpact: "N/A",
        confidenceLevel: "0%",
        status: "error",
        errorMessage: error.message,
        location: {
          type: "Point",
          coordinates: [
            parseFloat(req.body.longitude) || 0,
            parseFloat(req.body.latitude) || 0,
          ],
          address: req.body.address || "Unknown",
        },
      });

      // 🔹 Notify user of analysis failure
      await Notification.create({
        user: req.user._id,
        type: "system",
        title: "Waste Analysis Failed ❌",
        message:
          "We encountered an error analyzing your image. Please try again later.",
        relatedModel: "WasteAnalysis",
        relatedId: failedDoc._id,
        metadata: { error: error.message },
        priority: "high",
      });

      res.status(500).json({
        success: false,
        message: "Waste analysis failed.",
        error: error.message,
        data: failedDoc,
      });
    }
  })
);

export { router as wasteAnalysisRoutes };
