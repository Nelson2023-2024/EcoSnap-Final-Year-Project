import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { Team } from "../models/Team.model.js";
import { User } from "../models/User.model.js";
import { Truck } from "../models/Truck.model.js";
import { Notification } from "../models/Notification.model.js";
import mongoose from "mongoose";

const router = Router();

// Create a truck
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { registrationNumber, truckType, capacity, assignedTeam, imageURL } =
      req.body;

    // Validate required fields
    if (!registrationNumber || !truckType || !capacity)
      return res.status(400).json({
        success: false,
        message: "Registration number, truck type, and capacity are required",
      });

    // Prevent duplicate truck registration number
    const existingTruck = await Truck.findOne({ registrationNumber });
    if (existingTruck)
      return res.status(400).json({
        success: false,
        message: "Truck with this registration number already exists",
      });

    // Validate team if provided
    let team = null;
    if (assignedTeam) {
      team = await Team.findById(assignedTeam);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }
    }

    // Create truck
    const truck = await Truck.create({
      registrationNumber,
      truckType,
      capacity,
      assignedTeam,
      imageURL, // storing the image URL for the truck
    });

    // If truck assigned to a team, notify the team and update members
    if (assignedTeam && team) {
      team.trucks.push(truck._id);
      await team.save();

      // Notify team about truck assignment
      await Notification.create({
        user: assignedTeam, // Assuming the team admin is notified
        type: "truck_status",
        title: "New Truck Assigned 🚚",
        message: `The truck with registration number ${registrationNumber} has been assigned to your team.`,
        relatedModel: "Truck",
        relatedId: truck._id,
        priority: "high",
      });
    }

    res.status(201).json({
      success: true,
      message: "Truck created successfully",
      data: truck,
    });
  })
);

// Get all trucks
router.get(
  "/",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const trucks = await Truck.find().populate("assignedTeam", "name");

    if (trucks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No trucks found",
      });
    }

    res.json({
      success: true,
      results: trucks.length,
      data: trucks,
    });
  })
);

// Get specific truck by ID
router.get(
  "/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const truck = await Truck.findById(req.params.id).populate(
      "assignedTeam",
      "name"
    );

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: "Truck not found",
      });
    }

    res.json({
      success: true,
      data: truck,
    });
  })
);

// Update truck details
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const {
      registrationNumber,
      truckType,
      capacity,
      status,
      assignedTeam,
      imageURL,
    } = req.body;

    const { id } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({
        success: false,
        message: "Invalid truck ID format",
      });

    const truck = await Truck.findById(id);

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: "Truck not found",
      });
    }

    // Update truck details
    if (registrationNumber) truck.registrationNumber = registrationNumber;
    if (truckType) truck.truckType = truckType;
    if (capacity) truck.capacity = capacity;
    if (status) truck.status = status;
    if (assignedTeam) truck.assignedTeam = assignedTeam;
    if (imageURL) truck.imageURL = imageURL;

    await truck.save();

    res.json({
      success: true,
      message: "Truck updated successfully",
      data: truck,
    });
  })
);

// Delete truck
router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({
        success: false,
        message: "Invalid truck ID format",
      });

    const truck = await Truck.findById(id);

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: "Truck not found",
      });
    }

    // ✅ If truck is assigned to a team, unassign it safely using $pull
    if (truck.assignedTeam) {
      const team = await Team.findById(truck.assignedTeam);

      if (team) {
        await Team.findByIdAndUpdate(team._id, {
          $pull: { trucks: truck._id }, // removes truck ID from team's array
        });

        // Optionally, send a notification to the team
        await Notification.create({
          user: truck.assignedTeam,
          type: "truck_status",
          title: "Truck Unassigned ❌",
          message: `The truck ${truck.registrationNumber} has been unassigned from your team.`,
          relatedModel: "Truck",
          relatedId: truck._id,
        });
      }
    }

    await truck.deleteOne();

    res.json({
      success: true,
      message: "Truck deleted successfully",
    });
  })
);
export { router as truckRoutes };
