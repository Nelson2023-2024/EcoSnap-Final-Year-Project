// ============================================
// DISPATCH ROUTES - Complete CRUD with Auto-Assignment
// routes/dispatch.routes.js
// ============================================
import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { Dispatch } from "../models/Dispatch.model.js";
import { wasteAnalysis } from "../models/wasteAnalysis.model.js";
import { Team } from "../models/Team.model.js";
import { Truck } from "../models/Truck.model.js";
import { User } from "../models/User.model.js";
import { Notification } from "../models/Notification.model.js";

const router = Router();

// ============================================
// HELPER: Auto-assign team and truck
// ============================================
const autoAssignResources = async (wasteDoc) => {
  // Determine required truck type based on dominant waste type
  let requiredTruckType = "general";
  
  if (wasteDoc.dominantWasteType) {
    const typeMap = {
      PET_plastic: "recyclables",
      HDPE_plastic: "recyclables",
      glass: "recyclables",
      "e-waste": "e-waste",
      textiles: "general",
      organic: "organic",
      metal: "recyclables",
      paper_cardboard: "recyclables",
      hazardous: "hazardous",
      mixed: "general",
    };
    requiredTruckType = typeMap[wasteDoc.dominantWasteType] || "general";
  }

  // Find available team with matching specialization
  const availableTeam = await Team.findOne({
    specialization: requiredTruckType,
    status: "active",
    members: { $exists: true, $ne: [] }, // Has members
  }).populate("trucks members");

  if (!availableTeam) {
    // Fallback to general team
    const generalTeam = await Team.findOne({
      specialization: "general",
      status: "active",
      members: { $exists: true, $ne: [] },
    }).populate("trucks members");
    
    if (!generalTeam) {
      throw new Error("No available teams found");
    }
    
    return {
      team: generalTeam,
      truck: generalTeam.trucks.find(t => t.status === "available"),
      truckType: "general",
    };
  }

  // Find available truck from team's trucks
  const availableTruck = availableTeam.trucks.find(
    (truck) => truck.status === "available"
  );

  if (!availableTruck) {
    // Try to find any available truck of required type
    const anyTruck = await Truck.findOne({
      truckType: requiredTruckType,
      status: "available",
    });

    return {
      team: availableTeam,
      truck: anyTruck,
      truckType: requiredTruckType,
    };
  }

  return {
    team: availableTeam,
    truck: availableTruck,
    truckType: requiredTruckType,
  };
};

// ============================================
// HELPER: Calculate priority
// ============================================
const calculatePriority = (wasteDoc) => {
  // Urgent: hazardous or e-waste
  if (wasteDoc.dominantWasteType === "hazardous" || 
      wasteDoc.dominantWasteType === "e-waste") {
    return "urgent";
  }

  // High: large volume
  if (wasteDoc.estimatedVolume?.value > 50) {
    return "high";
  }

  // Medium: default
  return "medium";
};

