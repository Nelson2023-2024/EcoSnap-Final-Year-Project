import mongoose from "mongoose";

const redemptionSchema = new mongoose.Schema(
  {
    redemption_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    redemption_product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    redemption_productName: {
      type: String,
      required: true,
      trim: true,
    },
    redemption_pointsCost: {
      type: Number,
      required: true,
    },
    redemption_status: {
      type: String,
      enum: ["pending", "fulfilled", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Redemption = mongoose.model("Redemption", redemptionSchema);
