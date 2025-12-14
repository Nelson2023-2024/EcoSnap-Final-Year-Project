import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";
import upload from "../middleware/upload.middleware.js";
import { uploadToCloudinary } from "../lib/upload.cloudinary.js";

const router = Router();

// ============================================
// HELPER: Validate if waste can be dispatched
// ============================================
async function validateWasteForDispatch(wasteId) {
  const waste = await prisma.wasteAnalysis.findUnique({
    where: { waste_id: wasteId },
    include: {
      waste_wasteCategories: true,
    },
  });

  if (!waste) {
    return {
      valid: false,
      error: "Waste analysis not found",
      statusCode: 404,
    };
  }

  // Check if waste report contains actual waste
  if (!waste.waste_containsWaste) {
    return {
      valid: false,
      error: "Cannot dispatch: This report indicates no waste was detected",
      statusCode: 400,
      details: "The AI analysis determined there is no waste in this image",
    };
  }

  // Check for error status
  if (waste.waste_status === "error") {
    return {
      valid: false,
      error: "Cannot dispatch: Waste analysis failed with errors",
      statusCode: 400,
      details: waste.waste_errorMessage || "Unknown error occurred during analysis",
    };
  }

  // Check for no_waste status
  if (waste.waste_status === "no_waste") {
    return {
      valid: false,
      error: "Cannot dispatch: No waste detected at this location",
      statusCode: 400,
    };
  }

  // Check if already dispatched
  if (waste.waste_status !== "pending_dispatch") {
    return {
      valid: false,
      error: `Cannot dispatch: Waste is already ${waste.waste_status}`,
      statusCode: 400,
    };
  }

  // Check if dispatch already exists
  const existingDispatch = await prisma.dispatch.findUnique({
    where: { dispatch_wasteAnalysisId: wasteId },
  });

  if (existingDispatch) {
    return {
      valid: false,
      error: "Dispatch already exists for this waste report",
      statusCode: 400,
      dispatchId: existingDispatch.dispatch_id,
    };
  }

  return {
    valid: true,
    waste,
  };
}

// ============================================
// CHECK IF WASTE CAN BE DISPATCHED
// ============================================
router.get(
  "/can-dispatch/:wasteAnalysisId",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { wasteAnalysisId } = req.params;

    const validation = await validateWasteForDispatch(wasteAnalysisId);

    if (!validation.valid) {
      return res.status(validation.statusCode).json({
        success: false,
        canDispatch: false,
        message: validation.error,
        details: validation.details,
        dispatchId: validation.dispatchId,
      });
    }

    res.json({
      success: true,
      canDispatch: true,
      message: "Waste report is ready for dispatch",
      data: {
        wasteId: validation.waste.waste_id,
        containsWaste: validation.waste.waste_containsWaste,
        status: validation.waste.waste_status,
        dominantType: validation.waste.waste_dominantWasteType,
        categories: validation.waste.waste_wasteCategories,
      },
    });
  })
);

