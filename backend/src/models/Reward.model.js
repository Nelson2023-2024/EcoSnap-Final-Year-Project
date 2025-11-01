// models/reward.model.js
import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    wasteAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WasteAnalysis",
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
    transactionType: {
      type: String,
      enum: ["credit", "debit"],
      default: "credit",
    },
  },
  { timestamps: true }
);

export const Reward = mongoose.model("Reward", rewardSchema);
