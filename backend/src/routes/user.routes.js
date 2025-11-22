import { Router } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { Team } from "../models/Team.model.js";
import { User } from "../models/user.model.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { wasteAnalysis } from "../models/wasteAnalysis.model.js";

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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Collector already exists" });
    }

    // Validate team ID
    if (!mongoose.Types.ObjectId.isValid(assignedTeam)) {
      return res.status(400).json({ message: "Invalid team ID" });
    }

    const team = await Team.findById(assignedTeam);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Generate username and fullName
    const username = email.split("@")[0] + "_" + Date.now();
    const fullName = `${firstName} ${lastName}`.trim();

    // Create collector with single team
    const collector = await User.create({
      email,
      firstName,
      lastName,
      fullName,
      username,
      role: "collector",
      assignedTeams: [assignedTeam],
    });

    // Add collector to the team
    await Team.findByIdAndUpdate(assignedTeam, {
      $addToSet: { team_members: collector._id },
    });

    // Get populated collector
    const populatedCollector = await User.findById(collector._id).populate(
      "assignedTeams",
      "team_name team_specialization team_status"
    );

    res.status(201).json({ success: true, data: populatedCollector });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await User.find().populate(
      "assignedTeams",
      "team_name team_specialization team_status"
    );

    const reports = await wasteAnalysis.aggregate([
      {
        $group: {
          _id: "$waste_analysedBy",
          totalReports: { $sum: 1 },
        },
      },
    ]);

    // Convert to Map safely
    const reportMap = new Map(
      reports
        .filter((r) => r._id) // remove null/undefined IDs
        .map((r) => [r._id.toString(), r.totalReports])
    );

    // Build response – with null-safe checks
    const result = users.map((user) => {
      const userId = user._id ? user._id.toString() : null;

      return {
        ...user.toObject(),
        totalReports: userId ? reportMap.get(userId) || 0 : 0,
        totalPoints: user.points || 0,
      };
    });

    return res.status(200).json({ success: true, data: result });
  })
);

/**
 * @desc Get a single user with total reports + total points
 * @route GET /users/:id
 * @access Private
 */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Fetch user
    const user = await User.findById(id).populate(
      "assignedTeams",
      "team_name team_specialization team_status"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Count reports for this user
    const reportStats = await wasteAnalysis.aggregate([
      { $match: { waste_analysedBy: user._id } },
      {
        $group: {
          _id: "$waste_analysedBy",
          totalReports: { $sum: 1 },
        },
      },
    ]);

    const totalReports =
      reportStats.length > 0 ? reportStats[0].totalReports : 0;

    return res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        totalPoints: user.points || 0,
        totalReports,
      },
    });
  })
);

/**
 * @desc Update a collector
 * @route PUT /users/collectors/:id
 * @access Private
 */
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, assignedTeams } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid collector ID" });
    }

    const collector = await User.findById(id);
    if (!collector || collector.role !== "collector") {
      return res.status(404).json({ message: "Collector not found" });
    }

    // Check if email is already in use
    if (email && email !== collector.email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update basic fields
    collector.firstName = firstName ?? collector.firstName;
    collector.lastName = lastName ?? collector.lastName;
    collector.fullName = `${collector.firstName} ${collector.lastName}`.trim();
    collector.email = email ?? collector.email;
    collector.phoneNumber = phoneNumber ?? collector.phoneNumber;

    // Handle team assignment
    if (assignedTeams !== undefined) {
      if (!Array.isArray(assignedTeams)) {
        return res
          .status(400)
          .json({ message: "assignedTeams must be an array" });
      }

      // Validate teams
      if (assignedTeams.length > 0) {
        const validTeams = await Team.find({ _id: { $in: assignedTeams } });
        if (validTeams.length !== assignedTeams.length) {
          return res
            .status(400)
            .json({ message: "One or more team IDs are invalid" });
        }
      }

      // Remove collector from old teams
      await Team.updateMany(
        { team_members: id },
        { $pull: { team_members: id } }
      );

      // Add collector to new teams
      if (assignedTeams.length > 0) {
        await Team.updateMany(
          { _id: { $in: assignedTeams } },
          { $addToSet: { team_members: id } }
        );
      }

      collector.assignedTeams = assignedTeams;
    }

    await collector.save();

    // Get updated collector with populated teams
    const updatedCollector = await User.findById(id).populate(
      "assignedTeams",
      "team_name team_specialization team_status"
    );

    res.status(200).json({ success: true, data: updatedCollector });
  })
);

/**
 * @desc Delete a collector
 * @route DELETE /users/collectors/:id
 * @access Private
 */
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove collector from all teams
    await Team.updateMany(
      { team_members: id },
      { $pull: { team_members: id } }
    );

    // Delete collector
    await User.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: "User deleted" });
  })
);

export { router as userRoutes };
