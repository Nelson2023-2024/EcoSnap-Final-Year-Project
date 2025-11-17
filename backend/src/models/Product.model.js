import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
    },
    product_name: {
      type: String,
      required: true,
      trim: true,
    },

    product_description: {
      type: String,
      trim: true,
    },

    product_imageURL: {
      type: String,
      required: true, // one primary image is enough
    },

    product_pointsCost: {
      type: Number,
      required: true,
      min: 0,
    },

    product_stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    product_isAvailable: {
      type: Boolean,
      default: true,
    },
    product_createdAt: {
      type: Date,
      default: Date.now(),
    },
    product_updatedAt: {
      type: Date,
      default: Date.now(),
    },
  },
);



export const Product = mongoose.model("Product", productSchema);
