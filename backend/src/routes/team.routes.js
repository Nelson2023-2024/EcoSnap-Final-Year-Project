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

    if (!name || !specialization) {
      return res.status(400).json({
        success: false,
        message: "Team name and specialization are required",
      });
    }

    // Check if team exists
    // Prevent duplicate team names
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
                user_fullName: true,
                user_email: true,
                user_role: true,
              },
            },
          },
        },
        team_trucks: true,
      },
    });

    if (teams.length === 0) {
      return res.json({
        success: true,
        data: "No teams at the moment",
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
                user_fullName: true,
                user_email: true,
                user_role: true,
              },
            },
          },
        },
        team_trucks: true,
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

    const team = await prisma.team.findUnique({ where: { team_id: id } });

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
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const team = await prisma.team.findUnique({ where: { team_id: id } });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Unassign members
    await prisma.teamMember.deleteMany({ where: { teamId: id } });

    // Delete team
    await prisma.team.delete({ where: { team_id: id } });

    res.json({
      success: true,
      message: "Team deleted successfully",
    });
  })
);

export { router as teamRoutes };
