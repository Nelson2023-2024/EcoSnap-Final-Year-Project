import { Router } from "express";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
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
    const { email, firstName, lastName, assignedTeam, password } = req.body;

    // ✅ Validate required fields
    if (!email || !firstName || !lastName || !assignedTeam || !password) {
      return res.status(400).json({
        success: false,
        message: "email, firstName, lastName, assignedTeam and password are required",
      });
    }

    // ✅ Check if collector already exists
    const existingUser = await prisma.user.findUnique({
      where: { user_email: email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Collector already exists",
      });
    }

    // ✅ Validate team
    const team = await prisma.team.findUnique({
      where: { team_id: assignedTeam },
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // ✅ Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate username and full name
    const username = `${email.split("@")[0]}_${Date.now()}`;
    const fullName = `${firstName} ${lastName}`.trim();

    // ✅ Transaction: create user + team membership
    const collector = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          user_email: email,
          user_username: username,
          user_firstName: firstName,
          user_lastName: lastName,
          user_fullName: fullName,
          user_role: "collector",
          user_password: hashedPassword, // 🔐 STORED HASHED
        },
      });

      await tx.teamMember.create({
        data: {
          userId: user.user_id,
          teamId: assignedTeam,
        },
      });

      return user;
    });

    // ✅ Fetch populated collector
    const populatedCollector = await prisma.user.findUnique({
      where: { user_id: collector.user_id },
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

    // ✅ Notify admins & collectors
    const recipients = await prisma.user.findMany({
      where: {
        user_role: { in: ["admin", "collector"] },
      },
      select: { user_id: true },
    });

    await Promise.all(
      recipients.map((user) =>
        prisma.notification.create({
          data: {
            notification_userId: user.user_id,
            notification_entityType: "user",
            notification_entityId: collector.user_id,
            notification_type: "team_update",
            notification_title: "New Collector Added 👤",
            notification_message: `${fullName} has been added as a collector and assigned to ${team.team_name}.`,
            notification_priority: "normal",
            notification_metadata: {
              userId: collector.user_id,
              collectorName: fullName,
              collectorEmail: email,
              teamId: assignedTeam,
              teamName: team.team_name,
              action: "collector_added",
            },
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      data: populatedCollector,
      notified: recipients.length,
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
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      username,
      password,
      points,
      role,
      assignedTeams,
    } = req.body;

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

    if (!collector) {
      return res.status(404).json({ message: "User not found" });
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

    // Check if username is already in use
    if (username && username !== collector.user_username) {
      const usernameTaken = await prisma.user.findUnique({
        where: { user_username: username },
      });
      if (usernameTaken) {
        return res.status(400).json({ message: "Username already in use" });
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
    if (username) updateData.user_username = username;
    if (phoneNumber !== undefined) updateData.user_phoneNumber = phoneNumber;
    if (points !== undefined) updateData.user_points = parseInt(points);
    if (role && ["user", "admin", "collector"].includes(role)) {
      updateData.user_role = role;
    }

    // Hash password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters long",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.user_password = hashedPassword;
    }

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
      const updatedUser = await tx.user.update({
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

      return updatedUser;
    });

    // Get updated user with populated teams
    const updatedUser = await prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        user_firstName: true,
        user_lastName: true,
        user_fullName: true,
        user_email: true,
        user_username: true,
        user_phoneNumber: true,
        user_profileImage: true,
        user_points: true,
        user_googleID: true,
        user_authProvider: true,
        user_role: true,
        user_createdAt: true,
        user_updatedAt: true,
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

    // Notify admins and affected user about the update
    const admins = await prisma.user.findMany({
      where: {
        user_role: "admin",
        user_id: { not: req.user.user_id }, // Exclude the admin making the change
      },
      select: { user_id: true },
    });

    // Track what changed
    const changes = [];
    if (firstName && firstName !== collector.user_firstName)
      changes.push("name");
    if (lastName && lastName !== collector.user_lastName) changes.push("name");
    if (email && email !== collector.user_email) changes.push("email");
    if (username && username !== collector.user_username)
      changes.push("username");
    if (phoneNumber && phoneNumber !== collector.user_phoneNumber)
      changes.push("phone");
    if (password) changes.push("password");
    if (points !== undefined && points !== collector.user_points)
      changes.push("points");
    if (role && role !== collector.user_role) changes.push("role");
    if (teamsChanged) changes.push("team assignment");

    if (changes.length > 0) {
      // Notify the user whose account was updated
      const userNotification = prisma.notification.create({
        data: {
          notification_userId: id,
          notification_entityType: "user",
          notification_entityId: id,
          notification_type: "system",
          notification_title: "Your Account Has Been Updated 🔄",
          notification_message: `An administrator has updated your account. Changes: ${changes.join(
            ", "
          )}.${teamsChanged ? ` New teams: ${newTeamNames.join(", ")}` : ""}`,
          notification_priority: "high",
          notification_metadata: {
            userId: id,
            updatedBy: req.user.user_id,
            updatedByName: req.user.user_fullName,
            action: "account_updated",
            changes,
            newTeams: assignedTeams || [],
          },
        },
      });

      // Notify other admins
      const adminNotifications = admins.map((admin) =>
        prisma.notification.create({
          data: {
            notification_userId: admin.user_id,
            notification_entityType: "user",
            notification_entityId: id,
            notification_type: "system",
            notification_title: "User Account Updated 🔄",
            notification_message: `${
              req.user.user_fullName
            } updated ${updatedUser.user_fullName}'s account. Changes: ${changes.join(
              ", "
            )}.${teamsChanged ? ` New teams: ${newTeamNames.join(", ")}` : ""}`,
            notification_priority: "normal",
            notification_metadata: {
              userId: id,
              userName: updatedUser.user_fullName,
              updatedBy: req.user.user_id,
              updatedByName: req.user.user_fullName,
              action: "account_updated",
              changes,
              newTeams: assignedTeams || [],
            },
          },
        })
      );

      await Promise.all([userNotification, ...adminNotifications]);
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
      notified: changes.length > 0 ? admins.length + 1 : 0,
      changes,
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