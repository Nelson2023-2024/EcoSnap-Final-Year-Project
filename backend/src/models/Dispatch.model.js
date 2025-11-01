import mongoose from "mongoose";

const dispatchSchema = new mongoose.Schema(
  {
    wasteAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WasteAnalysis",
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTruck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck",
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    truckType: {
      type: String,
      enum: ["general", "recyclables", "e-waste", "organic", "hazardous"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed"],
      default: "pending",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], required: true },
      address: String,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    scheduledDate: {
      type: Date,
      required: true,
    },

    // Timeline tracking
    assignedAt: Date,
    dispatchedAt: Date,
    completedAt: Date,

    verificationPhotos: [String],
    // Issues during collection
    issues: [
      {
        description: String,
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

dispatchSchema.index({ location: "2dsphere" });

export const Dispatch = mongoose.model("Dispatch", dispatchSchema);
