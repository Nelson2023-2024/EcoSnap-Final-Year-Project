import { Router } from "express";
import asyncHandler from "express-async-handler";
import upload from "../middleware/upload.middleware.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { wasteAnalysis } from "../models/wasteAnalysis.model.js";
import { User } from "../models/user.model.js";
import { Reward } from "../models/Reward.model.js";
import { analyzeWasteImage } from "../lib/gemini.process.js";
import { Notification } from "../models/Notification.model.js";
import { uploadToCloudinary } from "../lib/upload.cloudinary.js";

const router = Router();

// Helper function to transform DB document to frontend format
const transformWasteAnalysis = (doc) => {
  if (!doc) return null;

  const obj = doc.toObject ? doc.toObject() : doc;

  return {
    _id: obj._id,
    analysedBy: obj.waste_analysedBy,
    imageURL: obj.waste_imageURL,
    containsWaste: obj.waste_containsWaste,
    wasteCategories:
      obj.waste_wasteCategories?.map((cat) => ({
        type: cat.waste_type,
        estimatedPercentage: cat.waste_estimatedPercentage,
      })) || [],
    dominantWasteType: obj.waste_dominantWasteType,
    estimatedVolume: obj.waste_estimatedVolume
      ? {
          value: obj.waste_estimatedVolume.waste_value,
          unit: obj.waste_estimatedVolume.waste_unit,
        }
      : null,
    possibleSource: obj.waste_possibleSource,
    environmentalImpact: obj.waste_environmentalImpact,
    confidenceLevel: obj.waste_confidenceLevel,
    status: obj.waste_status,
    errorMessage: obj.waste_errorMessage,
    location: obj.waste_location
      ? {
          type: obj.waste_location.waste_type,
          coordinates: obj.waste_location.waste_coordinates,
          address: obj.waste_location.waste_address,
        }
      : null,
    createdAt: obj.waste_createdAt || obj.createdAt,
    updatedAt: obj.waste_updatedAt || obj.updatedAt,
  };
};

router.post(
  "/",
  isAuthenticated,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const authUser = req.user._id;

    if (!req.file)
      return res.status(400).json({ message: "No image uploaded" });

    const { latitude, longitude, address } = req.body;

    let imageURL = null;

    try {
      // Upload image to cloudinary
      imageURL = await uploadToCloudinary(req.file);

      // Analyze image
      const analysis = await analyzeWasteImage(
        req.file.buffer,
        req.file.mimetype
      );

      // Save to DB
      const wasteDoc = await wasteAnalysis.create({
        waste_analysedBy: authUser,
        waste_imageURL: imageURL,
        waste_containsWaste: analysis.containsWaste,
        waste_wasteCategories: analysis.wasteCategories || [],
        waste_dominantWasteType: analysis.dominantWasteType || null,
        waste_estimatedVolume: {
          waste_value: analysis.estimatedVolume?.value || 0,
          waste_unit: analysis.estimatedVolume?.unit || "kg",
        },
        waste_possibleSource: analysis.possibleSource || "Unknown",
        waste_environmentalImpact:
          analysis.environmentalImpact || "Not assessed",
        waste_confidenceLevel: analysis.confidenceLevel || "0%",
        waste_status: analysis.containsWaste ? "pending_dispatch" : "no_waste",
        waste_errorMessage: analysis.errorMessage || null,
        waste_location: {
          waste_type: "Point",
          waste_coordinates: [parseFloat(longitude), parseFloat(latitude)],
          waste_address: address || "Unknown",
        },
      });

      // Notify user
      await Notification.create({
        user: authUser,
        type: "waste_report",
        title: "Waste Report Submitted",
        message: "Your waste analysis has been completed successfully.",
        relatedModel: "WasteAnalysis",
        relatedId: wasteDoc._id,
        metadata: { wasteId: wasteDoc._id },
      });

      // Award points
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

      // Notify reward
      await Notification.create({
        user: authUser,
        type: "reward_earned",
        title: "Reward Earned! 🎉",
        message: `You earned ${pointsEarned} points for reporting waste.`,
        relatedModel: "Reward",
        relatedId: reward._id,
        metadata: { rewardId: reward._id },
      });

      // Bonus for milestone
      if (
        updatedUser.points >= 100 &&
        updatedUser.points - pointsEarned < 100
      ) {
        const bonusPoints = 50;
        await User.findByIdAndUpdate(authUser, {
          $inc: { points: bonusPoints },
        });
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

      // Transform before sending to frontend
      const transformedData = transformWasteAnalysis(wasteDoc);

      res.status(201).json({
        success: true,
        message: "Waste analysis completed successfully",
        data: transformedData,
        pointsAwarded: pointsEarned,
      });
    } catch (error) {
      console.error("Waste analysis error:", error.message);

      const failedDoc = await wasteAnalysis.create({
        waste_analysedBy: authUser,
        waste_imageURL: imageURL,
        waste_containsWaste: false,
        waste_wasteCategories: [],
        waste_dominantWasteType: null,
        waste_estimatedVolume: {
          waste_value: 0,
          waste_unit: "kg",
        },
        waste_possibleSource: "N/A",
        waste_environmentalImpact: "N/A",
        waste_confidenceLevel: "0%",
        waste_status: "error",
        waste_errorMessage: error.message,
        waste_location: {
          waste_type: "Point",
          waste_coordinates: [
            parseFloat(longitude) || 0,
            parseFloat(latitude) || 0,
          ],
          waste_address: address || "Unknown",
        },
      });

      await Notification.create({
        user: authUser,
        type: "system",
        title: "Waste Analysis Failed ❌",
        message:
          "We encountered an error analyzing your image. Please try again later.",
        relatedModel: "WasteAnalysis",
        relatedId: failedDoc._id,
        metadata: { error: error.message },
        priority: "high",
      });

      // Transform before sending to frontend
      const transformedFailedData = transformWasteAnalysis(failedDoc);

      res.status(500).json({
        success: false,
        message: "Waste analysis failed.",
        error: error.message,
        data: transformedFailedData,
      });
    }
  })
);

// Get authUser waste analysis history
router.get(
  "/",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user-specific records
    const [results, total] = await Promise.all([
      wasteAnalysis
        .find({ waste_analysedBy: userId })
        .sort({ waste_createdAt: -1 })
        .skip(skip)
        .limit(limit),

      wasteAnalysis.countDocuments({ waste_analysedBy: userId }),
    ]);

    // Transform all results for frontend
    const transformedResults = results.map(transformWasteAnalysis);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: transformedResults,
    });
  })
);


// Get single waste analysis by ID
router.get(
  "/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;

    // Find item by ID and ensure it belongs to this user
    const analysis = await wasteAnalysis.findOne({
      _id: id,
      waste_analysedBy: userId,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Waste analysis report not found",
      });
    }

    // Transform before sending to frontend
    const transformedAnalysis = transformWasteAnalysis(analysis);

    return res.status(200).json({
      success: true,
      data: transformedAnalysis,
    });
  })
);


// ==========================
// GET ALL WASTE REPORTS (ADMIN)
// ==========================
router.get(
  "/admin/all",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      wasteAnalysis
        .find({})
        .sort({ waste_createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit),

      wasteAnalysis.countDocuments(),
    ]);

    const transformed = results.map(transformWasteAnalysis);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: transformed,
    });
  })
);

export { router as wasteAnalysisRoutes };