// ============================================
// CREATE DISPATCH (Auto or Manual)
// ============================================
/**
 * POST /api/dispatch
 * Create dispatch assignment (Admin only)
 */
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const {
      wasteAnalysisId,
      assignedTeam,
      assignedTruck,
      scheduledDate,
      priority,
      autoAssign = false,
    } = req.body;

    // Validate waste analysis exists
    const wasteDoc = await wasteAnalysis.findById(wasteAnalysisId);
    if (!wasteDoc) {
      return res.status(404).json({
        success: false,
        message: "Waste analysis not found",
      });
    }

    // Check if already dispatched
    const existingDispatch = await Dispatch.findOne({ wasteAnalysisId });
    if (existingDispatch) {
      return res.status(400).json({
        success: false,
        message: "Dispatch already exists for this waste analysis",
      });
    }

    let team, truck, truckType, calculatedPriority;

    // Auto-assign or manual assign
    if (autoAssign) {
      try {
        const resources = await autoAssignResources(wasteDoc);
        team = resources.team;
        truck = resources.truck;
        truckType = resources.truckType;
        calculatedPriority = calculatePriority(wasteDoc);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    } else {
      // Manual assignment
      if (!assignedTeam || !assignedTruck) {
        return res.status(400).json({
          success: false,
          message: "Team and truck are required for manual assignment",
        });
      }

      team = await Team.findById(assignedTeam);
      truck = await Truck.findById(assignedTruck);

      if (!team || !truck) {
        return res.status(404).json({
          success: false,
          message: "Team or truck not found",
        });
      }

      truckType = truck.truckType;
      calculatedPriority = priority || calculatePriority(wasteDoc);
    }

    // Validate truck availability
    if (truck && truck.status !== "available") {
      return res.status(400).json({
        success: false,
        message: `Truck ${truck.registrationNumber} is not available`,
      });
    }

    // Create dispatch
    const dispatch = await Dispatch.create({
      wasteAnalysisId,
      reportedBy: wasteDoc.analysedBy,
      assignedTeam: team._id,
      assignedTruck: truck?._id,
      truckType,
      status: "assigned",
      priority: calculatedPriority,
      location: wasteDoc.location,
      scheduledDate: scheduledDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default: tomorrow
      assignedAt: new Date(),
    });

    // Update truck status
    if (truck) {
      truck.status = "in_use";
      await truck.save();
    }

    // Update waste analysis status
    wasteDoc.status = "dispatched";
    await wasteDoc.save();

    // Notify all team members
    for (const memberId of team.members) {
      await Notification.create({
        user: memberId,
        type: "dispatch_assigned",
        title: "🚚 New Collection Assignment",
        message: `New ${truckType} collection at ${wasteDoc.location.address || "specified location"}. Priority: ${calculatedPriority}`,
        relatedModel: "Dispatch",
        relatedId: dispatch._id,
        priority: calculatedPriority === "urgent" ? "urgent" : "high",
      });
    }

    // Notify reporter (user who reported the waste)
    await Notification.create({
      user: wasteDoc.analysedBy,
      type: "dispatch_update",
      title: "Collection Scheduled ✅",
      message: `Your waste report has been assigned to ${team.name}. Collection scheduled for ${new Date(dispatch.scheduledDate).toLocaleDateString()}`,
      relatedModel: "Dispatch",
      relatedId: dispatch._id,
      priority: "normal",
    });

    const populatedDispatch = await Dispatch.findById(dispatch._id)
      .populate("wasteAnalysisId")
      .populate("assignedTeam", "name specialization members")
      .populate("assignedTruck", "registrationNumber truckType capacity")
      .populate("reportedBy", "fullName email phoneNumber");

    res.status(201).json({
      success: true,
      message: "Dispatch created successfully",
      data: populatedDispatch,
    });
  })
);

// ============================================
// AUTO-DISPATCH FROM WASTE ANALYSIS
// ============================================
/**
 * POST /api/dispatch/auto/:wasteAnalysisId
 * Automatically create dispatch for a waste analysis
 */
router.post(
  "/auto/:wasteAnalysisId",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { wasteAnalysisId } = req.params;

    const wasteDoc = await wasteAnalysis.findById(wasteAnalysisId);
    if (!wasteDoc) {
      return res.status(404).json({
        success: false,
        message: "Waste analysis not found",
      });
    }

    if (wasteDoc.status !== "pending_dispatch") {
      return res.status(400).json({
        success: false,
        message: "Waste analysis is not pending dispatch",
      });
    }

    // Auto-assign resources
    let resources;
    try {
      resources = await autoAssignResources(wasteDoc);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const priority = calculatePriority(wasteDoc);

    const dispatch = await Dispatch.create({
      wasteAnalysisId,
      reportedBy: wasteDoc.analysedBy,
      assignedTeam: resources.team._id,
      assignedTruck: resources.truck?._id,
      truckType: resources.truckType,
      status: "assigned",
      priority,
      location: wasteDoc.location,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      assignedAt: new Date(),
    });

    if (resources.truck) {
      resources.truck.status = "in_use";
      await resources.truck.save();
    }

    wasteDoc.status = "dispatched";
    await wasteDoc.save();

    // Notify team members
    for (const memberId of resources.team.members) {
      await Notification.create({
        user: memberId,
        type: "dispatch_assigned",
        title: "🚚 New Collection Assignment",
        message: `Auto-assigned ${resources.truckType} collection. Priority: ${priority}`,
        relatedModel: "Dispatch",
        relatedId: dispatch._id,
        priority: priority === "urgent" ? "urgent" : "high",
      });
    }

    // Notify reporter
    await Notification.create({
      user: wasteDoc.analysedBy,
      type: "dispatch_update",
      title: "Collection Scheduled ✅",
      message: `Your waste report has been processed. Team dispatched!`,
      relatedModel: "Dispatch",
      relatedId: dispatch._id,
    });

    const populatedDispatch = await Dispatch.findById(dispatch._id)
      .populate("wasteAnalysisId")
      .populate("assignedTeam")
      .populate("assignedTruck")
      .populate("reportedBy", "fullName email");

    res.status(201).json({
      success: true,
      message: "Auto-dispatch created successfully",
      data: populatedDispatch,
    });
  })
);

