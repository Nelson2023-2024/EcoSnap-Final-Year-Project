// src/routes/dispatch.routes.js
import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";
import upload from "../middleware/upload.middleware.js";
import { uploadToCloudinary } from "../lib/upload.cloudinary.js";
import { dispatchQueue, notificationQueue } from "../config/queue.config.js";

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

  if (!waste.waste_containsWaste) {
    return {
      valid: false,
      error: "Cannot dispatch: This report indicates no waste was detected",
      statusCode: 400,
      details: "The AI analysis determined there is no waste in this image",
    };
  }

  if (waste.waste_status === "error") {
    return {
      valid: false,
      error: "Cannot dispatch: Waste analysis failed with errors",
      statusCode: 400,
      details: waste.waste_errorMessage || "Unknown error occurred during analysis",
    };
  }

  if (waste.waste_status === "no_waste") {
    return {
      valid: false,
      error: "Cannot dispatch: No waste detected at this location",
      statusCode: 400,
    };
  }

  if (waste.waste_status !== "pending_dispatch") {
    return {
      valid: false,
      error: `Cannot dispatch: Waste is already ${waste.waste_status}`,
      statusCode: 400,
    };
  }

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
// AUTOMATIC DISPATCH (with Queue)
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

    for (const [key, spec] of Object.entries(wasteTypeMapping)) {
      if (dominantType.includes(key)) {
        requiredSpecialization = spec;
        break;
      }
    }

    // Find available team
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

    // Fallback to general team
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

    // Check truck availability
    if (team.team_trucks.length > 0) {
      availableTruck = team.team_trucks[0];
      scheduledDate.setHours(scheduledDate.getHours() + 24);
    } else {
      const nextAvailableDispatch = team.team_dispatches[0];

      if (!nextAvailableDispatch) {
        return res.status(404).json({
          success: false,
          message: `Team "${team.team_name}" has no trucks assigned`,
        });
      }

      availableTruck = nextAvailableDispatch.dispatch_assignedTruck;
      scheduledDate = new Date(nextAvailableDispatch.dispatch_estimatedArrival);
      scheduledDate.setHours(scheduledDate.getHours() + 2);
      
      isQueued = true;
      queueInfo = {
        waitingForDispatch: nextAvailableDispatch.dispatch_id,
        currentDispatchETA: nextAvailableDispatch.dispatch_estimatedArrival,
        truckAvailableAfter: scheduledDate,
        estimatedWaitTime: Math.ceil(
          (scheduledDate.getTime() - new Date().getTime()) / (1000 * 60 * 60)
        ),
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

    // Add job to queue
    const job = await dispatchQueue.add('create-auto-dispatch', {
      wasteAnalysisId,
      waste,
      team,
      availableTruck,
      scheduledDate: scheduledDate.toISOString(),
      estimatedArrival: estimatedArrival.toISOString(),
      isQueued,
      queueInfo,
      requiredSpecialization,
    }, {
      priority: isQueued ? 5 : 1, // Higher priority for immediate dispatch
      jobId: `auto-dispatch-${wasteAnalysisId}-${Date.now()}`,
    });

    res.status(202).json({
      success: true,
      message: isQueued
        ? "Dispatch queued successfully - processing in background"
        : "Dispatch creation queued - processing in background",
      jobId: job.id,
      queueStatus: {
        isQueued,
        queueInfo,
      },
      estimatedProcessingTime: "Processing within 10 seconds",
    });
  })
);

