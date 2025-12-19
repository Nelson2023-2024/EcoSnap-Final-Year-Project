"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Trash2,
  CheckCheck,
  LoaderIcon,
  Calendar,
  Package,
  Award,
  Truck,
  AlertCircle,
  BellOff,
} from "lucide-react";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  useClearAllNotifications,
} from "@/hooks/useNotification";
import { useAuthUser } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UserNotifications() {
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const { data: user } = useAuthUser();
  const { data: notificationsData, isLoading, error } = useNotifications(page, limit);
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const clearAllMutation = useClearAllNotifications();

  const notifications = notificationsData?.data || [];
  const total = notificationsData?.total || 0;
  const totalPages = notificationsData?.totalPages || 1;
  const unreadCount = notificationsData?.unreadCount || 0;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync(notificationId);
    } catch (err) {
      // Error handled in hook
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40";
      case "high":
        return "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/40";
      case "normal":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40";
      case "low":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/40";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/40";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "waste_report":
        return <Package className="h-5 w-5" />;
      case "reward_earned":
      case "bonus_awarded":
        return <Award className="h-5 w-5" />;
      case "dispatch_assigned":
      case "dispatch_update":
      case "cleanup_verified":
        return <Truck className="h-5 w-5" />;
      case "order_status":
      case "product_update":
        return <Package className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      login: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      waste_report: "bg-green-500/10 text-green-700 dark:text-green-400",
      reward_earned: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      bonus_awarded: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      dispatch_assigned: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
      dispatch_update: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
      cleanup_verified: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      order_status: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
      system: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    };
    return colors[type] || "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="h-8 w-8 animate-spin text-eco-primary" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium">Failed to load notifications</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try refreshing the page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Bell className="h-8 w-8 text-eco-primary" />
                Notifications
              </h1>
              <p className="text-muted-foreground mt-1">
                Stay updated with your waste reports and rewards
              </p>
            </div>

            {unreadCount > 0 && (
              <Badge className="bg-eco-primary text-white px-3 py-1">
                {unreadCount} Unread
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending || unreadCount === 0}
                className="border-eco-primary/30 text-eco-primary hover:bg-eco-primary/10"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                    disabled={clearAllMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will archive all your notifications. You won't be able to
                      see them again. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => clearAllMutation.mutate()}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="p-12 text-center">
            <BellOff className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              When you report waste or earn rewards, you'll see notifications here
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.notification_id}
                className={`transition-all hover:shadow-md ${
                  !notification.notification_isRead
                    ? "border-l-4 border-l-eco-primary bg-eco-primary/5"
                    : "border-l-4 border-l-transparent"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 p-3 rounded-lg ${getTypeColor(
                        notification.notification_type
                      )}`}
                    >
                      {getTypeIcon(notification.notification_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {notification.notification_title}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`flex-shrink-0 ${getPriorityColor(
                            notification.notification_priority
                          )}`}
                        >
                          {notification.notification_priority}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.notification_message}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(notification.notification_createdAt)}
                        </div>

                        <div className="flex items-center gap-1">
                          {!notification.notification_isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleMarkAsRead(notification.notification_id)
                              }
                              disabled={markAsReadMutation.isPending}
                              className="h-8 px-2 text-eco-primary hover:text-eco-primary hover:bg-eco-primary/10"
                            >
                              <CheckCheck className="h-4 w-4 mr-1" />
                              Mark Read
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                disabled={deleteNotificationMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete notification?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will archive this notification. You won't be
                                  able to see it again.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDelete(notification.notification_id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} • {total} total notifications
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}