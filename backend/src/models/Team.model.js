import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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
    },
    status: {
      type: String,
      enum: ["active", "off_duty"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Team = mongoose.model("Team", teamSchema);