// ============================================
// AUTOMATIC DISPATCH
// ============================================
router.post(
  "/auto/:wasteAnalysisId",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { wasteAnalysisId } = req.params;
    const adminUserId = req.user.user_id;

    // Validate if waste can be dispatched
    const validation = await validateWasteForDispatch(wasteAnalysisId);
    if (!validation.valid) {
      return res.status(validation.statusCode).json({
        success: false,
        message: validation.error,
        details: validation.details,
        dispatchId: validation.dispatchId,
      });
    }

    const waste = validation.waste;

    // Determine waste specialization
    const wasteTypeMapping = {
      "pet plastic": "recyclables",
      "hdpe plastic": "recyclables",
      "glass": "recyclables",
      "e-waste": "e_waste",
      "battery": "e_waste",
      "electronics": "e_waste",
      "organic": "organic",
      "food waste": "organic",
      "hazardous": "hazardous",
      "chemical": "hazardous",
    };

    let requiredSpecialization = "general";
    const dominantType = (waste.waste_dominantWasteType || "").toLowerCase();

    // Match dominant waste type to specialization
    for (const [key, spec] of Object.entries(wasteTypeMapping)) {
      if (dominantType.includes(key)) {
        requiredSpecialization = spec;
        break;
      }
    }

    // Find available team with matching specialization
    let team = await prisma.team.findFirst({
      where: {
        team_specialization: requiredSpecialization,
        team_status: "active",
      },
      include: {
        team_trucks: {
          where: {
            truck_status: "available",
          },
        },
        team_dispatches: {
          where: {
            dispatch_status: {
              in: ["assigned", "en_route"],
            },
          },
          orderBy: {
            dispatch_estimatedArrival: "asc",
          },
          take: 1,
          include: {
            dispatch_assignedTruck: true,
          },
        },
      },
    });

    // Fallback to general team if no specialized team found
    if (!team) {
      team = await prisma.team.findFirst({
        where: {
          team_specialization: "general",
          team_status: "active",
        },
        include: {
          team_trucks: {
            where: {
              truck_status: "available",
            },
          },
          team_dispatches: {
            where: {
              dispatch_status: {
                in: ["assigned", "en_route"],
              },
            },
            orderBy: {
              dispatch_estimatedArrival: "asc",
            },
            take: 1,
            include: {
              dispatch_assignedTruck: true,
            },
          },
        },
      });
    }

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No available teams found",
      });
    }

    let availableTruck = null;
    let scheduledDate = new Date();
    let isQueued = false;
    let queueInfo = null;

    // Check if there's an available truck
    if (team.team_trucks.length > 0) {
      // Use immediately available truck
      availableTruck = team.team_trucks[0];
      scheduledDate.setHours(scheduledDate.getHours() + 24);
    } else {
      // No available trucks - queue behind the earliest finishing dispatch
      const nextAvailableDispatch = team.team_dispatches[0];

      if (!nextAvailableDispatch) {
        // Team exists but has no trucks at all
        return res.status(404).json({
          success: false,
          message: `Team "${team.team_name}" has no trucks assigned`,
        });
      }

      // Use the truck from the earliest finishing dispatch
      availableTruck = nextAvailableDispatch.dispatch_assignedTruck;
      
      // Schedule after the current dispatch's estimated arrival + 2 hours buffer
      scheduledDate = new Date(nextAvailableDispatch.dispatch_estimatedArrival);
      scheduledDate.setHours(scheduledDate.getHours() + 2);
      
      isQueued = true;
      queueInfo = {
        waitingForDispatch: nextAvailableDispatch.dispatch_id,
        currentDispatchETA: nextAvailableDispatch.dispatch_estimatedArrival,
        truckAvailableAfter: scheduledDate,
        estimatedWaitTime: Math.ceil(
          (scheduledDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)
        ), // hours
      };
    }

    if (!availableTruck) {
      return res.status(404).json({
        success: false,
        message: "No trucks found for this team",
      });
    }

    const estimatedArrival = new Date(scheduledDate);
    estimatedArrival.setHours(estimatedArrival.getHours() + 2);

    // Create dispatch
    const dispatch = await prisma.dispatch.create({
      data: {
        dispatch_wasteAnalysisId: waste.waste_id,
        dispatch_assignedTeamId: team.team_id,
        dispatch_assignedTruckId: availableTruck.truck_id,
        dispatch_locationLongitude: waste.waste_locationLongitude,
        dispatch_locationLatitude: waste.waste_locationLatitude,
        dispatch_locationAddress: waste.waste_locationAddress,
        dispatch_status: "assigned",
        dispatch_scheduledDate: scheduledDate,
        dispatch_estimatedArrival: estimatedArrival,
        dispatch_priority: "normal",
      },
      include: {
        dispatch_wasteAnalysis: true,
        dispatch_assignedTeam: true,
        dispatch_assignedTruck: true,
      },
    });

    // Update waste status
    await prisma.wasteAnalysis.update({
      where: { waste_id: waste.waste_id },
      data: { waste_status: "dispatched" },
    });

    // Only mark truck as in_use if it's currently available
    // If queued, truck stays in its current status
    if (!isQueued) {
      await prisma.truck.update({
        where: { truck_id: availableTruck.truck_id },
        data: { truck_status: "in_use" },
      });
    }

    // Notify user who reported the waste
    await prisma.notification.create({
      data: {
        notification_userId: waste.waste_analysedBy,
        notification_entityType: "dispatch",
        notification_entityId: dispatch.dispatch_id,
        notification_type: "dispatch_assigned",
        notification_title: isQueued ? "Pickup Queued 🕐" : "Pickup Scheduled! 🚚",
        notification_message: isQueued
          ? `Your waste report has been queued with ${team.team_name}. Expected pickup: ${scheduledDate.toLocaleDateString()} (after current collection completes)`
          : `Your waste report has been assigned to ${team.team_name}. Expected pickup: ${scheduledDate.toLocaleDateString()}`,
        notification_priority: isQueued ? "normal" : "high",
        notification_metadata: {
          dispatchId: dispatch.dispatch_id,
          teamName: team.team_name,
          truckRegistration: availableTruck.truck_registrationNumber,
          scheduledDate: scheduledDate.toISOString(),
          isQueued,
          queueInfo,
        },
      },
    });

    // Get all admins
    const admins = await prisma.user.findMany({
      where: { user_role: "admin" },
      select: { user_id: true },
    });

    // Notify all admins
    const adminNotifications = admins.map((admin) =>
      prisma.notification.create({
        data: {
          notification_userId: admin.user_id,
          notification_entityType: "dispatch",
          notification_entityId: dispatch.dispatch_id,
          notification_type: "dispatch_assigned",
          notification_title: isQueued
            ? "Dispatch Queued (Auto)"
            : "Dispatch Created (Auto)",
          notification_message: isQueued
            ? `Queued dispatch for ${team.team_name}: ${requiredSpecialization} waste at ${waste.waste_locationAddress}. Scheduled after current collection (${queueInfo.estimatedWaitTime}h wait)`
            : `Automatic dispatch assigned to ${team.team_name} for ${requiredSpecialization} waste at ${waste.waste_locationAddress}`,
          notification_priority: "normal",
          notification_metadata: {
            dispatchId: dispatch.dispatch_id,
            wasteId: waste.waste_id,
            teamName: team.team_name,
            specialization: requiredSpecialization,
            isQueued,
            queueInfo,
          },
        },
      })
    );

    // Get team members and notify them
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: team.team_id },
      include: {
        user: {
          select: {
            user_id: true,
            user_role: true,
          },
        },
      },
    });

    const teamNotifications = teamMembers.map((member) =>
      prisma.notification.create({
        data: {
          notification_userId: member.user.user_id,
          notification_entityType: "dispatch",
          notification_entityId: dispatch.dispatch_id,
          notification_type: "dispatch_assigned",
          notification_title: "New Pickup Assignment 📋",
          notification_message: `New ${requiredSpecialization} waste pickup at ${waste.waste_locationAddress}`,
          notification_priority: "high",
          notification_metadata: {
            dispatchId: dispatch.dispatch_id,
            specialization: requiredSpecialization,
            location: waste.waste_locationAddress,
            scheduledDate: scheduledDate.toISOString(),
          },
        },
      })
    );

    await Promise.all([...adminNotifications, ...teamNotifications]);

    res.status(201).json({
      success: true,
      message: isQueued
        ? "Dispatch queued successfully - will be processed after current collection"
        : "Dispatch created automatically",
      data: dispatch,
      queueStatus: {
        isQueued,
        queueInfo,
      },
      notifications: {
        user: 1,
        admins: admins.length,
        teamMembers: teamMembers.length,
      },
    });
  })
);

