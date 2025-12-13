import { Router } from "express";
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prisma.config.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";

const router = Router();

router.use(isAuthenticated, isAdmin);

/**
 * @desc Create a new collector (Admin only)
 * @route POST /users/collectors
 * @access Private/Admin
 */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { email, firstName, lastName, assignedTeam } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !assignedTeam) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if collector already exists
    const existingUser = await prisma.user.findUnique({
      where: { user_email: email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Collector already exists" });
    }

    // Validate team
    const team = await prisma.team.findUnique({
      where: { team_id: assignedTeam },
    });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Generate username and fullName
    const username = email.split("@")[0] + "_" + Date.now();
    const fullName = `${firstName} ${lastName}`.trim();

    // Create collector with team assignment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create collector
      const collector = await tx.user.create({
        data: {
          user_email: email,
          user_username: username,
          user_firstName: firstName,
          user_lastName: lastName,
          user_fullName: fullName,
          user_role: "collector",
        },
      });

      // Create team membership
      await tx.teamMember.create({
        data: {
          userId: collector.user_id,
          teamId: assignedTeam,
        },
      });

      return collector;
    });

    // Get populated collector
    const populatedCollector = await prisma.user.findUnique({
      where: { user_id: result.user_id },
      include: {
        user_assignedTeams: {
          include: {
            team: {
              select: {
                team_id: true,
                team_name: true,
                team_specialization: true,
                team_status: true,
              },
            },
          },
        },
      },
    });

    // Get all admins and collectors for notifications
    const adminsAndCollectors = await prisma.user.findMany({
      where: {
        user_role: {
          in: ["admin", "collector"],
        },
      },
      select: { user_id: true },
    });

    // Notify all admins and collectors about new collector
    const notifications = adminsAndCollectors.map((user) =>
      prisma.notification.create({
        data: {
          notification_userId: user.user_id,
          notification_entityType: "user",
          notification_entityId: result.user_id,
          notification_type: "team_update",
          notification_title: "New Collector Added 👤",
          notification_message: `${fullName} has been added as a collector and assigned to ${team.team_name}.`,
          notification_priority: "normal",
          notification_metadata: {
            userId: result.user_id,
            collectorName: fullName,
            collectorEmail: email,
            teamId: assignedTeam,
            teamName: team.team_name,
            action: "collector_added",
          },
        },
      })
    );

    await Promise.all(notifications);

    res.status(201).json({
      success: true,
      data: populatedCollector,
      notified: adminsAndCollectors.length,
    });
  })
);