// ============================================
// GET ALL DISPATCHES
// ============================================
/**
 * GET /api/dispatch
 * Get all dispatches with filters
 */
router.get(
  "/",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const {
      status,
      priority,
      truckType,
      assignedTeam,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (truckType) query.truckType = truckType;
    if (assignedTeam) query.assignedTeam = assignedTeam;

    // If collector, show only their team's dispatches
    if (req.user.role === "collector" && req.user.assignedTeams?.length > 0) {
      query.assignedTeam = { $in: req.user.assignedTeams };
    }

    const dispatches = await Dispatch.find(query)
      .populate("wasteAnalysisId", "dominantWasteType estimatedVolume imageURL")
      .populate("assignedTeam", "name specialization")
      .populate("assignedTruck", "registrationNumber truckType")
      .populate("reportedBy", "fullName email phoneNumber")
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Dispatch.countDocuments(query);

    res.json({
      success: true,
      data: dispatches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  })
);

// ============================================
// GET DISPATCH BY ID
// ============================================
/**
 * GET /api/dispatch/:id
 * Get specific dispatch details
 */
router.get(
  "/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const dispatch = await Dispatch.findById(req.params.id)
      .populate("wasteAnalysisId")
      .populate("assignedTeam")
      .populate("assignedTruck")
      .populate("reportedBy", "fullName email phoneNumber");

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
/**
 * PATCH /api/dispatch/:id/status
 * Update dispatch status
 */

router.patch(
  "/:id/status",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { status, verificationPhotos, issues } = req.body;

    if (!["pending", "assigned", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const dispatch = await Dispatch.findById(req.params.id)
      .populate("assignedTeam")
      .populate("assignedTruck")
      .populate("wasteAnalysisId");

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    // Update status and timestamps
    dispatch.status = status;
    
    if (status === "in_progress" && !dispatch.dispatchedAt) {
      dispatch.dispatchedAt = new Date();
    }
    
    if (status === "completed" && !dispatch.completedAt) {
      dispatch.completedAt = new Date();
      
      // Release truck
      if (dispatch.assignedTruck) {
        const truck = await Truck.findById(dispatch.assignedTruck);
        if (truck) {
          truck.status = "available";
          await truck.save();
        }
      }

      // Update waste analysis status
      if (dispatch.wasteAnalysisId) {
        const waste = await wasteAnalysis.findById(dispatch.wasteAnalysisId);
        if (waste) {
          waste.status = "collected";
          await waste.save();
        }
      }

      // Award bonus points to reporter for successful collection
      const reportedBy = dispatch.reportedBy;
      await User.findByIdAndUpdate(reportedBy, { $inc: { points: 20 } });

      // Notify reporter of completion
      await Notification.create({
        user: reportedBy,
        type: "cleanup_verified",
        title: "Collection Completed! 🎉",
        message: "Your reported waste has been successfully collected. +20 bonus points!",
        relatedModel: "Dispatch",
        relatedId: dispatch._id,
        priority: "high",
      });
    }

    if (verificationPhotos) {
      dispatch.verificationPhotos = verificationPhotos;
    }

    if (issues) {
      dispatch.issues.push({
        description: issues,
        reportedAt: new Date(),
      });
    }

    await dispatch.save();

    // Notify team members of status change
    if (dispatch.assignedTeam?.members) {
      for (const memberId of dispatch.assignedTeam.members) {
        await Notification.create({
          user: memberId,
          type: "dispatch_update",
          title: `Dispatch ${status.replace('_', ' ').toUpperCase()}`,
          message: `Collection status updated to: ${status}`,
          relatedModel: "Dispatch",
          relatedId: dispatch._id,
        });
      }
    }

    res.json({
      success: true,
      message: "Dispatch status updated",
      data: dispatch,
    });
  })
);

// ============================================
// UPDATE DISPATCH
// ============================================
/**
 * PUT /api/dispatch/:id
 * Update dispatch details (Admin only)
 */
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const {
      assignedTeam,
      assignedTruck,
      scheduledDate,
      priority,
    } = req.body;

    const dispatch = await Dispatch.findById(req.params.id);

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    // Handle team reassignment
    if (assignedTeam && assignedTeam !== dispatch.assignedTeam?.toString()) {
      const newTeam = await Team.findById(assignedTeam);
      if (!newTeam) {
        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }

      const oldTeamId = dispatch.assignedTeam;
      dispatch.assignedTeam = assignedTeam;

      // Notify old team members
      if (oldTeamId) {
        const oldTeam = await Team.findById(oldTeamId);
        if (oldTeam) {
          for (const memberId of oldTeam.members) {
            await Notification.create({
              user: memberId,
              type: "dispatch_update",
              title: "Dispatch Reassigned",
              message: `Collection has been reassigned to another team`,
              relatedModel: "Dispatch",
              relatedId: dispatch._id,
            });
          }
        }
      }

      // Notify new team members
      for (const memberId of newTeam.members) {
        await Notification.create({
          user: memberId,
          type: "dispatch_assigned",
          title: "New Assignment",
          message: `You have been assigned a collection task`,
          relatedModel: "Dispatch",
          relatedId: dispatch._id,
          priority: "high",
        });
      }
    }

    // Handle truck reassignment
    if (assignedTruck) {
      const newTruck = await Truck.findById(assignedTruck);
      if (!newTruck) {
        return res.status(404).json({
          success: false,
          message: "Truck not found",
        });
      }

      // Release old truck
      if (dispatch.assignedTruck) {
        const oldTruck = await Truck.findById(dispatch.assignedTruck);
        if (oldTruck) {
          oldTruck.status = "available";
          await oldTruck.save();
        }
      }

      // Assign new truck
      newTruck.status = "in_use";
      await newTruck.save();
      dispatch.assignedTruck = assignedTruck;
    }

    if (scheduledDate) dispatch.scheduledDate = scheduledDate;
    if (priority) dispatch.priority = priority;

    await dispatch.save();

    const updatedDispatch = await Dispatch.findById(dispatch._id)
      .populate("wasteAnalysisId")
      .populate("assignedTeam")
      .populate("assignedTruck")
      .populate("reportedBy");

    res.json({
      success: true,
      message: "Dispatch updated successfully",
      data: updatedDispatch,
    });
  })
);

