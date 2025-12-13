import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const dispatchSchema = new mongoose.Schema(
  {
    dispatch_id: {
      type: String,
      default: () => `dispatch_${uuidv4()}`,
      unique: true,
    },

    // Reference to the waste analysis
    dispatch_wasteAnalysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WasteAnalysis",
      required: true,
    },

    // Assigned team and truck
    dispatch_assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    dispatch_assignedTruck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck",
      required: true,
    },

    // Pickup details
    dispatch_pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        trim: true,
      },
    },

    dispatch_status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "en_route",
        "collected",
        "completed",
        "cancelled",
      ],
      default: "assigned",
    },

    // Scheduling
    dispatch_scheduledDate: {
      type: Date,
      required: true,
    },

    dispatch_estimatedArrival: {
      type: Date,
    },

    dispatch_actualCollectionDate: {
      type: Date,
    },

    // Collection verification
    dispatch_collectionVerified: {
      type: Boolean,
      default: false,
    },

    dispatch_collectionNotes: {
      type: String,
      trim: true,
    },

    dispatch_collectionImages: [
      {
        type: String, // URLs to before/after images
      },
    ],

    // Points awarded
    dispatch_pointsAwarded: {
      type: Number,
      default: 0,
    },

    dispatch_priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    dispatch_createdAt: {
      type: Date,
      default: Date.now,
    },

    dispatch_updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Update timestamp on save
dispatchSchema.pre("save", function (next) {
  this.dispatch_updatedAt = new Date();
  next();
});

// Index for geospatial queries
dispatchSchema.index({ "dispatch_pickupLocation": "2dsphere" });
dispatchSchema.index({ dispatch_status: 1, dispatch_scheduledDate: 1 });

export const Dispatch = mongoose.model("Dispatch", dispatchSchema);