import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { Team } from "../models/Team.model.js";
import { User } from "../models/User.model.js";

const router = Router();

// Create a team
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { name, specialization } = req.body;

    // Validate required fields
    if (!name || !specialization)
      return res.status(400).json({
        success: false,
        message: "Team name and specialization are required",
      });

    // Prevent duplicate team names
    const existingTeam = await Team.findOne({ team_name: name });
    if (existingTeam)
      return res.status(400).json({ message: "Team name already exists" });

    // Create the team
    const team = await Team.create({
      team_name: name,
      team_specialization: specialization,
      team_status: "active", // default
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
    const teams = await Team.find().populate(
      "team_members",
      "fullName email role"
    );

    if (teams.length === 0)
      return res.json({
        success: true,
        data: "No teams at the moment",
      });

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
    const team = await Team.findById(req.params.id).populate(
      "team_members",
      "fullName email role"
    );

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
    const { name, specialization, status } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Update fields using prefixed DB keys
    if (name) team.team_name = name;
    if (specialization) team.team_specialization = specialization;
    if (status) team.team_status = status;

    await team.save();

    res.json({
      success: true,
      message: "Team updated successfully",
      data: team,
    });
  })
);

// Delete team
router.delete(
  "/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Unassign members (their field is still normal)
    await User.updateMany(
      { assignedTeam: team._id },
      { $unset: { assignedTeam: "" } }
    );

    await team.deleteOne();

    res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  })
);

export { router as teamRoutes };
