import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { Dispatch } from "../models/Dispatch.model.js";
import { wasteAnalysis } from "../models/wasteAnalysis.model.js";
import { Team } from "../models/Team.model.js";
import { Truck } from "../models/Truck.model.js";
import { User } from "../models/User.model.js";
import { Notification } from "../models/Notification.model.js";
import mongoose from "mongoose";

const router = Router();

// ============================================
// AUTOMATIC DISPATCH
// ============================================
// Automatically assigns best available team/truck based on:
// - Waste type (matches team specialization)
// - Team availability (status: active)
// - Truck availability (status: available)
router.post(
  "/auto/:wasteAnalysisId",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { wasteAnalysisId } = req.params;

    // Validate waste analysis exists
    const waste = await wasteAnalysis.findById(wasteAnalysisId);
    if (!waste) {
      return res.status(404).json({
        success: false,
        message: "Waste analysis not found",
      });
    }

    // Check if already dispatched
    if (waste.waste_status !== "pending_dispatch") {
      return res.status(400).json({
        success: false,
        message: `Waste already ${waste.waste_status}`,
      });
    }

    // Determine waste specialization
    const wasteTypeMapping = {
      "PET plastic": "recyclables",
      "HDPE plastic": "recyclables",
      "Glass": "recyclables",
      "E-waste": "e-waste",
      "Battery": "e-waste",
      "Electronics": "e-waste",
      "Organic": "organic",
      "Food waste": "organic",
      "Hazardous": "hazardous",
      "Chemical": "hazardous",
    };

    let requiredSpecialization = "general";
    const dominantType = waste.waste_dominantWasteType || "";

    // Match dominant waste type to specialization
    for (const [key, spec] of Object.entries(wasteTypeMapping)) {
      if (dominantType.toLowerCase().includes(key.toLowerCase())) {
        requiredSpecialization = spec;
        break;
      }
    }

    // Find available team with matching specialization
    let team = await Team.findOne({
      team_specialization: requiredSpecialization,
      team_status: "active",
    }).populate("team_trucks");

    // Fallback to general team if no specialized team found
    if (!team) {
      team = await Team.findOne({
        team_specialization: "general",
        team_status: "active",
      }).populate("team_trucks");
    }

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "No available teams found",
      });
    }

    // Find available truck from team
    const availableTruck = await Truck.findOne({
      _id: { $in: team.team_trucks },
      truck_status: "available",
    });

    if (!availableTruck) {
      return res.status(404).json({
        success: false,
        message: "No available trucks found for this team",
      });
    }

    // Calculate scheduled date (24-48 hours from now)
    const scheduledDate = new Date();
    scheduledDate.setHours(scheduledDate.getHours() + 24);

    const estimatedArrival = new Date(scheduledDate);
    estimatedArrival.setHours(estimatedArrival.getHours() + 2);

    // Create dispatch
    const dispatch = await Dispatch.create({
      dispatch_wasteAnalysis: waste._id,
      dispatch_assignedTeam: team._id,
      dispatch_assignedTruck: availableTruck._id,
      dispatch_pickupLocation: {
        type: "Point",
        coordinates: waste.waste_location.waste_coordinates,
        address: waste.waste_location.waste_address,
      },
      dispatch_status: "assigned",
      dispatch_scheduledDate: scheduledDate,
      dispatch_estimatedArrival: estimatedArrival,
      dispatch_priority: "normal",
    });

    // Update waste status
    waste.waste_status = "dispatched";
    await waste.save();

    // Update truck status
    availableTruck.truck_status = "in_use";
    await availableTruck.save();

    // Notify user who reported the waste
    await Notification.create({
      user: waste.waste_analysedBy,
      type: "dispatch_assigned",
      title: "Pickup Scheduled! 🚚",
      message: `Your waste report has been assigned. Expected pickup: ${scheduledDate.toLocaleDateString()}`,
      relatedModel: "Dispatch",
      relatedId: dispatch._id,
      metadata: { dispatchId: dispatch._id },
    });

    // Notify team members
    const teamMembers = await User.find({ assignedTeams: team._id });
    for (const member of teamMembers) {
      await Notification.create({
        user: member._id,
        type: "dispatch_assigned",
        title: "New Pickup Assignment 📋",
        message: `New ${requiredSpecialization} waste pickup at ${waste.waste_location.waste_address}`,
        relatedModel: "Dispatch",
        relatedId: dispatch._id,
        priority: "high",
      });
    }

    res.status(201).json({
      success: true,
      message: "Dispatch created automatically",
      data: dispatch,
    });
  })
);

