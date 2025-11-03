import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    teamURL: {
      type: String,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    specialization: {
      type: String,
      enum: ["general", "recyclables", "e-waste", "organic", "hazardous"],
      default: "general",
    },
    trucks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Truck",
      },
    ],

    status: {
      type: String,
      enum: ["active", "off_duty"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Team = mongoose.model("Team", teamSchema);