// ============================================
// MANUAL DISPATCH
// ============================================
router.post(
  "/manual",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { wasteAnalysisId, teamId, truckId, scheduledDate, priority } =
      req.body;
    const adminUserId = req.user.user_id;

    // Validate required fields
    if (!wasteAnalysisId || !teamId || !truckId) {
      return res.status(400).json({
        success: false,
        message: "wasteAnalysisId, teamId, and truckId are required",
      });
    }

    // Validate if waste can be dispatched
    const validation = await validateWasteForDispatch(wasteAnalysisId);
    if (!validation.valid) {
      return res.status(validation.statusCode).json({
        success: false,
        message: validation.error,
        details: validation.details,
        dispatchId: validation.dispatchId,
      });
    }

    const waste = validation.waste;

    // Validate team
    const team = await prisma.team.findUnique({
      where: { team_id: teamId },
      include: {
        team_trucks: {
          select: {
            truck_id: true,
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Validate truck
    const truck = await prisma.truck.findUnique({
      where: { truck_id: truckId },
    });

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: "Truck not found",
      });
    }

    // Check if truck belongs to team
    const truckBelongsToTeam = team.team_trucks.some(
      (t) => t.truck_id === truckId
    );

    if (!truckBelongsToTeam) {
      return res.status(400).json({
        success: false,
        message: "Truck does not belong to selected team",
      });
    }

    // Parse scheduled date or default to 24 hours
    const pickupDate = scheduledDate
      ? new Date(scheduledDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const estimatedArrival = new Date(pickupDate);
    estimatedArrival.setHours(estimatedArrival.getHours() + 2);

    // Create dispatch
    const dispatch = await prisma.dispatch.create({
      data: {
        dispatch_wasteAnalysisId: waste.waste_id,
        dispatch_assignedTeamId: team.team_id,
        dispatch_assignedTruckId: truck.truck_id,
        dispatch_locationLongitude: waste.waste_locationLongitude,
        dispatch_locationLatitude: waste.waste_locationLatitude,
        dispatch_locationAddress: waste.waste_locationAddress,
        dispatch_status: "assigned",
        dispatch_scheduledDate: pickupDate,
        dispatch_estimatedArrival: estimatedArrival,
        dispatch_priority: priority || "normal",
      },
      include: {
        dispatch_wasteAnalysis: true,
        dispatch_assignedTeam: true,
        dispatch_assignedTruck: true,
      },
    });

    // Update waste status
    await prisma.wasteAnalysis.update({
      where: { waste_id: waste.waste_id },
      data: { waste_status: "dispatched" },
    });

    // Update truck status
    await prisma.truck.update({
      where: { truck_id: truck.truck_id },
      data: { truck_status: "in_use" },
    });

    // Notify user who reported
    await prisma.notification.create({
      data: {
        notification_userId: waste.waste_analysedBy,
        notification_entityType: "dispatch",
        notification_entityId: dispatch.dispatch_id,
        notification_type: "dispatch_assigned",
        notification_title: "Pickup Scheduled! 🚚",
        notification_message: `Your waste report has been manually assigned to ${team.team_name}. Expected pickup: ${pickupDate.toLocaleDateString()}`,
        notification_priority: "high",
        notification_metadata: {
          dispatchId: dispatch.dispatch_id,
          teamName: team.team_name,
          truckRegistration: truck.truck_registrationNumber,
          scheduledDate: pickupDate.toISOString(),
          manual: true,
        },
      },
    });

    // Get all admins
    const admins = await prisma.user.findMany({
      where: { user_role: "admin" },
      select: { user_id: true },
    });

    // Notify admins (excluding the one who created it)
    const adminNotifications = admins
      .filter((admin) => admin.user_id !== adminUserId)
      .map((admin) =>
        prisma.notification.create({
          data: {
            notification_userId: admin.user_id,
            notification_entityType: "dispatch",
            notification_entityId: dispatch.dispatch_id,
            notification_type: "dispatch_assigned",
            notification_title: "Dispatch Created (Manual)",
            notification_message: `Manual dispatch assigned to ${team.team_name} at ${waste.waste_locationAddress}`,
            notification_priority: "normal",
            notification_metadata: {
              dispatchId: dispatch.dispatch_id,
              wasteId: waste.waste_id,
              teamName: team.team_name,
              createdBy: adminUserId,
            },
          },
        })
      );

    // Get team members and notify them
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId: team.team_id },
      select: { userId: true },
    });

    const teamNotifications = teamMembers.map((member) =>
      prisma.notification.create({
        data: {
          notification_userId: member.userId,
          notification_entityType: "dispatch",
          notification_entityId: dispatch.dispatch_id,
          notification_type: "dispatch_assigned",
          notification_title: "New Pickup Assignment 📋",
          notification_message: `Manual assignment: Pickup at ${waste.waste_locationAddress}`,
          notification_priority: "high",
          notification_metadata: {
            dispatchId: dispatch.dispatch_id,
            location: waste.waste_locationAddress,
            scheduledDate: pickupDate.toISOString(),
          },
        },
      })
    );

    await Promise.all([...adminNotifications, ...teamNotifications]);

    res.status(201).json({
      success: true,
      message: "Dispatch created manually",
      data: dispatch,
      notifications: {
        user: 1,
        admins: adminNotifications.length,
        teamMembers: teamMembers.length,
      },
    });
  })
);