/**
 * @desc Get all users with their stats
 * @route GET /users
 * @access Private/Admin
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      include: {
        user_assignedTeams: {
          include: {
            team: {
              select: {
                team_id: true,
                team_name: true,
                team_specialization: true,
                team_status: true,
              },
            },
          },
        },
        _count: {
          select: {
            user_wasteReports: true,
          },
        },
      },
      orderBy: {
        user_createdAt: "desc",
      },
    });

    const result = users.map((user) => ({
      user_id: user.user_id,
      user_email: user.user_email,
      user_username: user.user_username,
      user_firstName: user.user_firstName,
      user_lastName: user.user_lastName,
      user_fullName: user.user_fullName,
      user_phoneNumber: user.user_phoneNumber,
      user_profileImage: user.user_profileImage,
      user_role: user.user_role,
      user_points: user.user_points,
      user_createdAt: user.user_createdAt,
      user_updatedAt: user.user_updatedAt,
      user_assignedTeams: user.user_assignedTeams.map((tm) => tm.team),
      totalReports: user._count.user_wasteReports,
      totalPoints: user.user_points,
    }));

    return res.status(200).json({ success: true, data: result });
  })
);

/**
 * @desc Get a single user with stats
 * @route GET /users/:id
 * @access Private
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { user_id: id },
      include: {
        user_assignedTeams: {
          include: {
            team: {
              select: {
                team_id: true,
                team_name: true,
                team_specialization: true,
                team_status: true,
              },
            },
          },
        },
        _count: {
          select: {
            user_wasteReports: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        user_id: user.user_id,
        user_email: user.user_email,
        user_username: user.user_username,
        user_firstName: user.user_firstName,
        user_lastName: user.user_lastName,
        user_fullName: user.user_fullName,
        user_phoneNumber: user.user_phoneNumber,
        user_profileImage: user.user_profileImage,
        user_role: user.user_role,
        user_points: user.user_points,
        user_createdAt: user.user_createdAt,
        user_updatedAt: user.user_updatedAt,
        user_assignedTeams: user.user_assignedTeams.map((tm) => tm.team),
        totalReports: user._count.user_wasteReports,
        totalPoints: user.user_points,
      },
    });
  })
);

/**
 * @desc Update a collector
 * @route PUT /users/collectors/:id
 * @access Private/Admin
 */
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, assignedTeams } = req.body;

    const collector = await prisma.user.findUnique({
      where: { user_id: id },
      include: {
        user_assignedTeams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!collector || collector.user_role !== "collector") {
      return res.status(404).json({ message: "Collector not found" });
    }

    // Check if email is already in use
    if (email && email !== collector.user_email) {
      const emailTaken = await prisma.user.findUnique({
        where: { user_email: email },
      });
      if (emailTaken) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Prepare update data
    const updateData = {};
    if (firstName) updateData.user_firstName = firstName;
    if (lastName) updateData.user_lastName = lastName;
    if (firstName || lastName) {
      updateData.user_fullName = `${firstName || collector.user_firstName} ${
        lastName || collector.user_lastName
      }`.trim();
    }
    if (email) updateData.user_email = email;
    if (phoneNumber !== undefined) updateData.user_phoneNumber = phoneNumber;

    // Handle team assignment changes
    let teamsChanged = false;
    let newTeamNames = [];

    if (assignedTeams !== undefined) {
      if (!Array.isArray(assignedTeams)) {
        return res
          .status(400)
          .json({ message: "assignedTeams must be an array" });
      }

      // Validate teams if provided
      if (assignedTeams.length > 0) {
        const validTeams = await prisma.team.findMany({
          where: { team_id: { in: assignedTeams } },
        });
        if (validTeams.length !== assignedTeams.length) {
          return res
            .status(400)
            .json({ message: "One or more team IDs are invalid" });
        }
        newTeamNames = validTeams.map((t) => t.team_name);
        teamsChanged = true;
      } else {
        teamsChanged = collector.user_assignedTeams.length > 0;
      }
    }

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user
      const updatedCollector = await tx.user.update({
        where: { user_id: id },
        data: updateData,
      });

      // Handle team reassignment
      if (assignedTeams !== undefined) {
        // Remove from all current teams
        await tx.teamMember.deleteMany({
          where: { userId: id },
        });

        // Add to new teams
        if (assignedTeams.length > 0) {
          await tx.teamMember.createMany({
            data: assignedTeams.map((teamId) => ({
              userId: id,
              teamId: teamId,
            })),
          });
        }
      }

      return updatedCollector;
    });

    // Get updated collector with populated teams
    const updatedCollector = await prisma.user.findUnique({
      where: { user_id: id },
      include: {
        user_assignedTeams: {
          include: {
            team: {
              select: {
                team_id: true,
                team_name: true,
                team_specialization: true,
                team_status: true,
              },
            },
          },
        },
      },
    });

    // Notify admins and collectors about the update
    const adminsAndCollectors = await prisma.user.findMany({
      where: {
        user_role: {
          in: ["admin", "collector"],
        },
      },
      select: { user_id: true },
    });

    const changes = [];
    if (firstName && firstName !== collector.user_firstName) changes.push("name");
    if (email && email !== collector.user_email) changes.push("email");
    if (phoneNumber && phoneNumber !== collector.user_phoneNumber)
      changes.push("phone");
    if (teamsChanged) changes.push("team assignment");

    if (changes.length > 0) {
      const notifications = adminsAndCollectors.map((user) =>
        prisma.notification.create({
          data: {
            notification_userId: user.user_id,
            notification_entityType: "user",
            notification_entityId: id,
            notification_type: "team_update",
            notification_title: "Collector Updated 🔄",
            notification_message: `${updatedCollector.user_fullName}'s profile has been updated. Changes: ${changes.join(
              ", "
            )}.${teamsChanged ? ` New teams: ${newTeamNames.join(", ")}` : ""}`,
            notification_priority: "normal",
            notification_metadata: {
              userId: id,
              collectorName: updatedCollector.user_fullName,
              action: "collector_updated",
              changes,
              newTeams: assignedTeams || [],
            },
          },
        })
      );

      await Promise.all(notifications);
    }

    res.status(200).json({
      success: true,
      data: updatedCollector,
      notified: changes.length > 0 ? adminsAndCollectors.length : 0,
    });
  })
);

/**
 * @desc Delete a collector
 * @route DELETE /users/collectors/:id
 * @access Private/Admin
 */
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { user_id: id },
      include: {
        user_assignedTeams: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userName = user.user_fullName || user.user_email;
    const teamNames = user.user_assignedTeams.map((tm) => tm.team.team_name);

    // Get admins and collectors for notification
    const adminsAndCollectors = await prisma.user.findMany({
      where: {
        user_role: {
          in: ["admin", "collector"],
        },
        user_id: {
          not: id, // Don't notify the user being deleted
        },
      },
      select: { user_id: true },
    });

    // Notify before deletion
    const notifications = adminsAndCollectors.map((notifyUser) =>
      prisma.notification.create({
        data: {
          notification_userId: notifyUser.user_id,
          notification_type: "team_update",
          notification_title: "Collector Removed ❌",
          notification_message: `${userName} has been removed from the system.${
            teamNames.length > 0
              ? ` Previously assigned to: ${teamNames.join(", ")}`
              : ""
          }`,
          notification_priority: "high",
          notification_metadata: {
            userId: id,
            userName,
            teams: teamNames,
            action: "collector_deleted",
          },
        },
      })
    );

    await Promise.all(notifications);

    // Delete user (cascade deletes TeamMember entries automatically)
    await prisma.user.delete({
      where: { user_id: id },
    });

    res.status(200).json({
      success: true,
      message: "User deleted",
      notified: adminsAndCollectors.length,
    });
  })
);

export { router as userRoutes };