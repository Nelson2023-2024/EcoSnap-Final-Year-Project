import { Router } from "express";
import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { Product } from "../models/Product.model.js";
import upload from "../middleware/upload.middleware.js";
import { uploadToCloudinary } from "../lib/upload.cloudinary.js";

const router = Router();

router.use(isAuthenticated);

// GET all products (accessible to all authenticated users)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ product_createdAt: -1 });

    if (!products || products.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: "No products at the moment",
        data: [] 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: products 
    });
  })
);

// GET single product
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID" 
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: product 
    });
  })
);

// ADMIN ROUTES
router.use(isAdmin);

// CREATE product
router.post(
  "/",
  upload.single("productImage"),
  asyncHandler(async (req, res) => {
    const {
      productName,
      productDescription,
      productPointsCost,
      productStock
    } = req.body;

    if (!productName || !productDescription || !productPointsCost || !productStock) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    // Validate numeric fields
    if (Number(productPointsCost) < 0 || Number(productStock) < 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Points cost and stock must be non-negative" 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Product image is required" 
      });
    }

    try {
      // Upload to Cloudinary
      const imageURL = await uploadToCloudinary(req.file, "products");

      // Create product
      const product = await Product.create({
        product_name: productName,
        product_description: productDescription,
        product_pointsCost: Number(productPointsCost),
        product_stock: Number(productStock),
        product_imageURL: imageURL,
      });

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (error) {
      console.error("Product creation error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create product",
        error: error.message,
      });
    }
  })
);

// UPDATE product
router.put(
  "/:id",
  upload.single("productImage"),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      productName, 
      productDescription, 
      productPointsCost, 
      productStock, 
      productIsAvailable 
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID" 
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // Update fields if provided
    if (productName) product.product_name = productName;
    if (productDescription) product.product_description = productDescription;
    if (productPointsCost) {
      if (Number(productPointsCost) < 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Points cost must be non-negative" 
        });
      }
      product.product_pointsCost = Number(productPointsCost);
    }
    if (productStock) {
      if (Number(productStock) < 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Stock must be non-negative" 
        });
      }
      product.product_stock = Number(productStock);
    }
    if (typeof productIsAvailable === "boolean" || productIsAvailable === "true" || productIsAvailable === "false") {
      product.product_isAvailable = productIsAvailable === true || productIsAvailable === "true";
    }

    // Update image if a new one is uploaded
    if (req.file) {
      const imageURL = await uploadToCloudinary(req.file, "products");
      product.product_imageURL = imageURL;
    }

    product.product_updatedAt = new Date();

    await product.save();

    res.status(200).json({ 
      success: true, 
      message: "Product updated successfully", 
      data: product 
    });
  })
);

// DELETE product
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID" 
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    await product.deleteOne();

    res.status(200).json({ 
      success: true, 
      message: "Product deleted successfully" 
    });
  })
);

export { router as productRoutes };