// ============================================
// DELETE DISPATCH
// ============================================
/**
 * DELETE /api/dispatch/:id
 * Delete/cancel dispatch (Admin only)
 */
router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const dispatch = await Dispatch.findById(req.params.id)
      .populate("assignedTeam")
      .populate("assignedTruck")
      .populate("wasteAnalysisId");

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    // Release truck if assigned
    if (dispatch.assignedTruck) {
      const truck = await Truck.findById(dispatch.assignedTruck);
      if (truck) {
        truck.status = "available";
        await truck.save();
      }
    }

    // Reset waste analysis status
    if (dispatch.wasteAnalysisId) {
      const waste = await wasteAnalysis.findById(dispatch.wasteAnalysisId);
      if (waste) {
        waste.status = "pending_dispatch";
        await waste.save();
      }
    }

    // Notify team members
    if (dispatch.assignedTeam?.members) {
      for (const memberId of dispatch.assignedTeam.members) {
        await Notification.create({
          user: memberId,
          type: "dispatch_update",
          title: "Dispatch Cancelled",
          message: "A collection assignment has been cancelled",
          relatedModel: "Dispatch",
          relatedId: dispatch._id,
        });
      }
    }

    // Notify reporter
    await Notification.create({
      user: dispatch.reportedBy,
      type: "dispatch_update",
      title: "Collection Cancelled",
      message: "The scheduled collection has been cancelled. We'll reschedule soon.",
      relatedModel: "Dispatch",
      relatedId: dispatch._id,
      priority: "high",
    });

    await dispatch.deleteOne();

    res.json({
      success: true,
      message: "Dispatch cancelled successfully",
    });
  })
);

// ============================================
// GET DISPATCH STATISTICS
// ============================================
/**
 * GET /api/dispatch/stats/overview
 * Get dispatch statistics (Admin only)
 */
router.get(
  "/stats/overview",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const stats = await Dispatch.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          byPriority: [
            { $group: { _id: "$priority", count: { $sum: 1 } } },
          ],
          byTruckType: [
            { $group: { _id: "$truckType", count: { $sum: 1 } } },
          ],
          total: [{ $count: "total" }],
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0],
    });
  })
);

export { router as dispatchRoutes };