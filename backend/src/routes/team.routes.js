import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";

const router = Router();

// Create a team
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { name, specialization } = req.body;
    const adminUserId = req.user.user_id;

    if (!name || !specialization) {
      return res.status(400).json({
        success: false,
        message: "Team name and specialization are required",
      });
    }

    // Check if team already exists
    const existingTeam = await prisma.team.findFirst({
      where: { team_name: name },
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: "Team name already exists",
      });
    }

    // Create the team
    const team = await prisma.team.create({
      data: {
        team_name: name,
        team_specialization: specialization,
        team_status: "active",
      },
    });

    // Notify admin about team creation
    await prisma.notification.create({
      data: {
        notification_userId: adminUserId,
        notification_entityType: "team",
        notification_entityId: team.team_id,
        notification_type: "team_update",
        notification_title: "Team Created Successfully",
        notification_message: `Team "${name}" with specialization "${specialization}" has been created.`,
        notification_metadata: {
          teamId: team.team_id,
          teamName: name,
          action: "created",
          specialization,
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: team,
    });
  })
);

// Get all teams
router.get(
  "/",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const teams = await prisma.team.findMany({
      include: {
        team_members: {
          include: {
            user: {
              select: {
                user_id: true,
                user_fullName: true,
                user_email: true,
                user_role: true,
                user_phoneNumber: true,
              },
            },
          },
        },
        team_trucks: {
          select: {
            truck_id: true,
            truck_registrationNumber: true,
            truck_truckType: true,
            truck_status: true,
            truck_capacity: true,
          },
        },
        _count: {
          select: {
            team_dispatches: true,
          },
        },
      },
      orderBy: {
        team_createdAt: "desc",
      },
    });

    if (teams.length === 0) {
      return res.json({
        success: true,
        message: "No teams at the moment",
        data: [],
      });
    }

    res.json({
      success: true,
      data: teams,
      results: teams.length,
    });
  })
);

// Get a specific team
router.get(
  "/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { team_id: id },
      include: {
        team_members: {
          include: {
            user: {
              select: {
                user_id: true,
                user_fullName: true,
                user_email: true,
                user_role: true,
                user_phoneNumber: true,
                user_profileImage: true,
              },
            },
          },
        },
        team_trucks: {
          select: {
            truck_id: true,
            truck_registrationNumber: true,
            truck_truckType: true,
            truck_status: true,
            truck_capacity: true,
            truck_imageURL: true,
          },
        },
        team_dispatches: {
          take: 10,
          orderBy: {
            dispatch_createdAt: "desc",
          },
          select: {
            dispatch_id: true,
            dispatch_status: true,
            dispatch_scheduledDate: true,
            dispatch_priority: true,
          },
        },
        _count: {
          select: {
            team_dispatches: true,
            team_members: true,
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

    res.json({
      success: true,
      data: team,
    });
  })
);

// Update team details
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, specialization, status } = req.body;
    const adminUserId = req.user.user_id;

    const team = await prisma.team.findUnique({
      where: { team_id: id },
      include: {
        team_members: {
          select: {
            userId: true,
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

    const updatedTeam = await prisma.team.update({
      where: { team_id: id },
      data: {
        team_name: name || team.team_name,
        team_specialization: specialization || team.team_specialization,
        team_status: status || team.team_status,
      },
    });

    // Prepare notification metadata
    const changes = [];
    if (name && name !== team.team_name) changes.push(`name to "${name}"`);
    if (specialization && specialization !== team.team_specialization)
      changes.push(`specialization to "${specialization}"`);
    if (status && status !== team.team_status) changes.push(`status to "${status}"`);

    const changeMessage =
      changes.length > 0
        ? `Team updated: ${changes.join(", ")}`
        : "Team details updated";

    // Notify admin
    await prisma.notification.create({
      data: {
        notification_userId: adminUserId,
        notification_entityType: "team",
        notification_entityId: updatedTeam.team_id,
        notification_type: "team_update",
        notification_title: "Team Updated",
        notification_message: `${updatedTeam.team_name}: ${changeMessage}`,
        notification_metadata: {
          teamId: updatedTeam.team_id,
          teamName: updatedTeam.team_name,
          action: "updated",
          changes: {
            name: name !== team.team_name ? name : undefined,
            specialization:
              specialization !== team.team_specialization
                ? specialization
                : undefined,
            status: status !== team.team_status ? status : undefined,
          },
        },
      },
    });

    // Notify all team members about the update
    const memberNotifications = team.team_members.map((member) =>
      prisma.notification.create({
        data: {
          notification_userId: member.userId,
          notification_entityType: "team",
          notification_entityId: updatedTeam.team_id,
          notification_type: "team_update",
          notification_title: "Your Team Was Updated",
          notification_message: `${updatedTeam.team_name}: ${changeMessage}`,
          notification_metadata: {
            teamId: updatedTeam.team_id,
            teamName: updatedTeam.team_name,
            action: "updated",
          },
        },
      })
    );

    await Promise.all(memberNotifications);

    res.json({
      success: true,
      message: "Team updated successfully",
      data: updatedTeam,
    });
  })
);

// Delete team
router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.user.user_id;

    const team = await prisma.team.findUnique({
      where: { team_id: id },
      include: {
        team_members: {
          select: {
            userId: true,
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

    const teamName = team.team_name;
    const memberIds = team.team_members.map((m) => m.userId);

    // Notify all team members before deletion
    const memberNotifications = memberIds.map((userId) =>
      prisma.notification.create({
        data: {
          notification_userId: userId,
          notification_entityType: "team",
          notification_entityId: id,
          notification_type: "team_update",
          notification_title: "Team Disbanded",
          notification_message: `Your team "${teamName}" has been disbanded. You are no longer assigned to this team.`,
          notification_priority: "high",
          notification_metadata: {
            teamId: id,
            teamName,
            action: "disbanded",
          },
        },
      })
    );

    await Promise.all(memberNotifications);

    // Delete team members (cascade will handle this, but explicit for clarity)
    await prisma.teamMember.deleteMany({ where: { teamId: id } });

    // Delete team
    await prisma.team.delete({ where: { team_id: id } });

    // Notify admin
    await prisma.notification.create({
      data: {
        notification_userId: adminUserId,
        notification_entityType: "team",
        notification_entityId: id,
        notification_type: "team_update",
        notification_title: "Team Deleted",
        notification_message: `Team "${teamName}" has been successfully deleted.`,
        notification_metadata: {
          teamId: id,
          teamName,
          action: "deleted",
          memberCount: memberIds.length,
        },
      },
    });

    res.json({
      success: true,
      message: "Team deleted successfully",
      data: {
        teamName,
        membersNotified: memberIds.length,
      },
    });
  })
);

export { router as teamRoutes };