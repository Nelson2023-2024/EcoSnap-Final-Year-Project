import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const truckSchema = new mongoose.Schema(
  {
    // Auto-generated truck ID
    truck_id: {
      type: String,
      default: () => `truck_${uuidv4()}`,
      unique: true,
    },

    truck_registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    truck_imageURL: {
      type: String,
    },

    truck_truckType: {
      type: String,
      enum: ["general", "recyclables", "e-waste", "organic", "hazardous"],
      required: true,
    },

    truck_capacity: {
      type: Number, // kg or m³
      required: true,
    },

    truck_status: {
      type: String,
      enum: ["available", "in_use", "maintenance"],
      default: "available",
    },

    truck_assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },

    truck_currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    truck_createdAt: {
      type: Date,
      default: Date.now,
    },

    truck_updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Update timestamp on save
truckSchema.pre("save", function (next) {
  this.truck_updatedAt = new Date();
  next();
});

// 2dsphere index (prefixed)
truckSchema.index({ truck_currentLocation: "2dsphere" });

export const Truck = mongoose.model("Truck", truckSchema);
