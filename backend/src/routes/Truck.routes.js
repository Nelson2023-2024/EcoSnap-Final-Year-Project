import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";
import upload from "../middleware/upload.middleware.js";
import { uploadToCloudinary } from "../lib/upload.cloudinary.js";

const router = Router();

// Create a truck
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  upload.single("image"),
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
    const existingTruck = await prisma.truck.findUnique({
      where: { truck_registrationNumber: registrationNumber },
    });

    if (existingTruck)
      return res.status(400).json({
        success: false,
        message: "Truck with this registration number already exists",
      });

    // Validate team if provided
    let team = null;
    if (assignedTeam) {
      team = await prisma.team.findUnique({
        where: { team_id: assignedTeam },
      });
      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }
    }

    // Create truck in DB
    const truck = await prisma.truck.create({
      data: {
        truck_registrationNumber: registrationNumber,
        truck_truckType: truckType,
        truck_capacity: parseFloat(capacity),
        truck_assignedTeamId: assignedTeam || null,
        truck_imageURL,
      },
      include: {
        truck_assignedTeam: true,
      },
    });

    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: { user_role: "admin" },
      select: { user_id: true },
    });

    // Notify all admins about new truck
    const adminNotifications = adminUsers.map((admin) =>
      prisma.notification.create({
        data: {
          notification_userId: admin.user_id,
          notification_entityType: "truck",
          notification_entityId: truck.truck_id,
          notification_type: "truck_status",
          notification_title: "New Truck Added 🚚",
          notification_message: `Truck ${registrationNumber} (${truckType}) has been added to the fleet.${
            team ? ` Assigned to team: ${team.team_name}` : ""
          }`,
          notification_priority: "normal",
          notification_metadata: {
            truckId: truck.truck_id,
            registrationNumber,
            truckType,
            teamId: assignedTeam || null,
            teamName: team?.team_name || null,
            action: "created",
          },
        },
      })
    );

    await Promise.all(adminNotifications);

    res.status(201).json({
      success: true,
      message: "Truck created successfully",
      data: truck,
      adminsNotified: adminUsers.length,
    });
  })
);

// Get all trucks
router.get(
  "/",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const trucks = await prisma.truck.findMany({
      include: {
        truck_assignedTeam: {
          select: {
            team_id: true,
            team_name: true,
            team_status: true,
            team_specialization: true,
          },
        },
      },
      orderBy: { truck_createdAt: "desc" },
    });

    if (trucks.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No trucks found",
        data: [],
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
    const truck = await prisma.truck.findUnique({
      where: { truck_id: req.params.id },
      include: {
        truck_assignedTeam: {
          select: {
            team_id: true,
            team_name: true,
            team_status: true,
            team_specialization: true,
          },
        },
      },
    });

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
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const {
      registrationNumber,
      truckType,
      capacity,
      status,
      assignedTeam,
    } = req.body;

    const { id } = req.params;

    const truck = await prisma.truck.findUnique({
      where: { truck_id: id },
      include: {
        truck_assignedTeam: true,
      },
    });

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: "Truck not found",
      });
    }

    // Prepare update data
    const updateData = {};
    if (registrationNumber)
      updateData.truck_registrationNumber = registrationNumber;
    if (truckType) updateData.truck_truckType = truckType;
    if (capacity) updateData.truck_capacity = parseFloat(capacity);
    if (status) updateData.truck_status = status;
    if (assignedTeam !== undefined)
      updateData.truck_assignedTeamId = assignedTeam || null;

    // Update image if new one is uploaded
    if (req.file) {
      try {
        const imageURL = await uploadToCloudinary(req.file, "trucks");
        updateData.truck_imageURL = imageURL;
      } catch (err) {
        console.error("Cloudinary Upload Error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image",
          error: err.message,
        });
      }
    }

    const updatedTruck = await prisma.truck.update({
      where: { truck_id: id },
      data: updateData,
      include: {
        truck_assignedTeam: true,
      },
    });

    // Track changes for notification
    const changes = [];
    if (registrationNumber && registrationNumber !== truck.truck_registrationNumber)
      changes.push("registration number");
    if (truckType && truckType !== truck.truck_truckType) changes.push("type");
    if (status && status !== truck.truck_status) changes.push("status");
    if (
      assignedTeam !== undefined &&
      assignedTeam !== truck.truck_assignedTeamId
    )
      changes.push("team assignment");
    if (req.file) changes.push("image");

    // Notify admins if there are changes
    if (changes.length > 0) {
      const adminUsers = await prisma.user.findMany({
        where: { user_role: "admin" },
        select: { user_id: true },
      });

      const adminNotifications = adminUsers.map((admin) =>
        prisma.notification.create({
          data: {
            notification_userId: admin.user_id,
            notification_entityType: "truck",
            notification_entityId: updatedTruck.truck_id,
            notification_type: "truck_status",
            notification_title: "Truck Updated 🔄",
            notification_message: `Truck ${updatedTruck.truck_registrationNumber} has been updated. Changes: ${changes.join(
              ", "
            )}.`,
            notification_priority: "normal",
            notification_metadata: {
              truckId: updatedTruck.truck_id,
              registrationNumber: updatedTruck.truck_registrationNumber,
              action: "updated",
              changes,
              teamId: updatedTruck.truck_assignedTeamId,
              teamName: updatedTruck.truck_assignedTeam?.team_name || null,
            },
          },
        })
      );

      await Promise.all(adminNotifications);
    }

    res.json({
      success: true,
      message: "Truck updated successfully",
      data: updatedTruck,
      adminsNotified: changes.length > 0 ? (await prisma.user.count({ where: { user_role: "admin" } })) : 0,
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

    const truck = await prisma.truck.findUnique({
      where: { truck_id: id },
      include: {
        truck_assignedTeam: true,
      },
    });

    if (!truck) {
      return res.status(404).json({
        success: false,
        message: "Truck not found",
      });
    }

    const truckInfo = {
      registrationNumber: truck.truck_registrationNumber,
      teamName: truck.truck_assignedTeam?.team_name || "Unassigned",
    };

    // Delete truck (Prisma handles relationships automatically)
    await prisma.truck.delete({
      where: { truck_id: id },
    });

    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: { user_role: "admin" },
      select: { user_id: true },
    });

    // Notify all admins about truck deletion
    const adminNotifications = adminUsers.map((admin) =>
      prisma.notification.create({
        data: {
          notification_userId: admin.user_id,
          notification_type: "truck_status",
          notification_title: "Truck Deleted ❌",
          notification_message: `Truck ${truckInfo.registrationNumber} has been removed from the fleet. Previously assigned to: ${truckInfo.teamName}.`,
          notification_priority: "high",
          notification_metadata: {
            truckId: id,
            registrationNumber: truckInfo.registrationNumber,
            teamName: truckInfo.teamName,
            action: "deleted",
          },
        },
      })
    );

    await Promise.all(adminNotifications);

    res.json({
      success: true,
      message: "Truck deleted successfully",
      adminsNotified: adminUsers.length,
    });
  })
);

export { router as truckRoutes };