// ============================================
// GET TEAM/TRUCK AVAILABILITY
// ============================================
router.get(
  "/availability",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { specialization } = req.query;

    // Get all teams with their trucks and active dispatches
    const whereClause = specialization
      ? { team_specialization: specialization, team_status: "active" }
      : { team_status: "active" };

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        team_trucks: {
          include: {
            truck_dispatches: {
              where: {
                dispatch_status: {
                  in: ["assigned", "en_route"],
                },
              },
              orderBy: {
                dispatch_estimatedArrival: "asc",
              },
              take: 1,
            },
          },
        },
        team_dispatches: {
          where: {
            dispatch_status: {
              in: ["assigned", "en_route"],
            },
          },
        },
      },
    });

    const availability = teams.map((team) => {
      const availableTrucks = team.team_trucks.filter(
        (truck) => truck.truck_status === "available"
      );

      const busyTrucks = team.team_trucks.filter(
        (truck) => truck.truck_status === "in_use"
      );

      // Find next available time across all busy trucks
      let nextAvailableTime = null;
      let nextAvailableTruck = null;

      busyTrucks.forEach((truck) => {
        if (truck.truck_dispatches.length > 0) {
          const dispatch = truck.truck_dispatches[0];
          const estimatedFree = new Date(dispatch.dispatch_estimatedArrival);
          estimatedFree.setHours(estimatedFree.getHours() + 2); // Add buffer

          if (
            !nextAvailableTime ||
            estimatedFree.getTime() < nextAvailableTime.getTime()
          ) {
            nextAvailableTime = estimatedFree;
            nextAvailableTruck = {
              truckId: truck.truck_id,
              registration: truck.truck_registrationNumber,
              currentDispatchId: dispatch.dispatch_id,
              estimatedArrival: dispatch.dispatch_estimatedArrival,
            };
          }
        }
      });

      return {
        teamId: team.team_id,
        teamName: team.team_name,
        specialization: team.team_specialization,
        status: team.team_status,
        totalTrucks: team.team_trucks.length,
        availableTrucks: availableTrucks.length,
        busyTrucks: busyTrucks.length,
        activeDispatches: team.team_dispatches.length,
        immediatelyAvailable: availableTrucks.length > 0,
        nextAvailableTime,
        nextAvailableTruck,
        estimatedWaitHours: nextAvailableTime
          ? Math.ceil(
              (nextAvailableTime.getTime() - new Date().getTime()) /
                (1000 * 60 * 60)
            )
          : null,
        availableTruckDetails: availableTrucks.map((t) => ({
          truckId: t.truck_id,
          registration: t.truck_registrationNumber,
          type: t.truck_truckType,
          capacity: t.truck_capacity,
        })),
      };
    });

    // Overall summary
    const summary = {
      totalTeams: teams.length,
      teamsWithAvailableTrucks: availability.filter(
        (a) => a.immediatelyAvailable
      ).length,
      teamsFullyBusy: availability.filter((a) => !a.immediatelyAvailable)
        .length,
      totalAvailableTrucks: availability.reduce(
        (sum, a) => sum + a.availableTrucks,
        0
      ),
      totalBusyTrucks: availability.reduce((sum, a) => sum + a.busyTrucks, 0),
    };

    res.json({
      success: true,
      summary,
      teams: availability,
    });
  })
);