// ============================================
// MANUAL DISPATCH
// ============================================
// Admin manually assigns specific team and truck
router.post(
  "/manual",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { wasteAnalysisId, teamId, truckId, scheduledDate, priority } =
      req.body;

    // Validate required fields
    if (!wasteAnalysisId || !teamId || !truckId) {
      return res.status(400).json({
        success: false,
        message: "wasteAnalysisId, teamId, and truckId are required",
      });
    }

    // Validate waste analysis
    const waste = await wasteAnalysis.findById(wasteAnalysisId);
    if (!waste) {
      return res.status(404).json({
        success: false,
        message: "Waste analysis not found",
      });
    }

    if (waste.waste_status !== "pending_dispatch") {
      return res.status(400).json({
        success: false,
        message: `Waste already ${waste.waste_status}`,
      });
    }

    // Validate team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Validate truck
    const truck = await Truck.findById(truckId);
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: "Truck not found",
      });
    }

    // Check if truck belongs to team
    if (!team.team_trucks.includes(truck._id)) {
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
    const dispatch = await Dispatch.create({
      dispatch_wasteAnalysis: waste._id,
      dispatch_assignedTeam: team._id,
      dispatch_assignedTruck: truck._id,
      dispatch_pickupLocation: {
        type: "Point",
        coordinates: waste.waste_location.waste_coordinates,
        address: waste.waste_location.waste_address,
      },
      dispatch_status: "assigned",
      dispatch_scheduledDate: pickupDate,
      dispatch_estimatedArrival: estimatedArrival,
      dispatch_priority: priority || "normal",
    });

    // Update waste status
    waste.waste_status = "dispatched";
    await waste.save();

    // Update truck status
    truck.truck_status = "in_use";
    await truck.save();

    // Notify user
    await Notification.create({
      user: waste.waste_analysedBy,
      type: "dispatch_assigned",
      title: "Pickup Scheduled! 🚚",
      message: `Your waste report has been assigned. Expected pickup: ${pickupDate.toLocaleDateString()}`,
      relatedModel: "Dispatch",
      relatedId: dispatch._id,
      metadata: { dispatchId: dispatch._id },
    });

    // Notify team members
    const teamMembers = await User.find({ assignedTeams: team._id });
    for (const member of teamMembers) {
      await Notification.create({
        user: member._id,
        type: "dispatch_assigned",
        title: "New Pickup Assignment 📋",
        message: `Manual assignment: Pickup at ${waste.waste_location.waste_address}`,
        relatedModel: "Dispatch",
        relatedId: dispatch._id,
        priority: "high",
      });
    }

    res.status(201).json({
      success: true,
      message: "Dispatch created manually",
      data: dispatch,
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
    const { status, teamId, priority } = req.query;

    const filter = {};
    if (status) filter.dispatch_status = status;
    if (teamId) filter.dispatch_assignedTeam = teamId;
    if (priority) filter.dispatch_priority = priority;

    const dispatches = await Dispatch.find(filter)
      .populate("dispatch_wasteAnalysis")
      .populate("dispatch_assignedTeam", "team_name team_specialization")
      .populate("dispatch_assignedTruck", "truck_registrationNumber")
      .sort({ dispatch_createdAt: -1 });

    res.json({
      success: true,
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
    const dispatch = await Dispatch.findById(req.params.id)
      .populate("dispatch_wasteAnalysis")
      .populate("dispatch_assignedTeam")
      .populate("dispatch_assignedTruck");

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

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    const oldStatus = dispatch.dispatch_status;
    dispatch.dispatch_status = status;

    if (collectionNotes) {
      dispatch.dispatch_collectionNotes = collectionNotes;
    }

    // Handle completion
    if (status === "collected" || status === "completed") {
      dispatch.dispatch_actualCollectionDate = new Date();
      dispatch.dispatch_collectionVerified = true;

      // Award points
      const pointsToAward = 50;
      dispatch.dispatch_pointsAwarded = pointsToAward;

      const waste = await wasteAnalysis.findById(
        dispatch.dispatch_wasteAnalysis
      );
      if (waste) {
        waste.waste_status = "collected";
        await waste.save();

        // Award user
        await User.findByIdAndUpdate(waste.waste_analysedBy, {
          $inc: { points: pointsToAward },
        });

        // Notify user
        await Notification.create({
          user: waste.waste_analysedBy,
          type: "dispatch_completed",
          title: "Waste Collected! ✅",
          message: `Your reported waste has been collected. You earned ${pointsToAward} points!`,
          relatedModel: "Dispatch",
          relatedId: dispatch._id,
        });
      }

      // Free up truck
      const truck = await Truck.findById(dispatch.dispatch_assignedTruck);
      if (truck) {
        truck.truck_status = "available";
        await truck.save();
      }
    }

    await dispatch.save();

    res.json({
      success: true,
      message: `Dispatch status updated from ${oldStatus} to ${status}`,
      data: dispatch,
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
    const dispatch = await Dispatch.findById(req.params.id);

    if (!dispatch) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found",
      });
    }

    // Free up resources
    const waste = await wasteAnalysis.findById(dispatch.dispatch_wasteAnalysis);
    if (waste && waste.waste_status === "dispatched") {
      waste.waste_status = "pending_dispatch";
      await waste.save();
    }

    const truck = await Truck.findById(dispatch.dispatch_assignedTruck);
    if (truck && truck.truck_status === "in_use") {
      truck.truck_status = "available";
      await truck.save();
    }

    await dispatch.deleteOne();

    res.json({
      success: true,
      message: "Dispatch cancelled and deleted",
    });
  })
);

export { router as dispatchRoutes };