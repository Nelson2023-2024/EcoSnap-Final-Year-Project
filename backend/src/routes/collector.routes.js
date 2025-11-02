import { Router } from "express";
import asyncHandler from "express-async-handler";
import { User } from "../models/User.model.js";
import { Team } from "../models/Team.model.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { Notification } from "../models/Notification.model.js";

const router = Router();

router.post(
  "/",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, username, phoneNumber, assignedTeam } =
      req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !username || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (firstName, lastName, email, username, phoneNumber) are required",
      });
    }

    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email already exists"
            : "Username already exists",
      });
    }

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

      // Check team capacity or status
      if (team.status === "off_duty") {
        return res.status(400).json({
          success: false,
          message: "Cannot assign to an off-duty team",
        });
      }
    }

    const newCollector = await User.create({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      username,
      phoneNumber,
      role: "collector",
      assignedTeams: assignedTeam ? [assignedTeam] : [], //asign 1 team at a time
      authProvider: "local", // Assuming email-based login
    });

    // Add collector to the team's members array if a team is assigned
    if (assignedTeam && team) {
      team.members.push(newCollector._id);
      await team.save();

      // Notify collector about team assignment
      await Notification.create({
        user: newCollector._id,
        type: "team_update",
        title: "Welcome to the Team! 🎉",
        message: `You have been assigned to ${team.name} (${team.specialization} team)`,
        relatedModel: "Team",
        relatedId: team._id,
        priority: "high",
      });
    }

    res.status(201).json({
      success: true,
      message: "Collector created successfully",
      data: newCollector,
    });
  })
);

//get all collectors
router.get(
  "/",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const collectors = await User.find({ role: "collector" })
      .populate("assignedTeams", "name specialization status")
      .select("-password -googleID -authProvider");

    if (collectors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No collectors found in the system at the moment",
      });
    }

    res.json({
      success: true,
      results: collectors.length,
      data: collectors,
    });
  })
);

//get a specific collectors
router.get(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const collector = await User.findOne({
      _id: req.params.id,
      role: "collector",
    })
      .populate("assignedTeams", "name specialization status members")
      .select("-password");

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found",
      });
    }

    res.json({
      success: true,
      data: collector,
    });
  })
);

//upadte collector
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phoneNumber, assignedTeam } = req.body;

    const collector = await User.findOne({
      _id: req.params.id,
      role: "collector",
    });

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found",
      });
    }

    // Handle team reassignment (one team at a time)
    if (assignedTeam !== undefined) {
      const oldTeamId = collector.assignedTeams[0]; // assuming only one team at a time

      // Remove from old team if exists
      if (oldTeamId) {
        await Team.findByIdAndUpdate(oldTeamId, {
          $pull: { members: collector._id },
        });
      }

      // Add to new team if provided
      if (assignedTeam) {
        const newTeam = await Team.findById(assignedTeam);
        if (!newTeam) {
          return res.status(404).json({
            success: false,
            message: "New team not found",
          });
        }

        newTeam.members.push(collector._id);
        await newTeam.save();

        // Notify collector of reassignment
        await Notification.create({
          user: collector._id,
          type: "team_update",
          title: "Team Reassignment",
          message: `You have been reassigned to ${newTeam.name} (${newTeam.specialization})`,
          relatedModel: "Team",
          relatedId: newTeam._id,
          priority: "high",
        });
      }

      collector.assignedTeams = [assignedTeam]; // Store only the new team
    }

    // Update other fields
    if (firstName) collector.firstName = firstName;
    if (lastName) collector.lastName = lastName;
    if (firstName || lastName) {
      collector.fullName = `${collector.firstName} ${collector.lastName}`;
    }
    if (email) collector.email = email;
    if (phoneNumber) collector.phoneNumber = phoneNumber;

    await collector.save();

    const updatedCollector = await User.findById(collector._id)
      .populate("assignedTeams")
      .select("-password");

    res.json({
      success: true,
      message: "Collector updated successfully",
      data: updatedCollector,
    });
  })
);

//delete a collector
router.delete(
  "/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const collector = await User.findOne({
      _id: req.params.id,
      role: "collector",
    });

    if (!collector) {
      return res.status(404).json({
        success: false,
        message: "Collector not found",
      });
    }

    // Remove from team if assigned
    if (collector.assignedTeams.length > 0) {
      await Team.findByIdAndUpdate(collector.assignedTeams[0], {
        $pull: { members: collector._id },
      });
    }

    await collector.deleteOne();

    res.json({
      success: true,
      message: "Collector deleted successfully",
    });
  })
);

//Removing a user from a team
router.put(
  "/:id/members/remove",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { memberId } = req.body; // Single user ID to be removed

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Validate the user
    const user = await User.findById(memberId);

    if (!user || user.role !== "collector") {
      return res.status(400).json({
        success: false,
        message: "Invalid user or not a collector.",
      });
    }

    // Remove from the team
    if (team.members.includes(memberId)) {
      team.members.pull(memberId);
      await team.save();

      // Remove the user's team assignment
      user.assignedTeam = null;
      await user.save();

      // Send notification to the user
      await Notification.create({
        user: user._id,
        type: "team_update",
        title: "You have been removed from a team",
        message: `You have been removed from the ${team.name} (${team.specialization}) team.`,
        relatedModel: "Team",
        relatedId: team._id,
        priority: "high",
      });

      res.json({
        success: true,
        message: "Member removed from team successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Member not found in this team",
      });
    }
  })
);

export { router as collectorRoutes };