// ============================================
// GET DISPATCHABLE WASTE REPORTS
// ============================================
// Returns only waste reports that can be dispatched
router.get(
  "/dispatchable-waste",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find waste reports that:
    // 1. Actually contain waste
    // 2. Are pending dispatch
    // 3. Don't have errors
    // 4. Don't already have a dispatch assigned
    const [wasteReports, total] = await Promise.all([
      prisma.wasteAnalysis.findMany({
        where: {
          waste_containsWaste: true,
          waste_status: "pending_dispatch",
          waste_dispatch: null, // No dispatch exists yet
        },
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
        take: parseInt(limit),
      }),
      prisma.wasteAnalysis.count({
        where: {
          waste_containsWaste: true,
          waste_status: "pending_dispatch",
          waste_dispatch: null,
        },
      }),
    ]);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      results: wasteReports.length,
      data: wasteReports,
    });
  })
);

// ============================================
// GET DISPATCH QUEUE
// ============================================
router.get(
  "/queue",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { teamId } = req.query;

    const whereClause = {
      dispatch_status: "pending",
    };

    if (teamId) {
      whereClause.dispatch_assignedTeamId = teamId;
    }

    const queuedDispatches = await prisma.dispatch.findMany({
      where: whereClause,
      include: {
        dispatch_wasteAnalysis: {
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
            truck_status: true,
          },
        },
      },
      orderBy: {
        dispatch_scheduledDate: "asc",
      },
    });

    // Calculate position in queue and estimated activation time
    const enrichedQueue = await Promise.all(
      queuedDispatches.map(async (dispatch, index) => {
        // Find current active dispatch using the same truck
        const activeDispatch = await prisma.dispatch.findFirst({
          where: {
            dispatch_assignedTruckId: dispatch.dispatch_assignedTruckId,
            dispatch_status: {
              in: ["assigned", "en_route"],
            },
          },
          orderBy: {
            dispatch_estimatedArrival: "asc",
          },
        });

        let estimatedActivation = null;
        let blockedBy = null;

        if (activeDispatch) {
          estimatedActivation = new Date(
            activeDispatch.dispatch_estimatedArrival
          );
          estimatedActivation.setHours(estimatedActivation.getHours() + 2);
          blockedBy = {
            dispatchId: activeDispatch.dispatch_id,
            estimatedCompletion: activeDispatch.dispatch_estimatedArrival,
          };
        }

        return {
          ...dispatch,
          queuePosition: index + 1,
          estimatedActivation,
          blockedBy,
          waitTimeHours: estimatedActivation
            ? Math.ceil(
                (estimatedActivation.getTime() - new Date().getTime()) /
                  (1000 * 60 * 60)
              )
            : null,
        };
      })
    );

    res.json({
      success: true,
      total: queuedDispatches.length,
      data: enrichedQueue,
    });
  })
);

