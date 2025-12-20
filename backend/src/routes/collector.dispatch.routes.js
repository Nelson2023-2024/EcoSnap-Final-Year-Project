// src/routes/collector.dispatch.routes.js
import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";
import upload from "../middleware/upload.middleware.js";
import { uploadToCloudinary } from "../lib/upload.cloudinary.js";
import { dispatchQueue, notificationQueue } from "../config/queue.config.js";

const router = Router();

/**
 * Middleware to ensure user is a collector
 */
const isCollector = (req, res, next) => {
  if (req.user?.user_role !== "collector") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Collector role required.",
    });
  }
  next();
};

// ============================================
// GET COLLECTOR'S TEAM AND TRUCK INFO
// ============================================
router.get(
  "/my-assignment",
  isAuthenticated,
  isCollector,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;

    // Find all teams the collector belongs to
    const teamMembers = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            team_trucks: {
              select: {
                truck_id: true,
                truck_registrationNumber: true,
                truck_truckType: true,
                truck_status: true,
                truck_capacity: true,
                truck_imageURL: true,
                truck_locationLatitude: true,
                truck_locationLongitude: true,
              },
            },
            team_members: {
              include: {
                user: {
                  select: {
                    user_id: true,
                    user_fullName: true,
                    user_email: true,
                    user_role: true,
                    user_profileImage: true,
                    user_phoneNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teamMembers || teamMembers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "You are not assigned to any team yet. Please contact admin.",
        data: null,
      });
    }

    // Format the response
    const teams = teamMembers.map((tm) => ({
      teamId: tm.team.team_id,
      teamName: tm.team.team_name,
      specialization: tm.team.team_specialization,
      status: tm.team.team_status,
      createdAt: tm.team.team_createdAt,
      updatedAt: tm.team.team_updatedAt,
      trucks: tm.team.team_trucks,
      members: tm.team.team_members.map((member) => ({
        userId: member.user.user_id,
        fullName: member.user.user_fullName,
        email: member.user.user_email,
        role: member.user.user_role,
        profileImage: member.user.user_profileImage,
        phoneNumber: member.user.user_phoneNumber,
      })),
      trucksCount: tm.team.team_trucks.length,
      membersCount: tm.team.team_members.length,
      availableTrucks: tm.team.team_trucks.filter(
        (t) => t.truck_status === "available"
      ).length,
      activeTrucks: tm.team.team_trucks.filter((t) => t.truck_status === "in_use")
        .length,
    }));

    // Calculate summary statistics
    const summary = {
      totalTeams: teams.length,
      totalTrucks: teams.reduce((sum, team) => sum + team.trucksCount, 0),
      totalMembers: teams.reduce((sum, team) => sum + team.membersCount, 0),
      availableTrucks: teams.reduce(
        (sum, team) => sum + team.availableTrucks,
        0
      ),
      activeTrucks: teams.reduce((sum, team) => sum + team.activeTrucks, 0),
    };

    // Primary team (first one or most active)
    const primaryTeam = teams[0];

    res.json({
      success: true,
      message: "Team assignments retrieved successfully",
      data: {
        teams,
        primaryTeam,
        summary,
      },
    });
  })
);

