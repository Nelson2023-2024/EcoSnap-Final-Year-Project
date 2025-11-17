import { Router } from "express";
import asyncHandler from "express-async-handler";

import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { Product } from "../models/Product.model.js";
import upload from "../middleware/upload.middleware.js";
import { uploadToCloudinary } from "../lib/upload.cloudinary.js";

const router = Router();

router.use(isAuthenticated);

// ---------------- GET all products (accessible to all authenticated users) ----------------
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ product_createdAt: -1 });

    if (!products || products.length === 0) {
      return res.status(200).json({ message: "No products at the moment" });
    }

    res.status(200).json(products);
  })
);

// ---------------- ADMIN ROUTES ----------------
router.use(isAdmin);

// ---------------- CREATE product ----------------
router.post(
  "/",
  upload.single("productImage"),
  asyncHandler(async (req, res) => {
    const { productName, productDescription, productPointsCost, productStock } = req.body;
    const imgFile = req.file;

    if (!productName || !productDescription || !productPointsCost || !productStock) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!imgFile) {
      return res.status(400).json({ error: "Image is required" });
    }

    const imageURL = await uploadToCloudinary(imgFile, "products");

    const product = await Product.create({
      product_name: productName,
      product_description: productDescription,
      product_pointsCost: productPointsCost,
      product_stock: productStock,
      product_imageURL: imageURL,
    });

    product.product_id = product._id;
    await product.save();

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  })
);

// ---------------- UPDATE product ----------------
router.put(
  "/:id",
  upload.single("productImage"), // optional new image
  asyncHandler(async (req, res) => {
    const productId = req.params.id;
    const { productName, productDescription, productPointsCost, productStock, productIsAvailable } = req.body;

    const product = await Product.findOne({ product_id: productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update fields if provided
    if (productName) product.product_name = productName;
    if (productDescription) product.product_description = productDescription;
    if (productPointsCost) product.product_pointsCost = productPointsCost;
    if (productStock) product.product_stock = productStock;
    if (typeof productIsAvailable === "boolean") product.product_isAvailable = productIsAvailable;

    // Update image if a new one is uploaded
    if (req.file) {
      const imageURL = await uploadToCloudinary(req.file, "products");
      product.product_imageURL = imageURL;
    }

    product.product_updatedAt = new Date();

    await product.save();

    res.status(200).json({ success: true, message: "Product updated successfully", data: product });
  })
);

// ---------------- DELETE product ----------------
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const productId = req.params.id;

    const product = await Product.findOne({ product_id: productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: "Product deleted successfully" });
  })
);

export { router as productRoutes };
