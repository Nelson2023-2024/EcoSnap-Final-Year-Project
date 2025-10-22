import mongoose from "mongoose";

const wasteAnalysisSchema = new mongoose.Schema(
  {
    analysedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    imageURL: {
      type: String,
      required: true,
      trim: true,
    },
    containsWaste: {
      type: Boolean,
      default: true,
    },
    wasteCategories: [
      {
        type: {
          type: String,
          trim: true,
        },
        estimatedPercentage: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
    possibleSource: {
      type: String,
      trim: true,
    },
    environmentalImpact: {
      type: String,
      trim: true,
    },
    confidenceLevel: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["valid", "no_waste", "error"],
      default: "valid",
    },
    errorMessage: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
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
  },
  { timestamps: true }
);

export const wasteAnalysis = mongoose.model(
  "WasteAnalysis",
  wasteAnalysisSchema
);
