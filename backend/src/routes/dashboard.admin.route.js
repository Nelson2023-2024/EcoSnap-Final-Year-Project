import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";

const router = Router();

router.use(isAuthenticated, isAdmin);

// Get comprehensive admin dashboard stats
router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    const [
      // Core metrics
      totalUsers,
      totalWasteReports,
      totalDispatches,
      totalTeams,
      totalTrucks,
      totalPointsAwarded,
      totalOrders,
      
      // Time-based metrics
      newUsersThisMonth,
      reportsThisMonth,
      dispatchesThisWeek,
      completedCollections,
      
      // Previous period metrics for comparison
      usersLastMonth,
      reportsLastMonth,
      dispatchesLastWeek,
      collectionsLastMonth,
      
      // Status breakdowns
      wasteByStatus,
      dispatchByStatus,
      truckByStatus,
      
      // Category analysis with detailed breakdown
      wasteByCategory,
      wasteCategoryDetailed,
      
      // Team performance
      teamPerformance,
      
      // Recent activity
      recentReports,
      recentDispatches,
      recentAlerts,
      
      // User engagement
      topUsers,
      activeUsersThisWeek,
      
      // Revenue/Points
      pointsDistribution,
      orderStats,
      
      // Weekly activity data (last 7 days)
      weeklyReports,
      weeklyCollections,
      
      // Time series data (last 30 days)
      reportsLast30Days,
      dispatchesLast30Days,
      
      // Location-based alerts
      locationHotspots,
      
    ] = await Promise.all([
      // Core metrics
      prisma.user.count(),
      prisma.wasteAnalysis.count(),
      prisma.dispatch.count(),
      prisma.team.count(),
      prisma.truck.count(),
      prisma.reward.aggregate({
        where: { reward_transactionType: "credit" },
        _sum: { reward_pointsEarned: true },
      }),
      prisma.order.count(),
      
      // Time-based metrics
      prisma.user.count({
        where: { user_createdAt: { gte: lastMonth } },
      }),
      prisma.wasteAnalysis.count({
        where: { waste_createdAt: { gte: lastMonth } },
      }),
      prisma.dispatch.count({
        where: { dispatch_createdAt: { gte: lastWeek } },
      }),
      prisma.dispatch.count({
        where: { 
          dispatch_status: "collected",
          dispatch_actualCollectionDate: { gte: lastMonth }
        },
      }),
      
      // Previous period for comparison
      prisma.user.count({
        where: { 
          user_createdAt: { gte: twoMonthsAgo, lt: lastMonth }
        },
      }),
      prisma.wasteAnalysis.count({
        where: { 
          waste_createdAt: { gte: twoMonthsAgo, lt: lastMonth }
        },
      }),
      prisma.dispatch.count({
        where: { 
          dispatch_createdAt: { 
            gte: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000), 
            lt: lastWeek 
          }
        },
      }),
      prisma.dispatch.count({
        where: { 
          dispatch_status: "collected",
          dispatch_actualCollectionDate: { gte: twoMonthsAgo, lt: lastMonth }
        },
      }),
      
      // Status breakdowns
      prisma.wasteAnalysis.groupBy({
        by: ["waste_status"],
        _count: { waste_status: true },
      }),
      prisma.dispatch.groupBy({
        by: ["dispatch_status"],
        _count: { dispatch_status: true },
      }),
      prisma.truck.groupBy({
        by: ["truck_status"],
        _count: { truck_status: true },
      }),
      
      // Category analysis
      prisma.wasteAnalysis.groupBy({
        by: ["waste_overallCategory"],
        where: { waste_overallCategory: { not: null } },
        _count: { waste_overallCategory: true },
        _sum: { waste_estimatedVolumeValue: true },
      }),
      
      // Detailed waste type breakdown from WasteCategory
      prisma.$queryRaw`
        SELECT 
          "waste_type" as type,
          COUNT(*)::int as count,
          SUM("waste_estimatedPercentage")::float as total_percentage
        FROM waste_categories
        GROUP BY "waste_type"
        ORDER BY count DESC
        LIMIT 10
      `,
      
      // Team performance
      prisma.team.findMany({
        select: {
          team_id: true,
          team_name: true,
          team_specialization: true,
          team_status: true,
          _count: {
            select: {
              team_dispatches: true,
              team_members: true,
              team_trucks: true,
            },
          },
        },
        orderBy: {
          team_dispatches: {
            _count: "desc",
          },
        },
        take: 10,
      }),
      
      // Recent activity
      prisma.wasteAnalysis.findMany({
        take: 10,
        orderBy: { waste_createdAt: "desc" },
        include: {
          waste_user: {
            select: {
              user_id: true,
              user_fullName: true,
              user_email: true,
            },
          },
        },
      }),
      prisma.dispatch.findMany({
        take: 10,
        orderBy: { dispatch_createdAt: "desc" },
        include: {
          dispatch_assignedTeam: {
            select: {
              team_name: true,
              team_specialization: true,
            },
          },
          dispatch_assignedTruck: {
            select: {
              truck_registrationNumber: true,
            },
          },
          dispatch_wasteAnalysis: {
            select: {
              waste_locationAddress: true,
            },
          },
        },
      }),
      
      // Recent alerts - High priority/urgent dispatches or error reports
      prisma.$queryRaw`
        SELECT 
          w."waste_id" as id,
          w."waste_locationAddress" as location,
          w."waste_overallCategory" as issue,
          w."waste_status" as status,
          w."waste_createdAt" as time,
          u."user_fullName" as reporter
        FROM waste_analysis w
        JOIN users u ON w."waste_analysedBy" = u."user_id"
        WHERE 
          w."waste_overallCategory" = 'hazardous'
          OR w."waste_status" = 'error'
        ORDER BY w."waste_createdAt" DESC
        LIMIT 10
      `,
      
      // Top users
      prisma.user.findMany({
        take: 10,
        orderBy: { user_points: "desc" },
        select: {
          user_id: true,
          user_fullName: true,
          user_email: true,
          user_points: true,
          user_profileImage: true,
          _count: {
            select: {
              user_wasteReports: true,
            },
          },
        },
      }),
      
      // Active users this week
      prisma.wasteAnalysis.groupBy({
        by: ["waste_analysedBy"],
        where: { waste_createdAt: { gte: lastWeek } },
        _count: { waste_analysedBy: true },
      }),
      
      // Points distribution
      prisma.reward.groupBy({
        by: ["reward_reason"],
        _sum: { reward_pointsEarned: true },
        _count: { reward_reason: true },
      }),
      
      // Order stats
      prisma.order.groupBy({
        by: ["order_status"],
        _count: { order_status: true },
        _sum: { order_totalCost: true },
      }),
      
      // Weekly reports (last 7 days)
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("waste_createdAt", 'Dy') as day,
          COUNT(*)::int as count
        FROM waste_analysis
        WHERE "waste_createdAt" >= ${lastWeek}
        GROUP BY TO_CHAR("waste_createdAt", 'Dy'), DATE("waste_createdAt")
        ORDER BY DATE("waste_createdAt") ASC
      `,
      
      // Weekly collections (last 7 days)
      prisma.$queryRaw`
        SELECT 
          TO_CHAR("dispatch_actualCollectionDate", 'Dy') as day,
          COUNT(*)::int as count
        FROM dispatches
        WHERE "dispatch_actualCollectionDate" >= ${lastWeek}
          AND "dispatch_status" = 'collected'
        GROUP BY TO_CHAR("dispatch_actualCollectionDate", 'Dy'), DATE("dispatch_actualCollectionDate")
        ORDER BY DATE("dispatch_actualCollectionDate") ASC
      `,
      
      // Time series - Reports last 30 days
      prisma.$queryRaw`
        SELECT 
          DATE("waste_createdAt") as date,
          COUNT(*)::int as count
        FROM waste_analysis
        WHERE "waste_createdAt" >= ${last30Days}
        GROUP BY DATE("waste_createdAt")
        ORDER BY date ASC
      `,
      
      // Time series - Dispatches last 30 days
      prisma.$queryRaw`
        SELECT 
          DATE("dispatch_createdAt") as date,
          COUNT(*)::int as count
        FROM dispatches
        WHERE "dispatch_createdAt" >= ${last30Days}
        GROUP BY DATE("dispatch_createdAt")
        ORDER BY date ASC
      `,
      
      // Location hotspots (multiple reports from same area)
      prisma.$queryRaw`
        SELECT 
          "waste_locationAddress" as location,
          COUNT(*)::int as report_count,
          MAX("waste_overallCategory")::text as category,
          MAX("waste_createdAt") as last_report
        FROM waste_analysis
        WHERE "waste_locationAddress" IS NOT NULL
          AND "waste_createdAt" >= ${last30Days}
        GROUP BY "waste_locationAddress"
        HAVING COUNT(*) >= 3
        ORDER BY COUNT(*) DESC
        LIMIT 10
      `,
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(1);
    };

    const userGrowth = calculateChange(newUsersThisMonth, usersLastMonth);
    const reportGrowth = calculateChange(reportsThisMonth, reportsLastMonth);
    const dispatchGrowth = calculateChange(dispatchesThisWeek, dispatchesLastWeek);
    const collectionGrowth = calculateChange(completedCollections, collectionsLastMonth);

    // Average response time (in hours)
    const avgResponseTime = await prisma.$queryRaw`
      SELECT AVG(
        EXTRACT(EPOCH FROM ("dispatch_createdAt" - "waste_createdAt")) / 3600
      )::numeric(10,2) as avg_hours
      FROM dispatches d
      JOIN waste_analysis w ON d."dispatch_wasteAnalysisId" = w."waste_id"
      WHERE d."dispatch_createdAt" >= ${last30Days}
    `;

    // Collection efficiency
    const collectionRate = totalDispatches > 0
      ? ((dispatchByStatus.find(d => d.dispatch_status === "collected")?._count?.dispatch_status || 0) / totalDispatches * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        // Overview stats with growth indicators
        overview: {
          totalReports: {
            value: totalWasteReports,
            change: `${reportGrowth >= 0 ? '+' : ''}${reportGrowth}%`,
            trend: reportGrowth >= 0 ? 'up' : 'down',
          },
          activeUsers: {
            value: totalUsers,
            change: `${userGrowth >= 0 ? '+' : ''}${userGrowth}%`,
            trend: userGrowth >= 0 ? 'up' : 'down',
            weeklyActive: activeUsersThisWeek.length,
          },
          dispatchedTrucks: {
            value: totalTrucks,
            change: `${dispatchGrowth >= 0 ? '+' : ''}${dispatchGrowth}%`,
            trend: dispatchGrowth >= 0 ? 'up' : 'down',
            inUse: truckByStatus.find(t => t.truck_status === 'in_use')?._count?.truck_status || 0,
          },
          completedCollections: {
            value: completedCollections,
            change: `${collectionGrowth >= 0 ? '+' : ''}${collectionGrowth}%`,
            trend: collectionGrowth >= 0 ? 'up' : 'down',
          },
          totalTeams,
          totalPointsAwarded: totalPointsAwarded._sum.reward_pointsEarned || 0,
          totalOrders,
          avgResponseTime: parseFloat(avgResponseTime[0]?.avg_hours || 0),
          collectionRate: parseFloat(collectionRate),
        },
        
        // Weekly activity data for line chart
        weeklyActivity: {
          reports: weeklyReports,
          collections: weeklyCollections,
        },
        
        // Waste type distribution for pie chart
        wasteTypeDistribution: wasteCategoryDetailed.map((item, index) => ({
          name: item.type,
          value: item.count,
          color: [
            '#22c55e', // green
            '#3b82f6', // blue
            '#f59e0b', // orange
            '#ef4444', // red
            '#8b5cf6', // purple
            '#6b7280', // gray
            '#ec4899', // pink
            '#14b8a6', // teal
            '#f97316', // orange
            '#a855f7', // violet
          ][index % 10],
        })),
        
        // Category overview for bar chart
        wasteByCategory: wasteByCategory.map(c => ({
          category: c.waste_overallCategory,
          count: c._count.waste_overallCategory,
          totalVolume: c._sum.waste_estimatedVolumeValue || 0,
        })),
        
        // Status breakdowns
        wasteStatus: wasteByStatus.map(s => ({
          status: s.waste_status,
          count: s._count.waste_status,
        })),
        
        dispatchStatus: dispatchByStatus.map(s => ({
          status: s.dispatch_status,
          count: s._count.dispatch_status,
        })),
        
        truckStatus: truckByStatus.map(s => ({
          status: s.truck_status,
          count: s._count.truck_status,
        })),
        
        // Team performance for bar chart
        teamPerformance: teamPerformance.map(t => ({
          teamId: t.team_id,
          teamName: t.team_name,
          specialization: t.team_specialization,
          status: t.team_status,
          totalDispatches: t._count.team_dispatches,
          memberCount: t._count.team_members,
          truckCount: t._count.team_trucks,
        })),
        
        // Recent alerts
        recentAlerts: recentAlerts.map(alert => ({
          id: alert.id,
          location: alert.location || 'Unknown location',
          issue: alert.issue === 'hazardous' 
            ? 'Hazardous material detected' 
            : 'Analysis error reported',
          status: alert.status,
          time: alert.time,
          reporter: alert.reporter,
        })),
        
        // Location hotspots
        locationHotspots: locationHotspots.map(spot => ({
          location: spot.location,
          reportCount: spot.report_count,
          category: spot.category,
          lastReport: spot.last_report,
        })),
        
        // Recent activity
        recentReports: recentReports.map(r => ({
          id: r.waste_id,
          status: r.waste_status,
          category: r.waste_overallCategory,
          location: r.waste_locationAddress,
          createdAt: r.waste_createdAt,
          userName: r.waste_user.user_fullName,
          userEmail: r.waste_user.user_email,
        })),
        
        recentDispatches: recentDispatches.map(d => ({
          id: d.dispatch_id,
          status: d.dispatch_status,
          location: d.dispatch_wasteAnalysis.waste_locationAddress,
          teamName: d.dispatch_assignedTeam.team_name,
          truckNumber: d.dispatch_assignedTruck.truck_registrationNumber,
          scheduledDate: d.dispatch_scheduledDate,
          createdAt: d.dispatch_createdAt,
        })),
        
        // Top users leaderboard
        topUsers: topUsers.map(u => ({
          userId: u.user_id,
          name: u.user_fullName,
          email: u.user_email,
          points: u.user_points,
          profileImage: u.user_profileImage,
          reportCount: u._count.user_wasteReports,
        })),
        
        // Points distribution for pie chart
        pointsDistribution: pointsDistribution.map(p => ({
          reason: p.reward_reason,
          totalPoints: p._sum.reward_pointsEarned || 0,
          count: p._count.reward_reason,
        })),
        
        // Order stats
        orderStats: orderStats.map(o => ({
          status: o.order_status,
          count: o._count.order_status,
          totalCost: o._sum.order_totalCost || 0,
        })),
        
        // Time series for line charts
        reportsTimeSeries: reportsLast30Days,
        dispatchesTimeSeries: dispatchesLast30Days,
      },
    });
  })
);


export { router as analyticsRoutes };