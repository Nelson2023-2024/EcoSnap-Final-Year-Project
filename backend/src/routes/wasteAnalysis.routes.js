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
    const authUser = req.user._id;

    if (!req.file) return res.status(400).json({ message: "No image uploaded" });

    const { latitude, longitude, address } = req.body;

    try {
      // 🔹 Analyze image
      const analysis = await analyzeWasteImage(req.file.buffer, req.file.mimetype);

      // 🔹 Save to DB
      const wasteDoc = await wasteAnalysis.create({
        analysedBy: authUser,
        imageURL: `data:${req.file.mimetype};base64,${analysis.imageBase64}`,
        containsWaste: analysis.containsWaste,
        wasteCategories: analysis.wasteCategories || [],
        dominantWasteType: analysis.dominantWasteType || null,
        estimatedVolume: analysis.estimatedVolume || { value: 0, unit: "kg" },
        possibleSource: analysis.possibleSource || "Unknown",
        environmentalImpact: analysis.environmentalImpact || "Not assessed",
        confidenceLevel: analysis.confidenceLevel || "0%",
        status: analysis.containsWaste ? "pending_dispatch" : "no_waste",
        errorMessage: analysis.errorMessage || null,
        location: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
          address: address || "Unknown",
        },
      });

      // 🔹 Notify user
      await Notification.create({
        user: authUser,
        type: "waste_report",
        title: "Waste Report Submitted",
        message: "Your waste analysis has been completed successfully.",
        relatedModel: "WasteAnalysis",
        relatedId: wasteDoc._id,
        metadata: { wasteId: wasteDoc._id },
      });

      // 🔹 Award points
      const pointsEarned = analysis.containsWaste ? 10 : 0;
      const updatedUser = await User.findByIdAndUpdate(
        authUser,
        { $inc: { points: pointsEarned } },
        { new: true }
      );

      const reward = await Reward.create({
        user: authUser,
        wasteAnalysisId: wasteDoc._id,
        pointsEarned,
        reason: "waste_report",
        transactionType: "credit",
      });

      // 🔹 Notify reward
      await Notification.create({
        user: authUser,
        type: "reward_earned",
        title: "Reward Earned! 🎉",
        message: `You earned ${pointsEarned} points for reporting waste.`,
        relatedModel: "Reward",
        relatedId: reward._id,
        metadata: { rewardId: reward._id },
      });

      // 🔹 Bonus for milestone
      if (updatedUser.points >= 100 && updatedUser.points - pointsEarned < 100) {
        const bonusPoints = 50;
        await User.findByIdAndUpdate(authUser, { $inc: { points: bonusPoints } });
        const bonusReward = await Reward.create({
          user: authUser,
          pointsEarned: bonusPoints,
          reason: "bonus",
          transactionType: "credit",
        });

        await Notification.create({
          user: authUser,
          type: "bonus_awarded",
          title: "Bonus Unlocked! 🏅",
          message: `Congratulations! You reached 100 points and earned a ${bonusPoints}-point bonus!`,
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
      console.error("Waste analysis error:", error.message);

      const failedDoc = await wasteAnalysis.create({
        analysedBy: authUser,
        imageURL: `data:${req.file?.mimetype};base64,${req.file?.buffer?.toString("base64")}`,
        containsWaste: false,
        wasteCategories: [],
        dominantWasteType: null,
        estimatedVolume: { value: 0, unit: "kg" },
        possibleSource: "N/A",
        environmentalImpact: "N/A",
        confidenceLevel: "0%",
        status: "error",
        errorMessage: error.message,
        location: {
          type: "Point",
          coordinates: [
            parseFloat(longitude) || 0,
            parseFloat(latitude) || 0,
          ],
          address: address || "Unknown",
        },
      });

      await Notification.create({
        user: authUser,
        type: "system",
        title: "Waste Analysis Failed ❌",
        message: "We encountered an error analyzing your image. Please try again later.",
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
