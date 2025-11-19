import mongoose from "mongoose";

const dispatchSchema = new mongoose.Schema(
  {
    // Auto-generated truck ID
    dispatch_id: {
      type: String,
      default: () => `dispatch_${uuidv4()}`,
      unique: true,
    },
    dispatch_wasteAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WasteAnalysis",
      required: true,
    },
    dispatch_reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dispatch_assignedTruck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck",
    },
    dispatch_assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    dispatch_truckType: {
      type: String,
      enum: ["general", "recyclables", "e-waste", "organic", "hazardous"],
      required: true,
    },
    dispatch_status: {
      type: String,
      enum: ["pending", "assigned", "in_progress", "completed"],
      default: "pending",
    },
    dispatch_location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], required: true },
      address: String,
    },

    dispatch_priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    dispatch_scheduledDate: {
      type: Date,
      required: true,
    },

    // Timeline tracking
    dispatch_assignedAt: Date,
    dispatch_dispatchedAt: Date,
    dispatch_completedAt: Date,

    dispatch_verificationPhotos: [String],
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
     dispatch_createdAt: {
      type: Date,
      default: Date.now,
    },

    dispatch_updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
);

dispatchSchema.index({ location: "2dsphere" });

export const Dispatch = mongoose.model("Dispatch", dispatchSchema);