// ============================================
// GET ALL DISPATCHES
// ============================================
router.get(
  "/",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { status, teamId, priority, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.dispatch_status = status;
    if (teamId) filter.dispatch_assignedTeamId = teamId;
    if (priority) filter.dispatch_priority = priority;

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
            },
          },
          dispatch_collectionImages: true,
        },
        orderBy: { dispatch_createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.dispatch.count({ where: filter }),
    ]);

    res.json({
      success: true,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      results: dispatches.length,
      data: dispatches,
    });
  })
);

// ============================================
// GET SINGLE DISPATCH
// ============================================
router.get(
  "/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const dispatch = await prisma.dispatch.findUnique({
      where: { dispatch_id: req.params.id },
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

    res.json({
      success: true,
      data: dispatch,
    });
  })
);

// ============================================
// UPDATE DISPATCH STATUS
// ============================================
router.patch(
  "/:id/status",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { status, collectionNotes } = req.body;
    const userId = req.user.user_id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const dispatch = await prisma.dispatch.findUnique({
      where: { dispatch_id: req.params.id },
      include: {
        dispatch_wasteAnalysis: {
          include: {
            waste_user: true,
          },
        },
        dispatch_assignedTeam: true,
        dispatch_assignedTruck: true,
      },
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    const oldStatus = dispatch.dispatch_status;
    const updateData = {
      dispatch_status: status,
    };

    if (collectionNotes) {
      updateData.dispatch_collectionNotes = collectionNotes;
    }

    // Handle completion
    if (status === "collected" || status === "completed") {
      const pointsToAward = 50;

      updateData.dispatch_actualCollectionDate = new Date();
      updateData.dispatch_collectionVerified = true;
      updateData.dispatch_pointsAwarded = pointsToAward;

      // Update waste status
      await prisma.wasteAnalysis.update({
        where: { waste_id: dispatch.dispatch_wasteAnalysisId },
        data: { waste_status: "collected" },
      });

      // Award points to user
      await prisma.user.update({
        where: { user_id: dispatch.dispatch_wasteAnalysis.waste_analysedBy },
        data: {
          user_points: {
            increment: pointsToAward,
          },
        },
      });

      // Create reward record
      const reward = await prisma.reward.create({
        data: {
          reward_userId: dispatch.dispatch_wasteAnalysis.waste_analysedBy,
          reward_wasteAnalysisId: dispatch.dispatch_wasteAnalysisId,
          reward_pointsEarned: pointsToAward,
          reward_reason: "cleanup_verified",
          reward_transactionType: "credit",
        },
      });

      // Notify user about collection and reward
      await prisma.notification.create({
        data: {
          notification_userId:
            dispatch.dispatch_wasteAnalysis.waste_analysedBy,
          notification_entityType: "dispatch",
          notification_entityId: dispatch.dispatch_id,
          notification_type: "cleanup_verified",
          notification_title: "Waste Collected! ✅",
          notification_message: `Your reported waste has been collected by ${dispatch.dispatch_assignedTeam.team_name}. You earned ${pointsToAward} points!`,
          notification_priority: "high",
          notification_metadata: {
            dispatchId: dispatch.dispatch_id,
            pointsEarned: pointsToAward,
            rewardId: reward.reward_id,
            teamName: dispatch.dispatch_assignedTeam.team_name,
          },
        },
      });

      // Free up truck
      await prisma.truck.update({
        where: { truck_id: dispatch.dispatch_assignedTruckId },
        data: { truck_status: "available" },
      });

      // Notify admins
      const admins = await prisma.user.findMany({
        where: { user_role: "admin" },
        select: { user_id: true },
      });

      const adminNotifications = admins.map((admin) =>
        prisma.notification.create({
          data: {
            notification_userId: admin.user_id,
            notification_entityType: "dispatch",
            notification_entityId: dispatch.dispatch_id,
            notification_type: "dispatch_update",
            notification_title: "Collection Completed",
            notification_message: `${dispatch.dispatch_assignedTeam.team_name} completed collection at ${dispatch.dispatch_locationAddress}`,
            notification_metadata: {
              dispatchId: dispatch.dispatch_id,
              teamName: dispatch.dispatch_assignedTeam.team_name,
              pointsAwarded: pointsToAward,
            },
          },
        })
      );

      await Promise.all(adminNotifications);
    }

    // Update dispatch
    const updatedDispatch = await prisma.dispatch.update({
      where: { dispatch_id: req.params.id },
      data: updateData,
      include: {
        dispatch_wasteAnalysis: true,
        dispatch_assignedTeam: true,
        dispatch_assignedTruck: true,
      },
    });

    res.json({
      success: true,
      message: `Dispatch status updated from ${oldStatus} to ${status}`,
      data: updatedDispatch,
    });
  })
);