// ============================================
// GET COLLECTOR'S ASSIGNED DISPATCHES
// ============================================
router.get(
  "/my-dispatches",
  isAuthenticated,
  isCollector,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const { status, page = 1, limit = 20 } = req.query;

    // Find collector's team
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      select: { teamId: true },
    });

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "You are not assigned to any team",
        data: [],
      });
    }

    const filter = {
      dispatch_assignedTeamId: teamMember.teamId,
    };

    // Handle status filter - support multiple statuses
    if (status) {
      // If status is "active", get both assigned and en_route
      if (status === "active") {
        filter.dispatch_status = {
          in: ["assigned", "en_route"],
        };
      } else {
        filter.dispatch_status = status;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [dispatches, total] = await Promise.all([
      prisma.dispatch.findMany({
        where: filter,
        include: {
          dispatch_wasteAnalysis: {
            include: {
              waste_wasteCategories: true,
              waste_user: {
                select: {
                  user_id: true,
                  user_fullName: true,
                  user_email: true,
                  user_phoneNumber: true,
                },
              },
            },
          },
          dispatch_assignedTeam: {
            select: {
              team_id: true,
              team_name: true,
              team_specialization: true,
            },
          },
          dispatch_assignedTruck: {
            select: {
              truck_id: true,
              truck_registrationNumber: true,
              truck_truckType: true,
              truck_capacity: true,
              truck_imageURL: true,
            },
          },
          dispatch_collectionImages: true,
        },
        orderBy: [
          { dispatch_priority: "desc" },
          { dispatch_scheduledDate: "asc" },
        ],
        skip,
        take: parseInt(limit),
      }),
      prisma.dispatch.count({ where: filter }),
    ]);

    // Group by status for summary
    const statusCounts = await prisma.dispatch.groupBy({
      by: ["dispatch_status"],
      where: {
        dispatch_assignedTeamId: teamMember.teamId,
      },
      _count: true,
    });

    const summary = statusCounts.reduce((acc, item) => {
      acc[item.dispatch_status] = item._count;
      return acc;
    }, {});

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      results: dispatches.length,
      summary,
      data: dispatches,
    });
  })
);

// ============================================
// GET SINGLE DISPATCH DETAILS
// ============================================
router.get(
  "/dispatch/:id",
  isAuthenticated,
  isCollector,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const { id } = req.params;

    // Verify collector is part of the team assigned to this dispatch
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      select: { teamId: true },
    });

    if (!teamMember) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to any team",
      });
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { dispatch_id: id },
      include: {
        dispatch_wasteAnalysis: {
          include: {
            waste_wasteCategories: true,
            waste_user: {
              select: {
                user_id: true,
                user_fullName: true,
                user_email: true,
                user_phoneNumber: true,
              },
            },
          },
        },
        dispatch_assignedTeam: {
          include: {
            team_members: {
              include: {
                user: {
                  select: {
                    user_id: true,
                    user_fullName: true,
                    user_email: true,
                    user_role: true,
                    user_profileImage: true,
                  },
                },
              },
            },
          },
        },
        dispatch_assignedTruck: true,
        dispatch_collectionImages: true,
      },
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    // Verify this dispatch belongs to collector's team
    if (dispatch.dispatch_assignedTeamId !== teamMember.teamId) {
      return res.status(403).json({
        success: false,
        message: "This dispatch is not assigned to your team",
      });
    }

    res.json({
      success: true,
      data: dispatch,
    });
  })
);

// ============================================
// UPDATE DISPATCH STATUS (EN_ROUTE)
// ============================================
router.patch(
  "/dispatch/:id/start",
  isAuthenticated,
  isCollector,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const { id } = req.params;

    // Verify collector's team assignment
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      select: { teamId: true },
    });

    if (!teamMember) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to any team",
      });
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { dispatch_id: id },
      include: {
        dispatch_assignedTruck: true,
        dispatch_wasteAnalysis: {
          include: {
            waste_user: {
              select: {
                user_id: true,
                user_fullName: true,
              },
            },
          },
        },
      },
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    if (dispatch.dispatch_assignedTeamId !== teamMember.teamId) {
      return res.status(403).json({
        success: false,
        message: "This dispatch is not assigned to your team",
      });
    }

    if (dispatch.dispatch_status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: `Cannot start dispatch. Current status: ${dispatch.dispatch_status}`,
      });
    }

    // Update dispatch status to en_route and truck status to in_use
    const [updatedDispatch] = await prisma.$transaction([
      prisma.dispatch.update({
        where: { dispatch_id: id },
        data: {
          dispatch_status: "en_route",
        },
        include: {
          dispatch_assignedTruck: true,
          dispatch_assignedTeam: true,
        },
      }),
      prisma.truck.update({
        where: { truck_id: dispatch.dispatch_assignedTruckId },
        data: {
          truck_status: "in_use",
        },
      }),
    ]);

    // Notify waste reporter
    await notificationQueue.add('send-notification', {
      userId: dispatch.dispatch_wasteAnalysis.waste_analysedBy,
      type: "dispatch_update",
      title: "Collection Team En Route 🚛",
      message: `The collection team is on their way to collect the waste you reported. ETA: ${new Date(
        dispatch.dispatch_estimatedArrival
      ).toLocaleString()}`,
      entityType: "dispatch",
      entityId: id,
      priority: "high",
      metadata: {
        dispatchId: id,
        status: "en_route",
        truckRegistration: dispatch.dispatch_assignedTruck.truck_registrationNumber,
        estimatedArrival: dispatch.dispatch_estimatedArrival,
      },
    });

    res.json({
      success: true,
      message: "Dispatch started successfully. Status updated to en_route.",
      data: updatedDispatch,
    });
  })
);

