import { API_URL } from "@/lib/api-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Types
interface Notification {
  notification_id: string;
  notification_userId: string;
  notification_type: string;
  notification_title: string;
  notification_message: string;
  notification_entityType: string | null;
  notification_entityId: string | null;
  notification_isRead: boolean;
  notification_metadata: any;
  notification_priority: string;
  notification_status: string;
  notification_createdAt: string;
  notification_updatedAt: string;
  notification_user?: {
    user_id: string;
    user_fullName: string | null;
    user_email: string;
    user_role: string;
  };
}

interface NotificationsResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount?: number;
  data: Notification[];
}

interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  activeNotifications: number;
  archivedNotifications: number;
  byType: { type: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

// Get user's notifications
export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["notifications", page, limit],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/notification?page=${page}&limit=${limit}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data: NotificationsResponse = await response.json();
      return data;
    },
  });
}

// Get unread count
export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/notification/unread-count`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }

      const data = await response.json();
      return data.unreadCount as number;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Get admin unread count (for all users)
export function useAdminUnreadCount() {
  return useQuery({
    queryKey: ["admin-notifications", "unread-count"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/notification/admin/unread-count`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch admin unread count");
      }

      const data = await response.json();
      return data.unreadCount as number;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Mark notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(
        `${API_URL}/notification/${notificationId}/read`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mark as read");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      // Invalidate all notification-related queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
  });
}

// Mark all as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/notification/mark-all-read`, {
        method: "PATCH",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to mark all as read");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Invalidate all notification-related queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      toast.success(data.message || "All notifications marked as read");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark all as read");
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`${API_URL}/notification/${notificationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete notification");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      // Invalidate all notification-related queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      toast.success("Notification deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete notification");
    },
  });
}

// Clear all notifications
export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/notification/clear-all`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to clear all notifications");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Invalidate all notification-related queries
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      toast.success(data.message || "All notifications cleared");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to clear notifications");
    },
  });
}

// ==================== ADMIN HOOKS ====================

// Get all notifications (Admin)
export function useAdminNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["admin-notifications", page, limit],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/notification/admin/all?page=${page}&limit=${limit}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch admin notifications");
      }

      const data: NotificationsResponse = await response.json();
      return data;
    },
  });
}

// Get notification stats (Admin)
export function useNotificationStats() {
  return useQuery({
    queryKey: ["notification-stats"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/notification/admin/stats`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notification stats");
      }

      const result = await response.json();
      return result.data as NotificationStats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Create notification (Admin)
export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      userId: string;
      type?: string;
      title: string;
      message: string;
      priority?: string;
      entityType?: string;
      entityId?: string;
      metadata?: any;
    }) => {
      const response = await fetch(`${API_URL}/notification/admin/create`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create notification");
      }

      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      // Invalidate all notification-related queries
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create notification");
    },
  });
}

// Broadcast notification (Admin)
export function useBroadcastNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type?: string;
      title: string;
      message: string;
      priority?: string;
      metadata?: any;
    }) => {
      const response = await fetch(`${API_URL}/notification/admin/broadcast`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to broadcast notification");
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Invalidate all notification-related queries
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(`Notification sent to ${data.usersNotified} users`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to broadcast notification");
    },
  });
}

// Delete notification permanently (Admin)
export function useAdminDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(
        `${API_URL}/notification/admin/${notificationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete notification");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      // Invalidate all notification-related queries
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification permanently deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete notification");
    },
  });
}