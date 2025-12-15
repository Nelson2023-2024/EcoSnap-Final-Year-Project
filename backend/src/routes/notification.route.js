import { Router } from "express";
import asyncHandler from "express-async-handler";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.config.js";

const router = Router();

// ==================== USER ROUTES ====================

// Get authenticated user's notifications (paginated)
router.get(
  "/",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          notification_userId: userId,
          notification_status: "active",
        },
        orderBy: {
          notification_createdAt: "desc",
        },
        skip,
        take: limit,
      }),

      prisma.notification.count({
        where: {
          notification_userId: userId,
          notification_status: "active",
        },
      }),

      prisma.notification.count({
        where: {
          notification_userId: userId,
          notification_isRead: false,
          notification_status: "active",
        },
      }),
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
      data: notifications,
    });
  })
);

// Get unread notification count
router.get(
  "/unread-count",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;

    const unreadCount = await prisma.notification.count({
      where: {
        notification_userId: userId,
        notification_isRead: false,
        notification_status: "active",
      },
    });

    res.json({
      success: true,
      unreadCount,
    });
  })
);

// Get single notification
router.get(
  "/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: {
        notification_id: id,
        notification_userId: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  })
);

// Mark notification as read
router.patch(
  "/:id/read",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const userRole = req.user.user_role;
    const { id } = req.params;

    // Admins can mark any notification as read, users can only mark their own
    const whereCondition = userRole === "admin"
      ? { notification_id: id }
      : { notification_id: id, notification_userId: userId };

    const notification = await prisma.notification.findFirst({
      where: whereCondition,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { notification_id: id },
      data: { notification_isRead: true },
    });

    res.json({
      success: true,
      message: "Notification marked as read",
      data: updatedNotification,
    });
  })
);

// Mark all notifications as read
router.patch(
  "/mark-all-read",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const userRole = req.user.user_role;

    // Admins can mark all notifications as read, users can only mark their own
    const whereCondition = userRole === "admin"
      ? { notification_isRead: false, notification_status: "active" }
      : {
          notification_userId: userId,
          notification_isRead: false,
          notification_status: "active",
        };

    const result = await prisma.notification.updateMany({
      where: whereCondition,
      data: {
        notification_isRead: true,
      },
    });

    res.json({
      success: true,
      message: userRole === "admin" 
        ? "All notifications marked as read" 
        : "All your notifications marked as read",
      count: result.count,
    });
  })
);

// Delete notification (soft delete by archiving)
router.delete(
  "/:id",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const userRole = req.user.user_role;
    const { id } = req.params;

    // Admins can delete any notification, users can only delete their own
    const whereCondition = userRole === "admin"
      ? { notification_id: id }
      : { notification_id: id, notification_userId: userId };

    const notification = await prisma.notification.findFirst({
      where: whereCondition,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await prisma.notification.update({
      where: { notification_id: id },
      data: { notification_status: "archived" },
    });

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  })
);

// Clear all notifications (archive all)
router.delete(
  "/clear-all",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const userId = req.user.user_id;
    const userRole = req.user.user_role;

    // Admins can clear all notifications, users can only clear their own
    const whereCondition = userRole === "admin"
      ? { notification_status: "active" }
      : {
          notification_userId: userId,
          notification_status: "active",
        };

    const result = await prisma.notification.updateMany({
      where: whereCondition,
      data: {
        notification_status: "archived",
      },
    });

    res.json({
      success: true,
      message: userRole === "admin" 
        ? "All notifications cleared" 
        : "All your notifications cleared",
      count: result.count,
    });
  })
);

// ==================== ADMIN ROUTES ====================

// Get admin unread count (all unread notifications across all users)
router.get(
  "/admin/unread-count",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const unreadCount = await prisma.notification.count({
      where: {
        notification_isRead: false,
        notification_status: "active",
      },
    });

    res.json({
      success: true,
      unreadCount,
    });
  })
);

// Get all notifications (Admin only)
router.get(
  "/admin/all",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        include: {
          notification_user: {
            select: {
              user_id: true,
              user_fullName: true,
              user_email: true,
              user_role: true,
            },
          },
        },
        orderBy: {
          notification_createdAt: "desc",
        },
        skip,
        take: limit,
      }),

      prisma.notification.count(),
    ]);

    res.json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: notifications,
    });
  })
);

// Get notification statistics (Admin only)
router.get(
  "/admin/stats",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const [
      totalNotifications,
      unreadNotifications,
      activeNotifications,
      archivedNotifications,
      notificationsByType,
      notificationsByPriority,
    ] = await Promise.all([
      prisma.notification.count(),

      prisma.notification.count({
        where: { notification_isRead: false },
      }),

      prisma.notification.count({
        where: { notification_status: "active" },
      }),

      prisma.notification.count({
        where: { notification_status: "archived" },
      }),

      prisma.notification.groupBy({
        by: ["notification_type"],
        _count: true,
      }),

      prisma.notification.groupBy({
        by: ["notification_priority"],
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalNotifications,
        unreadNotifications,
        activeNotifications,
        archivedNotifications,
        byType: notificationsByType.map((item) => ({
          type: item.notification_type,
          count: item._count,
        })),
        byPriority: notificationsByPriority.map((item) => ({
          priority: item.notification_priority,
          count: item._count,
        })),
      },
    });
  })
);

// Create notification manually (Admin only)
router.post(
  "/admin/create",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const {
      userId,
      type,
      title,
      message,
      priority,
      entityType,
      entityId,
      metadata,
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "User ID, title, and message are required",
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const notification = await prisma.notification.create({
      data: {
        notification_userId: userId,
        notification_type: type || "system",
        notification_title: title,
        notification_message: message,
        notification_priority: priority || "normal",
        notification_entityType: entityType || null,
        notification_entityId: entityId || null,
        notification_metadata: metadata || null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  })
);

// Broadcast notification to all users (Admin only)
router.post(
  "/admin/broadcast",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { type, title, message, priority, metadata } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: { user_id: true },
    });

    // Create notifications for all users
    const notifications = users.map((user) =>
      prisma.notification.create({
        data: {
          notification_userId: user.user_id,
          notification_type: type || "system",
          notification_title: title,
          notification_message: message,
          notification_priority: priority || "normal",
          notification_metadata: metadata || null,
        },
      })
    );

    await Promise.all(notifications);

    res.status(201).json({
      success: true,
      message: "Notification broadcasted successfully",
      usersNotified: users.length,
    });
  })
);

// Delete notification permanently (Admin only)
router.delete(
  "/admin/:id",
  isAuthenticated,
  isAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { notification_id: id },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await prisma.notification.delete({
      where: { notification_id: id },
    });

    res.json({
      success: true,
      message: "Notification permanently deleted",
    });
  })
);

export { router as notificationRoutes };