// ============================================
// COMPLETE DISPATCH WITH VERIFICATION IMAGES
// ============================================
router.post(
  "/dispatch/:id/complete",
  isAuthenticated,
  isCollector,
  upload.array("verificationImages", 5),
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const { id } = req.params;
    const { collectionNotes, collectionVerified } = req.body;

    // Verify collector's team assignment
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      select: { teamId: true },
    });

    if (!teamMember) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to any team",
      });
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { dispatch_id: id },
      include: {
        dispatch_assignedTruck: true,
        dispatch_wasteAnalysis: {
          include: {
            waste_user: {
              select: {
                user_id: true,
                user_fullName: true,
                user_points: true,
              },
            },
          },
        },
        dispatch_assignedTeam: true,
      },
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    if (dispatch.dispatch_assignedTeamId !== teamMember.teamId) {
      return res.status(403).json({
        success: false,
        message: "This dispatch is not assigned to your team",
      });
    }

    if (!["en_route", "assigned"].includes(dispatch.dispatch_status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete dispatch. Current status: ${dispatch.dispatch_status}`,
      });
    }

    // Require verification images
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one verification image is required to complete the dispatch",
      });
    }

    // Upload verification images
    const imageUrls = [];
    for (const file of req.files) {
      try {
        const imageURL = await uploadToCloudinary(file, "dispatch-collections");
        imageUrls.push(imageURL);
      } catch (error) {
        console.error("Image upload error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to upload verification images",
          error: error.message,
        });
      }
    }

    // Calculate points to award (base: 50, bonus for priority)
    const basePoints = 50;
    const priorityBonus = {
      urgent: 30,
      high: 20,
      normal: 10,
      low: 5,
    };
    const pointsAwarded =
      basePoints + (priorityBonus[dispatch.dispatch_priority] || 10);

    // Update dispatch, waste, truck, user, and save images in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update dispatch
      const updatedDispatch = await tx.dispatch.update({
        where: { dispatch_id: id },
        data: {
          dispatch_status: "collected",
          dispatch_actualCollectionDate: new Date(),
          dispatch_collectionVerified: collectionVerified === "true" || true,
          dispatch_collectionNotes: collectionNotes || null,
          dispatch_pointsAwarded: pointsAwarded,
        },
        include: {
          dispatch_assignedTruck: true,
          dispatch_assignedTeam: true,
          dispatch_wasteAnalysis: true,
        },
      });

      // Update waste status
      const updatedWaste = await tx.wasteAnalysis.update({
        where: { waste_id: dispatch.dispatch_wasteAnalysisId },
        data: {
          waste_status: "collected",
        },
      });

      // Release truck (set back to available)
      const updatedTruck = await tx.truck.update({
        where: { truck_id: dispatch.dispatch_assignedTruckId },
        data: {
          truck_status: "available",
        },
      });

      // Award points to user
      const updatedUser = await tx.user.update({
        where: { user_id: dispatch.dispatch_wasteAnalysis.waste_analysedBy },
        data: {
          user_points: {
            increment: pointsAwarded,
          },
        },
      });

      // Save verification images
      const imageRecords = await Promise.all(
        imageUrls.map((url) =>
          tx.dispatchImage.create({
            data: {
              imageURL: url,
              dispatchId: id,
            },
          })
        )
      );

      return {
        updatedDispatch,
        updatedWaste,
        updatedTruck,
        updatedUser,
        imageRecords,
      };
    });

    const {
      updatedDispatch,
      updatedWaste,
      updatedTruck,
      updatedUser,
      imageRecords,
    } = result;

    // Check if there are pending dispatches for this truck and activate the next one
    const nextPendingDispatch = await prisma.dispatch.findFirst({
      where: {
        dispatch_assignedTruckId: dispatch.dispatch_assignedTruckId,
        dispatch_status: "pending",
      },
      orderBy: {
        dispatch_scheduledDate: "asc",
      },
    });

    if (nextPendingDispatch) {
      // Activate next dispatch in queue
      await prisma.dispatch.update({
        where: { dispatch_id: nextPendingDispatch.dispatch_id },
        data: {
          dispatch_status: "assigned",
          dispatch_scheduledDate: new Date(),
        },
      });

      // Update truck status back to in_use if there's a next dispatch
      await prisma.truck.update({
        where: { truck_id: dispatch.dispatch_assignedTruckId },
        data: {
          truck_status: "in_use",
        },
      });

      // Notify team about next dispatch
      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: dispatch.dispatch_assignedTeamId },
        select: { userId: true },
      });

      const teamNotifications = teamMembers.map((member) =>
        notificationQueue.add('send-notification', {
          userId: member.userId,
          type: "dispatch_assigned",
          title: "New Dispatch Assigned 📋",
          message: `Next dispatch activated for truck ${dispatch.dispatch_assignedTruck.truck_registrationNumber}`,
          entityType: "dispatch",
          entityId: nextPendingDispatch.dispatch_id,
          priority: "normal",
          metadata: {
            dispatchId: nextPendingDispatch.dispatch_id,
            truckId: dispatch.dispatch_assignedTruckId,
            queueActivated: true,
          },
        })
      );

      await Promise.all(teamNotifications);
    }

    // Notify waste reporter about collection
    await notificationQueue.add('send-notification', {
      userId: dispatch.dispatch_wasteAnalysis.waste_analysedBy,
      type: "cleanup_verified",
      title: "Waste Collected Successfully! 🎉",
      message: `Your reported waste has been collected. You've earned ${pointsAwarded} points! Total points: ${
        updatedUser.user_points
      }`,
      entityType: "dispatch",
      entityId: id,
      priority: "high",
      metadata: {
        dispatchId: id,
        pointsAwarded,
        totalPoints: updatedUser.user_points,
        collectionDate: updatedDispatch.dispatch_actualCollectionDate,
        imagesCount: imageUrls.length,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { user_role: "admin" },
      select: { user_id: true },
    });

    const adminNotifications = admins.map((admin) =>
      notificationQueue.add('send-notification', {
        userId: admin.user_id,
        type: "dispatch_update",
        title: "Dispatch Completed ✅",
        message: `Dispatch ${id.substring(0, 8)} completed by ${
          dispatch.dispatch_assignedTeam.team_name
        }. ${pointsAwarded} points awarded.`,
        entityType: "dispatch",
        entityId: id,
        priority: "normal",
        metadata: {
          dispatchId: id,
          teamId: dispatch.dispatch_assignedTeamId,
          teamName: dispatch.dispatch_assignedTeam.team_name,
          truckId: dispatch.dispatch_assignedTruckId,
          pointsAwarded,
          verificationImagesCount: imageUrls.length,
        },
      })
    );

    await Promise.all(adminNotifications);

    res.json({
      success: true,
      message: "Dispatch completed successfully! Truck released and points awarded.",
      data: {
        dispatch: updatedDispatch,
        pointsAwarded,
        userNewTotalPoints: updatedUser.user_points,
        verificationImagesUploaded: imageUrls.length,
        truckReleased: !nextPendingDispatch,
        nextDispatchActivated: !!nextPendingDispatch,
      },
    });
  })
);

// ============================================
// CANCEL/REPORT ISSUE WITH DISPATCH
// ============================================
router.post(
  "/dispatch/:id/report-issue",
  isAuthenticated,
  isCollector,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const { id } = req.params;
    const { issue, notes } = req.body;

    if (!issue) {
      return res.status(400).json({
        success: false,
        message: "Issue description is required",
      });
    }

    // Verify collector's team assignment
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      select: { teamId: true },
    });

    if (!teamMember) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to any team",
      });
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { dispatch_id: id },
      include: {
        dispatch_wasteAnalysis: {
          include: {
            waste_user: true,
          },
        },
        dispatch_assignedTeam: true,
      },
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    if (dispatch.dispatch_assignedTeamId !== teamMember.teamId) {
      return res.status(403).json({
        success: false,
        message: "This dispatch is not assigned to your team",
      });
    }

    // Update dispatch with issue notes
    const updatedDispatch = await prisma.dispatch.update({
      where: { dispatch_id: id },
      data: {
        dispatch_collectionNotes: `ISSUE REPORTED: ${issue}. ${
          notes ? `Additional notes: ${notes}` : ""
        }`,
      },
    });

    // Notify admins about the issue
    const admins = await prisma.user.findMany({
      where: { user_role: "admin" },
      select: { user_id: true },
    });

    const adminNotifications = admins.map((admin) =>
      notificationQueue.add('send-notification', {
        userId: admin.user_id,
        type: "dispatch_update",
        title: "Dispatch Issue Reported ⚠️",
        message: `Team ${dispatch.dispatch_assignedTeam.team_name} reported an issue with dispatch ${id.substring(
          0,
          8
        )}: ${issue}`,
        entityType: "dispatch",
        entityId: id,
        priority: "high",
        metadata: {
          dispatchId: id,
          teamId: dispatch.dispatch_assignedTeamId,
          issue,
          notes,
          reportedBy: userId,
        },
      })
    );

    await Promise.all(adminNotifications);

    res.json({
      success: true,
      message: "Issue reported successfully. Admins have been notified.",
      data: updatedDispatch,
    });
  })
);

// ============================================
// GET COLLECTOR STATISTICS
// ============================================
router.get(
  "/my-stats",
  isAuthenticated,
  isCollector,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;

    // Find collector's team
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      select: { teamId: true },
    });

    if (!teamMember) {
      return res.json({
        success: true,
        message: "No team assignment found",
        data: {
          totalDispatches: 0,
          completedDispatches: 0,
          pendingDispatches: 0,
          totalPointsAwarded: 0,
        },
      });
    }

    const [statusCounts, totalPointsResult, recentDispatches] =
      await Promise.all([
        prisma.dispatch.groupBy({
          by: ["dispatch_status"],
          where: {
            dispatch_assignedTeamId: teamMember.teamId,
          },
          _count: true,
        }),

        prisma.dispatch.aggregate({
          where: {
            dispatch_assignedTeamId: teamMember.teamId,
            dispatch_status: "collected",
          },
          _sum: {
            dispatch_pointsAwarded: true,
          },
        }),

        prisma.dispatch.findMany({
          where: {
            dispatch_assignedTeamId: teamMember.teamId,
            dispatch_status: "collected",
          },
          take: 5,
          orderBy: {
            dispatch_actualCollectionDate: "desc",
          },
          include: {
            dispatch_wasteAnalysis: {
              select: {
                waste_dominantWasteType: true,
                waste_locationAddress: true,
              },
            },
          },
        }),
      ]);

    const stats = statusCounts.reduce((acc, item) => {
      acc[item.dispatch_status] = item._count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalDispatches: statusCounts.reduce(
          (sum, item) => sum + item._count,
          0
        ),
        completedDispatches: stats.collected || 0,
        pendingDispatches: (stats.assigned || 0) + (stats.pending || 0),
        enRouteDispatches: stats.en_route || 0,
        totalPointsAwarded: totalPointsResult._sum.dispatch_pointsAwarded || 0,
        statusBreakdown: stats,
        recentCollections: recentDispatches,
      },
    });
  })
);

export { router as collectorDispatchRoutes };