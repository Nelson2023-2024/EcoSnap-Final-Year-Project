import mongoose from "mongoose";

const truckSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    truckType: {
      type: String,
      enum: ["general", "recyclables", "e-waste", "organic", "hazardous"],
      required: true,
    },
    capacity: {
      type: Number, // in kg or cubic meters
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "in_use", "maintenance"],
      default: "available",
    },
    assignedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
  },
  { timestamps: true }
);

truckSchema.index({ currentLocation: "2dsphere" });

export const Truck = mongoose.model("Truck", truckSchema);
