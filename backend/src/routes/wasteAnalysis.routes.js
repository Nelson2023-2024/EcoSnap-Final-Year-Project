import { Router } from "express";
import asyncHandler from "express-async-handler";
import upload from "../middleware/upload.middleware.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";
import { analyzeWasteImage } from "../lib/gemini.process.js";
import { uploadToCloudinary } from "../lib/upload.cloudinary.js";

const router = Router();

router.post(
  "/",
  isAuthenticated,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const authUserId = req.user.user_id;

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

      // Prepare waste categories for Prisma
      const wasteCategories = (analysis.wasteCategories || []).map((cat) => ({
        waste_type: cat.waste_type,
        waste_estimatedPercentage: cat.waste_estimatedPercentage,
      }));

      // Save to DB using Prisma
      const wasteDoc = await prisma.wasteAnalysis.create({
        data: {
          waste_analysedBy: authUserId,
          waste_imageURL: imageURL,
          waste_containsWaste: analysis.containsWaste,
          waste_overallCategory: analysis.overallCategory || null,
          waste_dominantWasteType: analysis.dominantWasteType || null,
          waste_estimatedVolumeValue: analysis.estimatedVolume?.value || null,
          waste_estimatedVolumeUnit: analysis.estimatedVolume?.unit || null,
          waste_possibleSource: analysis.possibleSource || "Unknown",
          waste_environmentalImpact:
            analysis.environmentalImpact || "Not assessed",
          waste_confidenceLevel: analysis.confidenceLevel || "0%",
          waste_status: analysis.containsWaste ? "pending_dispatch" : "no_waste",
          waste_errorMessage: analysis.errorMessage || null,
          waste_locationLongitude: parseFloat(longitude),
          waste_locationLatitude: parseFloat(latitude),
          waste_locationAddress: address || "Unknown",
          waste_wasteCategories: {
            create: wasteCategories,
          },
        },
        include: {
          waste_wasteCategories: true,
        },
      });

      // Notify user about waste report
      await prisma.notification.create({
        data: {
          notification_userId: authUserId,
          notification_entityType: "waste_analysis",
          notification_entityId: wasteDoc.waste_id,
          notification_type: "waste_report",
          notification_title: "Waste Report Submitted",
          notification_message:
            "Your waste analysis has been completed successfully.",
          notification_metadata: {
            wasteId: wasteDoc.waste_id,
            category: wasteDoc.waste_overallCategory,
            containsWaste: wasteDoc.waste_containsWaste,
            location: wasteDoc.waste_locationAddress,
          },
        },
      });

      // Award points
      const pointsEarned = analysis.containsWaste ? 10 : 0;
      const updatedUser = await prisma.user.update({
        where: { user_id: authUserId },
        data: {
          user_points: {
            increment: pointsEarned,
          },
        },
      });

      const reward = await prisma.reward.create({
        data: {
          reward_userId: authUserId,
          reward_wasteAnalysisId: wasteDoc.waste_id,
          reward_pointsEarned: pointsEarned,
          reward_reason: "waste_report",
          reward_transactionType: "credit",
        },
      });

      // Notify reward
      await prisma.notification.create({
        data: {
          notification_userId: authUserId,
          notification_entityType: "reward",
          notification_entityId: reward.reward_id,
          notification_type: "reward_earned",
          notification_title: "Reward Earned! 🎉",
          notification_message: `You earned ${pointsEarned} points for reporting waste.`,
          notification_metadata: {
            rewardId: reward.reward_id,
            pointsEarned,
            reason: "waste_report",
          },
        },
      });

      // Bonus for milestone
      if (
        updatedUser.user_points >= 100 &&
        updatedUser.user_points - pointsEarned < 100
      ) {
        const bonusPoints = 50;
        await prisma.user.update({
          where: { user_id: authUserId },
          data: {
            user_points: {
              increment: bonusPoints,
            },
          },
        });

        const bonusReward = await prisma.reward.create({
          data: {
            reward_userId: authUserId,
            reward_pointsEarned: bonusPoints,
            reward_reason: "bonus",
            reward_transactionType: "credit",
          },
        });

        await prisma.notification.create({
          data: {
            notification_userId: authUserId,
            notification_entityType: "reward",
            notification_entityId: bonusReward.reward_id,
            notification_type: "bonus_awarded",
            notification_title: "Bonus Unlocked! 🏅",
            notification_message: `Congratulations! You reached 100 points and earned a ${bonusPoints}-point bonus!`,
            notification_metadata: {
              rewardId: bonusReward.reward_id,
              pointsEarned: bonusPoints,
              milestone: 100,
            },
          },
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

      const failedDoc = await prisma.wasteAnalysis.create({
        data: {
          waste_analysedBy: authUserId,
          waste_imageURL: imageURL,
          waste_containsWaste: false,
          waste_dominantWasteType: null,
          waste_estimatedVolumeValue: null,
          waste_estimatedVolumeUnit: null,
          waste_possibleSource: "N/A",
          waste_environmentalImpact: "N/A",
          waste_confidenceLevel: "0%",
          waste_status: "error",
          waste_errorMessage: error.message,
          waste_locationLongitude: parseFloat(longitude) || 0,
          waste_locationLatitude: parseFloat(latitude) || 0,
          waste_locationAddress: address || "Unknown",
        },
      });

      await prisma.notification.create({
        data: {
          notification_userId: authUserId,
          notification_entityType: "waste_analysis",
          notification_entityId: failedDoc.waste_id,
          notification_type: "system",
          notification_title: "Waste Analysis Failed ❌",
          notification_message:
            "We encountered an error analyzing your image. Please try again later.",
          notification_priority: "high",
          notification_metadata: {
            wasteId: failedDoc.waste_id,
            error: error.message,
          },
        },
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

// Get authenticated user's waste analysis history
router.get(
  "/",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user-specific records
    const [results, total] = await Promise.all([
      prisma.wasteAnalysis.findMany({
        where: { waste_analysedBy: userId },
        include: {
          waste_wasteCategories: true,
        },
        orderBy: { waste_createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.wasteAnalysis.count({
        where: { waste_analysedBy: userId },
      }),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: results,
    });
  })
);

// Get single waste report by ID (ADMIN)
router.get(
  "/admin/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const analysis = await prisma.wasteAnalysis.findUnique({
      where: { waste_id: id },
      include: {
        waste_wasteCategories: true,
        waste_user: {
          select: {
            user_id: true,
            user_fullName: true,
            user_email: true,
            user_phoneNumber: true,
            user_points: true,
          },
        },
      },
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "Waste analysis report not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  })
);

// Get all waste reports (ADMIN)
router.get(
  "/admin/all",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      prisma.wasteAnalysis.findMany({
        include: {
          waste_wasteCategories: true,
          waste_user: {
            select: {
              user_id: true,
              user_fullName: true,
              user_email: true,
            },
          },
        },
        orderBy: { waste_createdAt: "desc" },
        skip,
        take: limit,
      }),

      prisma.wasteAnalysis.count(),
    ]);

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: results,
    });
  })
);

export { router as wasteAnalysisRoutes };