// ============================================
// UPLOAD COLLECTION IMAGES
// ============================================
router.post(
  "/:id/images",
  isAuthenticated,
  upload.array("images", 5),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const dispatch = await prisma.dispatch.findUnique({
      where: { dispatch_id: id },
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    // Upload images to Cloudinary
    const imageUrls = [];
    for (const file of req.files) {
      try {
        const imageURL = await uploadToCloudinary(file, "dispatch-collections");
        imageUrls.push(imageURL);
      } catch (error) {
        console.error("Image upload error:", error);
      }
    }

    // Save image records
    const imageRecords = await Promise.all(
      imageUrls.map((url) =>
        prisma.dispatchImage.create({
          data: {
            imageURL: url,
            dispatchId: id,
          },
        })
      )
    );

    res.json({
      success: true,
      message: `${imageRecords.length} collection images uploaded successfully`,
      data: imageRecords,
    });
  })
);

// ============================================
// DELETE DISPATCH (Cancel)
// ============================================
router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.user.user_id;

    const dispatch = await prisma.dispatch.findUnique({
      where: { dispatch_id: id },
      include: {
        dispatch_wasteAnalysis: {
          include: {
            waste_user: true,
          },
        },
        dispatch_assignedTeam: true,
        dispatch_assignedTruck: true,
      },
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    // Free up resources
    await prisma.wasteAnalysis.update({
      where: { waste_id: dispatch.dispatch_wasteAnalysisId },
      data: { waste_status: "pending_dispatch" },
    });

    await prisma.truck.update({
      where: { truck_id: dispatch.dispatch_assignedTruckId },
      data: { truck_status: "available" },
    });

    // Notify user about cancellation
    await prisma.notification.create({
      data: {
        notification_userId: dispatch.dispatch_wasteAnalysis.waste_analysedBy,
        notification_entityType: "dispatch",
        notification_entityId: dispatch.dispatch_id,
        notification_type: "dispatch_update",
        notification_title: "Dispatch Cancelled",
        notification_message:
          "Your scheduled pickup has been cancelled. We will reschedule soon.",
        notification_priority: "high",
        notification_metadata: {
          dispatchId: dispatch.dispatch_id,
          reason: "cancelled_by_admin",
        },
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { user_role: "admin" },
      select: { user_id: true },
    });

    const adminNotifications = admins
      .filter((admin) => admin.user_id !== adminUserId)
      .map((admin) =>
        prisma.notification.create({
          data: {
            notification_userId: admin.user_id,
            notification_entityType: "dispatch",
            notification_entityId: dispatch.dispatch_id,
            notification_type: "dispatch_update",
            notification_title: "Dispatch Cancelled",
            notification_message: `Dispatch at ${dispatch.dispatch_locationAddress} has been cancelled`,
            notification_metadata: {
              dispatchId: dispatch.dispatch_id,
              cancelledBy: adminUserId,
            },
          },
        })
      );

    await Promise.all(adminNotifications);

    // Delete dispatch
    await prisma.dispatch.delete({
      where: { dispatch_id: id },
    });

    res.json({
      success: true,
      message: "Dispatch cancelled and deleted successfully",
    });
  })
);

export { router as dispatchRoutes };