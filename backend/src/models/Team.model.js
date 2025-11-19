import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const teamSchema = new mongoose.Schema(
  {
    // Auto-generated truck ID
    team_id: {
      type: String,
      default: () => `team_${uuidv4()}`,
    },
    team_name: {
      type: String,
      required: true,
      trim: true,
    },

    team_url: {
      type: String,
    },

    team_members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    team_specialization: {
      type: String,
      enum: ["general", "recyclables", "e-waste", "organic", "hazardous"],
      default: "general",
    },

    team_trucks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Truck",
      },
    ],

    team_status: {
      type: String,
      enum: ["active", "off_duty"],
      default: "active",
    },
    team_createdAt: {
      type: Date,
      default: Date.now,
    },

    team_updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

export const Team = mongoose.model("Team", teamSchema);
