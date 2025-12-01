import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { Redemption } from "../models/Redemption.model.js";
import { User } from "../models/user.model.js";
import { wasteAnalysis } from "../models/wasteAnalysis.model.js";

const router = Router();

// ---------------- GET USER DASHBOARD STATS ----------------
router.get(
  "/stats",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const now = new Date();
    const lastMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );

    const [
      user,
      totalReports,
      lastMonthReports,
      recentReports,
      totalRedemptions
    ] = await Promise.all([
      User.findById(userId).select("points"),

      wasteAnalysis.countDocuments({ waste_analysedBy: userId }),

      wasteAnalysis.countDocuments({
        waste_analysedBy: userId,
        waste_createdAt: { $gte: lastMonthDate },
      }),

      wasteAnalysis
        .find({ waste_analysedBy: userId })
        .sort({ waste_createdAt: -1 })
        .limit(3)
        .select(
          "waste_createdAt waste_status waste_location waste_dominantWasteType"
        ),

      Redemption.countDocuments({ redemption_user: userId }),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Compare previous month
    const twoMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 2,
      now.getDate()
    );

    const previousMonthReports = await wasteAnalysis.countDocuments({
      waste_analysedBy: userId,
      waste_createdAt: { $gte: twoMonthsAgo, $lt: lastMonthDate },
    });

    const reportDifference = lastMonthReports - previousMonthReports;

    // Points until next reward
    const nextRewardThreshold = Math.ceil(user.points / 500) * 500;
    const pointsUntilNextReward = nextRewardThreshold - user.points;

    // Level system
    const getUserLevel = (points) => {
      if (points < 200) return { name: "Eco Beginner", level: 1 };
      if (points < 500) return { name: "Eco Warrior", level: 2 };
      if (points < 1000) return { name: "Eco Champion", level: 3 };
      if (points < 2000) return { name: "Eco Master", level: 4 };
      return { name: "Eco Legend", level: 5 };
    };

    const currentLevel = getUserLevel(user.points);
    const nextLevelPoints =
      currentLevel.level === 5
        ? user.points
        : [200, 500, 1000, 2000][currentLevel.level];
    const previousLevelPoints =
      currentLevel.level === 1
        ? 0
        : [0, 200, 500, 1000][currentLevel.level - 1];

    const levelProgress =
      currentLevel.level === 5
        ? 100
        : ((user.points - previousLevelPoints) /
            (nextLevelPoints - previousLevelPoints)) *
          100;

    // Recent reports formatting
    const formattedRecentReports = recentReports.map((report) => ({
      id: report._id,
      date: report.waste_createdAt.toISOString().split("T")[0],
      status:
        report.waste_status === "collected"
          ? "Collected"
          : report.waste_status === "dispatched"
          ? "In Progress"
          : "Pending",
      location:
        report.waste_location?.waste_address || "Location not specified",
      wasteType: report.waste_dominantWasteType || "Mixed waste",
    }));

    // Final dashboard 
    const dashboardData = {
      stats: {
        totalReports: {
          value: totalReports,
          subtitle: `${
            reportDifference >= 0 ? "+" : ""
          }${reportDifference} from last month`,
        },
        ecoPoints: {
          value: user.points,
          subtitle: `${pointsUntilNextReward} points until next reward`,
        },
        itemsRedeemed: {
          value: totalRedemptions,
          subtitle: "Redeemed rewards",
        }
      },
      recentReports: formattedRecentReports,
      levelProgress: {
        currentLevel: currentLevel.name,
        level: currentLevel.level,
        nextLevel:
          currentLevel.level === 5
            ? "Max Level"
            : getUserLevel(nextLevelPoints).name,
        progress: Math.round(levelProgress),
        pointsToNextLevel:
          currentLevel.level === 5 ? 0 : nextLevelPoints - user.points,
      },
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  })
);

export { router as userDashboardRoutes };
