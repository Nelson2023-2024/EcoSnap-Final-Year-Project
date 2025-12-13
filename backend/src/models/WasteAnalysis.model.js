import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const wasteAnalysisSchema = new mongoose.Schema({
  waste_id: {
    type: String,
    default: () => `waste_${uuidv4()}`,
    unique: true,
  },
  waste_analysedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  waste_imageURL: {
    type: String,
    required: true,
    trim: true,
  },
  waste_containsWaste: {
    type: Boolean,
    default: true,
  },
  waste_wasteCategories: [
    {
      waste_type: {
        type: String,
        trim: true,
      },
      waste_estimatedPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
    },
  ],
  waste_dominantWasteType: String,
  waste_estimatedVolume: {
    waste_value: Number,
    waste_unit: {
      type: String,
      enum: ["kg", "liters", "cubic_meters"],
      default: "kg",
    },
  },
  waste_possibleSource: String,
  waste_environmentalImpact: String,
  waste_confidenceLevel: String,
  waste_status: {
    type: String,
    enum: ["pending_dispatch", "dispatched", "collected", "no_waste", "error"],
    default: "pending_dispatch",
  },
  waste_errorMessage: {
    type: String,
    default: null,
  },
  waste_location: {
    waste_type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    waste_coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
    waste_address: String,
  },
  waste_createdAt: {
    type: Date,
    default: Date.now,
  },
  waste_updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 🚑 FIX: prevent OverwriteModelError
export const wasteAnalysis =
  mongoose.models.WasteAnalysis ||
  mongoose.model("WasteAnalysis", wasteAnalysisSchema);
