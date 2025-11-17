import { Router } from "express";
import asyncHandler from "express-async-handler";

import { isAuthenticated } from "../middleware/auth.middleware.js";
import { User } from "../models/User.model.js";
import { Product } from "../models/Product.model.js";
import { Notification } from "../models/Notification.model.js";

const router = Router();

// ---------------- REDEEM PRODUCT ----------------
router.post(
  "/:productId",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user._id; // from auth middleware
    const productId = req.params.productId;

    // Find user and product in parallel
    const [user, product] = await Promise.all([
      User.findById(userId),
      Product.findOne({ product_id: productId }),
    ]);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.product_stock <= 0 || !product.product_isAvailable) {
      return res.status(400).json({ success: false, message: "Product is out of stock" });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.points < product.product_pointsCost) {
      return res.status(400).json({
        success: false,
        message: `You need ${product.product_pointsCost - user.points} more points`,
      });
    }

    // Deduct points and reduce product stock
    user.points -= product.product_pointsCost;
    product.product_stock -= 1;

    // Save user and product in parallel
    await Promise.all([user.save(), product.save()]);

    // Create notification
    await Notification.create({
      user: user._id,
      type: "reward_earned",
      title: "Reward Redeemed",
      message: `You successfully redeemed ${product.product_name} for ${product.product_pointsCost} points.`,
      relatedModel: "Reward",
      relatedId: product._id,
      priority: "normal",
    });

    res.status(200).json({
      success: true,
      message: `You have successfully redeemed ${product.product_name}`,
      data: {
        product,
        remainingPoints: user.points,
      },
    });
  })
);

export { router as redeemRoutes };
