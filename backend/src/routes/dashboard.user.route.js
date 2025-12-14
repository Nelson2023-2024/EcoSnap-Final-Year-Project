import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";

const router = Router();

// ---------------- GET USER DASHBOARD STATS ----------------
router.get(
  "/stats",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;

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
      totalRedemptions,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { user_id: userId },
        select: { user_points: true },
      }),

      prisma.wasteAnalysis.count({
        where: { waste_analysedBy: userId },
      }),

      prisma.wasteAnalysis.count({
        where: {
          waste_analysedBy: userId,
          waste_createdAt: { gte: lastMonthDate },
        },
      }),

      prisma.wasteAnalysis.findMany({
        where: { waste_analysedBy: userId },
        orderBy: { waste_createdAt: "desc" },
        take: 3,
        select: {
          waste_id: true,
          waste_createdAt: true,
          waste_status: true,
          waste_locationAddress: true,
          waste_dominantWasteType: true,
        },
      }),

      prisma.order.count({
        where: { order_userId: userId },
      }),
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

    const previousMonthReports = await prisma.wasteAnalysis.count({
      where: {
        waste_analysedBy: userId,
        waste_createdAt: { gte: twoMonthsAgo, lt: lastMonthDate },
      },
    });

    const reportDifference = lastMonthReports - previousMonthReports;

    // Points until next reward
    const nextRewardThreshold = Math.ceil(user.user_points / 500) * 500;
    const pointsUntilNextReward = nextRewardThreshold - user.user_points;

    // Level system
    const getUserLevel = (points) => {
      if (points < 200) return { name: "Eco Beginner", level: 1 };
      if (points < 500) return { name: "Eco Warrior", level: 2 };
      if (points < 1000) return { name: "Eco Champion", level: 3 };
      if (points < 2000) return { name: "Eco Master", level: 4 };
      return { name: "Eco Legend", level: 5 };
    };

    const currentLevel = getUserLevel(user.user_points);
    const nextLevelPoints =
      currentLevel.level === 5
        ? user.user_points
        : [200, 500, 1000, 2000][currentLevel.level];
    const previousLevelPoints =
      currentLevel.level === 1
        ? 0
        : [0, 200, 500, 1000][currentLevel.level - 1];

    const levelProgress =
      currentLevel.level === 5
        ? 100
        : ((user.user_points - previousLevelPoints) /
            (nextLevelPoints - previousLevelPoints)) *
          100;

    // Recent reports formatting
    const formattedRecentReports = recentReports.map((report) => ({
      id: report.waste_id,
      date: report.waste_createdAt.toISOString().split("T")[0],
      status:
        report.waste_status === "collected"
          ? "Collected"
          : report.waste_status === "dispatched"
          ? "In Progress"
          : "Pending",
      location: report.waste_locationAddress || "Location not specified",
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
          value: user.user_points,
          subtitle: `${pointsUntilNextReward} points until next reward`,
        },
        itemsRedeemed: {
          value: totalRedemptions,
          subtitle: "Redeemed rewards",
        },
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
          currentLevel.level === 5 ? 0 : nextLevelPoints - user.user_points,
      },
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  })
);

export { router as userDashboardRoutes };