// ============================================
// MANUAL DISPATCH (with Queue)
// ============================================
router.post(
  "/manual",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { wasteAnalysisId, teamId, truckId, scheduledDate, priority } = req.body;
    const adminUserId = req.user.user_id;

    if (!wasteAnalysisId || !teamId || !truckId) {
      return res.status(400).json({
        success: false,
        message: "wasteAnalysisId, teamId, and truckId are required",
      });
    }

    // Validate waste
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

    // Check truck belongs to team
    const truckBelongsToTeam = team.team_trucks.some(
      (t) => t.truck_id === truckId
    );

    if (!truckBelongsToTeam) {
      return res.status(400).json({
        success: false,
        message: "Truck does not belong to selected team",
      });
    }

    const pickupDate = scheduledDate
      ? new Date(scheduledDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Add job to queue
    const job = await dispatchQueue.add('create-manual-dispatch', {
      wasteAnalysisId,
      teamId,
      truckId,
      scheduledDate: pickupDate.toISOString(),
      priority: priority || 'normal',
      waste,
      team,
      truck,
      adminUserId,
    }, {
      priority: 1, // High priority for manual dispatch
      jobId: `manual-dispatch-${wasteAnalysisId}-${Date.now()}`,
    });

    res.status(202).json({
      success: true,
      message: "Manual dispatch creation queued - processing in background",
      jobId: job.id,
      estimatedProcessingTime: "Processing within 10 seconds",
    });
  })
);

// ============================================
// UPDATE DISPATCH STATUS (with Queue)
// ============================================
router.patch(
  "/:id/status",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { status, collectionNotes } = req.body;
    const userId = req.user.user_id;
    const { id } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Verify dispatch exists
    const dispatch = await prisma.dispatch.findUnique({
      where: { dispatch_id: id },
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    // Add job to queue
    const job = await dispatchQueue.add('update-dispatch-status', {
      dispatchId: id,
      status,
      collectionNotes,
      userId,
    }, {
      priority: status === 'collected' || status === 'completed' ? 1 : 3,
      jobId: `update-dispatch-${id}-${Date.now()}`,
    });

    res.status(202).json({
      success: true,
      message: "Status update queued - processing in background",
      jobId: job.id,
      oldStatus: dispatch.dispatch_status,
      newStatus: status,
    });
  })
);

// ============================================
// DELETE DISPATCH (with Queue)
// ============================================
router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.user.user_id;

    // Verify dispatch exists
    const dispatch = await prisma.dispatch.findUnique({
      where: { dispatch_id: id },
    });

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    // Add job to queue
    const job = await dispatchQueue.add('cancel-dispatch', {
      dispatchId: id,
      adminUserId,
    }, {
      priority: 2,
      jobId: `cancel-dispatch-${id}-${Date.now()}`,
    });

    res.status(202).json({
      success: true,
      message: "Dispatch cancellation queued - processing in background",
      jobId: job.id,
    });
  })
);

// ============================================
// GET JOB STATUS
// ============================================
router.get(
  "/job/:jobId",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const job = await dispatchQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnvalue = job.returnvalue;
    const failedReason = job.failedReason;

    res.json({
      success: true,
      job: {
        id: job.id,
        name: job.name,
        state,
        progress,
        result: returnvalue,
        error: failedReason,
        attemptsMade: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
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

      let nextAvailableTime = null;
      let nextAvailableTruck = null;

      busyTrucks.forEach((truck) => {
        if (truck.truck_dispatches.length > 0) {
          const dispatch = truck.truck_dispatches[0];
          const estimatedFree = new Date(dispatch.dispatch_estimatedArrival);
          estimatedFree.setHours(estimatedFree.getHours() + 2);

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
router.get(
  "/dispatchable-waste",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [wasteReports, total] = await Promise.all([
      prisma.wasteAnalysis.findMany({
        where: {
          waste_containsWaste: true,
          waste_status: "pending_dispatch",
          waste_dispatch: null,
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

    const enrichedQueue = await Promise.all(
      queuedDispatches.map(async (dispatch, index) => {
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

    const imageUrls = [];
    for (const file of req.files) {
      try {
        const imageURL = await uploadToCloudinary(file, "dispatch-collections");
        imageUrls.push(imageURL);
      } catch (error) {
        console.error("Image upload error:", error);
      }
    }

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

export { router as dispatchRoutes };