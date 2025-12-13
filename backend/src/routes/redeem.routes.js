import { Router } from "express";
import asyncHandler from "express-async-handler";

import { isAuthenticated } from "../middleware/auth.middleware.js";
import { Product } from "../models/Product.model.js";
import { Notification } from "../models/Notification.model.js";
import { Redemption } from "../models/Redemption.model.js";
import { User } from "../models/user.model.js";

const router = Router();

// ---------------- REDEEM PRODUCT ----------------
router.post(
  "/:productId",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const productId = req.params.productId;

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

    // Deduct points & reduce stock
    user.points -= product.product_pointsCost;
    product.product_stock -= 1;

    // ---------------- CREATE REDEMPTION RECORD (prefixed fields) ----------------
    const redemption = await Redemption.create({
      redemption_user: user._id,
      redemption_product: product._id,
      redemption_productName: product.product_name,
      redemption_pointsCost: product.product_pointsCost,
      redemption_status: "fulfilled",
    });

    // Save in parallel
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
        redemption,
      },
    });
  })
);

// ---------------- GET USER REDEMPTION COUNT ----------------
router.get(
  "/user/count",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const count = await Redemption.countDocuments({
      redemption_user: req.user._id,
    });

    res.json({ success: true, redemptionCount: count });
  })
);

// ---------------- GET USER REDEMPTION HISTORY ----------------
router.get(
  "/user/history",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const redemptions = await Redemption.find({
      redemption_user: req.user._id,
    })
      .populate("redemption_product")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: redemptions.length,
      redemptions,
    });
  })
);

export { router as redeemRoutes };
