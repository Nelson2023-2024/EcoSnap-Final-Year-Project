// models/reward.model.js
import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      enum: ["waste_report", "cleanup_verified", "bonus", "redemption"],
      default: "waste_report",
    },
    status: {
      type: String,
      enum: ["earned", "redeemed"],
      default: "earned",
    },
  },
  { timestamps: true }
);

export const Reward = mongoose.model("Reward", rewardSchema);
