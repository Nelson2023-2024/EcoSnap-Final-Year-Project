import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // 🔹 The user who receives the notification
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 Notification category/type
    type: {
      type: String,
      enum: [
        "login",
        "waste_report",
        "reward_earned",
        "bonus_awarded",
        "cleanup_verified",
        "dispatch_assigned",
        "dispatch_update",
        "truck_status",
        "team_update",
        "system",
      ],
      default: "system",
    },

    // 🔹 Short title and message for display
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔹 Whether the user has read it
    isRead: {
      type: Boolean,
      default: false,
    },

    // 🔹 Optional general metadata (fallback)
    metadata: {
      type: Object,
      default: {},
    },

    // 🔹 Optional direct reference to another model (dynamic)
    relatedModel: {
      type: String,
      enum: [
        "User",
        "WasteAnalysis",
        "Dispatch",
        "Reward",
        "Truck",
        "Team",
        null,
      ],
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel", // 👈 allows referencing any of the above
    },

    // 🔹 Priority and status (for admin/system processing)
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["active", "archived", "deleted"],
      default: "active",
    },
  },
  { timestamps: true }
);

// 📊 Helpful indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ relatedId: 1, relatedModel: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
