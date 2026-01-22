import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";

const router = Router();

// ---------------- REDEEM PRODUCT ----------------
router.post(
  "/:productId",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const productId = req.params.productId;

    const [user, product] = await Promise.all([
      prisma.user.findUnique({
        where: { user_id: userId },
      }),
      prisma.product.findUnique({
        where: { product_id: productId },
      }),
    ]);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (product.product_stock <= 0 || !product.product_isAvailable) {
      return res
        .status(400)
        .json({ success: false, message: "Product is out of stock" });
    }
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.user_points < product.product_pointsCost) {
      return res.status(400).json({
        success: false,
        message: `You need ${
          product.product_pointsCost - user.user_points
        } more points`,
      });
    }

    // Create order and update user/product in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          order_userId: userId,
          order_productId: productId,
          order_quantity: 1,
          order_totalCost: product.product_pointsCost,
          order_status: "confirmed",
        },
      });

      // Deduct points from user
      const updatedUser = await tx.user.update({
        where: { user_id: userId },
        data: {
          user_points: {
            decrement: product.product_pointsCost,
          },
        },
      });

      // Reduce product stock
      const updatedProduct = await tx.product.update({
        where: { product_id: productId },
        data: {
          product_stock: {
            decrement: 1,
          },
        },
      });

      // Create reward record (debit transaction)
      const reward = await tx.reward.create({
        data: {
          reward_userId: userId,
          reward_pointsEarned: -product.product_pointsCost, // Negative for redemption
          reward_reason: "redemption",
          reward_transactionType: "debit",
        },
      });

      // Create notification for user
      await tx.notification.create({
        data: {
          notification_userId: userId,
          notification_entityType: "order",
          notification_entityId: order.order_id,
          notification_type: "order_status",
          notification_title: "Reward Redeemed! 🎉",
          notification_message: `You successfully redeemed ${product.product_name} for ${product.product_pointsCost} points.`,
          notification_priority: "normal",
          notification_metadata: {
            orderId: order.order_id,
            productId: product.product_id,
            productName: product.product_name,
            pointsCost: product.product_pointsCost,
            action: "redeemed",
          },
        },
      });

      return { order, updatedUser, updatedProduct, reward };
    });

    res.status(200).json({
      success: true,
      message: `You have successfully redeemed ${product.product_name}`,
      data: {
        order: result.order,
        product: result.updatedProduct,
        remainingPoints: result.updatedUser.user_points,
        reward: result.reward,
      },
    });
  })
);

// ---------------- GET USER ORDER/REDEMPTION COUNT ----------------
router.get(
  "/user/count",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const count = await prisma.order.count({
      where: { order_userId: req.user.user_id },
    });

    res.json({ success: true, redemptionCount: count });
  })
);

// ---------------- GET USER ORDER/REDEMPTION HISTORY ----------------
router.get(
  "/user/history",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { order_userId: req.user.user_id },
      include: {
        order_product: true,
      },
      orderBy: { order_createdAt: "desc" },
    });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  })
);

export { router as redeemRoutes };