import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { Team } from "../models/Team.model.js";
import { Truck } from "../models/Truck.model.js";
import { Notification } from "../models/Notification.model.js";
import mongoose from "mongoose";
import upload from "../middleware/upload.middleware.js";
import { uploadToCloudinary } from "../lib/upload.cloudinary.js";

const router = Router();

// Create a truck
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  upload.single("image"), // ⬅️ IMPORTANT: Accept file field "image"
  asyncHandler(async (req, res) => {
    const { registrationNumber, truckType, capacity, assignedTeam } = req.body;

    if (!registrationNumber || !truckType || !capacity)
      return res.status(400).json({
        success: false,
        message: "Registration number, truck type, and capacity are required",
      });

    // Ensure image exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Truck image is required",
      });
    }

    // Upload the image to Cloudinary
    let truck_imageURL;
    try {
      truck_imageURL = await uploadToCloudinary(req.file, "trucks");
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
        error: err.message,
      });
    }

    // Check duplicate
    const existingTruck = await Truck.findOne({
      truck_registrationNumber: registrationNumber,
    });

    if (existingTruck)
      return res.status(400).json({
        success: false,
        message: "Truck with this registration number already exists",
      });

    // Validate team
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

    // Create truck in DB
    const truck = await Truck.create({
      truck_registrationNumber: registrationNumber,
      truck_truckType: truckType,
      truck_capacity: capacity,
      truck_assignedTeam: assignedTeam || null,
      truck_imageURL,
    });

    // Assign truck to team
    if (assignedTeam && team) {
      team.team_trucks.push(truck._id);
      await team.save();

      await Notification.create({
        user: assignedTeam,
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
    const trucks = await Truck.find().populate(
      "truck_assignedTeam",
      "team_name team_status team_specialization"
    );

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

// Get one truck
router.get(
  "/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const truck = await Truck.findById(req.params.id).populate(
      "truck_assignedTeam",
      "team_name team_status team_specialization"
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

// Update truck
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

    // Apply updates
    if (registrationNumber) truck.truck_registrationNumber = registrationNumber;
    if (truckType) truck.truck_truckType = truckType;
    if (capacity) truck.truck_capacity = capacity;
    if (status) truck.truck_status = status;
    if (assignedTeam) truck.truck_assignedTeam = assignedTeam;
    if (imageURL) truck.truck_imageURL = imageURL;

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

    // Unassign from team
    if (truck.truck_assignedTeam) {
      const team = await Team.findById(truck.truck_assignedTeam);

      if (team) {
        await Team.findByIdAndUpdate(team._id, {
          $pull: { team_trucks: truck._id },
        });

        await Notification.create({
          user: truck.truck_assignedTeam,
          type: "truck_status",
          title: "Truck Unassigned ❌",
          message: `The truck ${truck.truck_registrationNumber} has been unassigned from your team.`,
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
