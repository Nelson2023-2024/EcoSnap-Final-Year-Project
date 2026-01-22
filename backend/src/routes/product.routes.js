import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";
import upload from "../middleware/upload.middleware.js";
import { uploadToCloudinary } from "../lib/upload.cloudinary.js";

const router = Router();

router.use(isAuthenticated);

// GET all products (accessible to all authenticated users)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      orderBy: { product_createdAt: "desc" },
    });

    if (!products || products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products at the moment",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      data: products,
    });
  })
);

// GET single product
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { product_id: id },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
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
    const { productName, productDescription, productPointsCost, productStock } =
      req.body;

    if (
      !productName ||
      !productDescription ||
      !productPointsCost ||
      !productStock
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate numeric fields
    if (Number(productPointsCost) < 0 || Number(productStock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Points cost and stock must be non-negative",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    try {
      // Upload to Cloudinary
      const imageURL = await uploadToCloudinary(req.file, "products");

      // Create product
      const product = await prisma.product.create({
        data: {
          product_name: productName,
          product_description: productDescription,
          product_pointsCost: Number(productPointsCost),
          product_stock: Number(productStock),
          product_imageURL: imageURL,
        },
      });

      // Get all users to notify
      const allUsers = await prisma.user.findMany({
        select: { user_id: true },
      });

      // Create notifications for all users
      const notifications = allUsers.map((user) =>
        prisma.notification.create({
          data: {
            notification_userId: user.user_id,
            notification_entityType: "product",
            notification_entityId: product.product_id,
            notification_type: "product_update",
            notification_title: "New Product Available! 🎁",
            notification_message: `Check out our new product: ${productName} for ${productPointsCost} points!`,
            notification_metadata: {
              productId: product.product_id,
              productName,
              pointsCost: productPointsCost,
              action: "created",
            },
          },
        })
      );

      await Promise.all(notifications);

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
        usersNotified: allUsers.length,
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
      productIsAvailable,
    } = req.body;

    const product = await prisma.product.findUnique({
      where: { product_id: id },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Validate numeric fields if provided
    if (productPointsCost && Number(productPointsCost) < 0) {
      return res.status(400).json({
        success: false,
        message: "Points cost must be non-negative",
      });
    }
    if (productStock && Number(productStock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock must be non-negative",
      });
    }

    // Prepare update data
    const updateData = {};
    if (productName) updateData.product_name = productName;
    if (productDescription)
      updateData.product_description = productDescription;
    if (productPointsCost)
      updateData.product_pointsCost = Number(productPointsCost);
    if (productStock) updateData.product_stock = Number(productStock);
    if (
      typeof productIsAvailable === "boolean" ||
      productIsAvailable === "true" ||
      productIsAvailable === "false"
    ) {
      updateData.product_isAvailable =
        productIsAvailable === true || productIsAvailable === "true";
    }

    // Update image if a new one is uploaded
    if (req.file) {
      const imageURL = await uploadToCloudinary(req.file, "products");
      updateData.product_imageURL = imageURL;
    }

    const updatedProduct = await prisma.product.update({
      where: { product_id: id },
      data: updateData,
    });

    // Track what changed
    const changes = [];
    if (productName && productName !== product.product_name)
      changes.push("name");
    if (
      productPointsCost &&
      Number(productPointsCost) !== product.product_pointsCost
    )
      changes.push("price");
    if (productStock && Number(productStock) !== product.product_stock)
      changes.push("stock");
    if (
      productIsAvailable !== undefined &&
      (productIsAvailable === true || productIsAvailable === "true") !==
        product.product_isAvailable
    )
      changes.push("availability");
    if (req.file) changes.push("image");

    // Notify all users if significant changes
    if (changes.length > 0) {
      const allUsers = await prisma.user.findMany({
        select: { user_id: true },
      });

      const notificationMessage =
        changes.includes("price") || changes.includes("availability")
          ? `${updatedProduct.product_name} has been updated! ${
              changes.includes("price")
                ? `Now ${updatedProduct.product_pointsCost} points.`
                : ""
            } ${
              changes.includes("availability") &&
              updatedProduct.product_isAvailable
                ? "Back in stock!"
                : ""
            }`
          : `Product updated: ${updatedProduct.product_name}`;

      const notifications = allUsers.map((user) =>
        prisma.notification.create({
          data: {
            notification_userId: user.user_id,
            notification_entityType: "product",
            notification_entityId: updatedProduct.product_id,
            notification_type: "product_update",
            notification_title: "Product Updated 🔄",
            notification_message: notificationMessage,
            notification_metadata: {
              productId: updatedProduct.product_id,
              productName: updatedProduct.product_name,
              action: "updated",
              changes,
            },
          },
        })
      );

      await Promise.all(notifications);
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
      usersNotified: changes.length > 0 ? (await prisma.user.count()) : 0,
    });
  })
);

// DELETE product
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { product_id: id },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productName = product.product_name;

    // Get all users to notify
    const allUsers = await prisma.user.findMany({
      select: { user_id: true },
    });

    // Notify all users about product removal
    const notifications = allUsers.map((user) =>
      prisma.notification.create({
        data: {
          notification_userId: user.user_id,
          notification_type: "product_update",
          notification_title: "Product Removed",
          notification_message: `${productName} is no longer available in our store.`,
          notification_metadata: {
            productId: id,
            productName,
            action: "deleted",
          },
        },
      })
    );

    await Promise.all(notifications);

    // Delete product
    await prisma.product.delete({
      where: { product_id: id },
    });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      usersNotified: allUsers.length,
    });
  })
);

export { router as productRoutes };