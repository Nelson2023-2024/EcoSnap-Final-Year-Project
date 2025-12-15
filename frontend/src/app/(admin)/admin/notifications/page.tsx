"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Bell,
  Plus,
  Trash2,
  CheckCheck,
  LoaderIcon,
  Send,
  User,
  AlertCircle,
} from "lucide-react";
import {
  useAdminNotifications,
  useNotificationStats,
  useMarkAllAsRead,
  useAdminDeleteNotification,
  useCreateNotification,
  useBroadcastNotification,
} from "@/hooks/useNotification";
import { useUsers } from "@/hooks/useUser";
import { toast } from "react-hot-toast";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminNotifications() {
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const { data: notificationsData, isLoading, error } = useAdminNotifications(page, limit);
  const { data: stats } = useNotificationStats();
  const { data: users } = useUsers();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useAdminDeleteNotification();
  const createNotificationMutation = useCreateNotification();
  const broadcastNotificationMutation = useBroadcastNotification();

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState("");
  const [notifType, setNotifType] = React.useState("system");
  const [notifTitle, setNotifTitle] = React.useState("");
  const [notifMessage, setNotifMessage] = React.useState("");
  const [notifPriority, setNotifPriority] = React.useState("normal");

  // Broadcast dialog state
  const [broadcastDialogOpen, setBroadcastDialogOpen] = React.useState(false);
  const [broadcastType, setBroadcastType] = React.useState("system");
  const [broadcastTitle, setBroadcastTitle] = React.useState("");
  const [broadcastMessage, setBroadcastMessage] = React.useState("");
  const [broadcastPriority, setBroadcastPriority] = React.useState("normal");

  const notifications = notificationsData?.data || [];
  const total = notificationsData?.total || 0;
  const totalPages = notificationsData?.totalPages || 1;

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !notifTitle || !notifMessage) {
      toast.error("User, title, and message are required");
      return;
    }

    try {
      await createNotificationMutation.mutateAsync({
        userId: selectedUser,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        priority: notifPriority,
      });
      setCreateDialogOpen(false);
      setSelectedUser("");
      setNotifTitle("");
      setNotifMessage("");
      setNotifType("system");
      setNotifPriority("normal");
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!broadcastTitle || !broadcastMessage) {
      toast.error("Title and message are required");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to send this notification to ALL users?`
      )
    ) {
      return;
    }

    try {
      await broadcastNotificationMutation.mutateAsync({
        type: broadcastType,
        title: broadcastTitle,
        message: broadcastMessage,
        priority: broadcastPriority,
      });
      setBroadcastDialogOpen(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastType("system");
      setBroadcastPriority("normal");
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (
      window.confirm(
        "Are you sure you want to permanently delete this notification?"
      )
    ) {
      try {
        await deleteNotificationMutation.mutateAsync(notificationId);
      } catch (err) {
        // Error handled in hook
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-700 border-red-500/40";
      case "high":
        return "bg-orange-500/20 text-orange-700 border-orange-500/40";
      case "normal":
        return "bg-blue-500/20 text-blue-700 border-blue-500/40";
      case "low":
        return "bg-gray-500/20 text-gray-700 border-gray-500/40";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/40";
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      login: "bg-blue-100 text-blue-800",
      waste_report: "bg-green-100 text-green-800",
      reward_earned: "bg-yellow-100 text-yellow-800",
      dispatch_assigned: "bg-purple-100 text-purple-800",
      system: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-500 py-10">
        Failed to load notifications
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Notifications Management
          </h2>
          <p className="text-muted-foreground">
            Manage and send notifications to users
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Notification</DialogTitle>
                <DialogDescription>
                  Send a notification to a specific user
                </DialogDescription>
              </DialogHeader>

              <form className="grid gap-4" onSubmit={handleCreateNotification}>
                <div className="grid gap-3">
                  <Label htmlFor="user">User *</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Users</SelectLabel>
                        {users?.map((user: any) => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.user_fullName || user.user_email}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-3">
                    <Label htmlFor="type">Type</Label>
                    <Select value={notifType} onValueChange={setNotifType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="waste_report">Waste Report</SelectItem>
                        <SelectItem value="reward_earned">Reward</SelectItem>
                        <SelectItem value="dispatch_assigned">Dispatch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={notifPriority}
                      onValueChange={setNotifPriority}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Notification title"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Notification message"
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={createNotificationMutation.isPending}
                  >
                    {createNotificationMutation.isPending
                      ? "Creating..."
                      : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog
            open={broadcastDialogOpen}
            onOpenChange={setBroadcastDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Broadcast
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Broadcast Notification</DialogTitle>
                <DialogDescription>
                  Send a notification to ALL users
                </DialogDescription>
              </DialogHeader>

              <form className="grid gap-4" onSubmit={handleBroadcast}>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    This will send a notification to all registered users.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-3">
                    <Label htmlFor="broadcast-type">Type</Label>
                    <Select
                      value={broadcastType}
                      onValueChange={setBroadcastType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="waste_report">Waste Report</SelectItem>
                        <SelectItem value="reward_earned">Reward</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="broadcast-priority">Priority</Label>
                    <Select
                      value={broadcastPriority}
                      onValueChange={setBroadcastPriority}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="broadcast-title">Title *</Label>
                  <Input
                    id="broadcast-title"
                    placeholder="Notification title"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="broadcast-message">Message *</Label>
                  <Textarea
                    id="broadcast-message"
                    placeholder="Notification message"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={broadcastNotificationMutation.isPending}
                  >
                    {broadcastNotificationMutation.isPending
                      ? "Sending..."
                      : "Send to All Users"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotifications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Unread
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.unreadNotifications}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeNotifications}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Archived
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {stats.archivedNotifications}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Table */}
      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No notifications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow
                      key={notification.notification_id}
                      className={
                        !notification.notification_isRead
                          ? "bg-blue-50/50 dark:bg-blue-950/20"
                          : ""
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">
                              {notification.notification_user?.user_fullName ||
                                "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.notification_user?.user_email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {notification.notification_title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {notification.notification_message}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getTypeColor(notification.notification_type)}
                        >
                          {notification.notification_type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getPriorityColor(
                            notification.notification_priority
                          )}
                        >
                          {notification.notification_priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            notification.notification_isRead
                              ? "secondary"
                              : "default"
                          }
                        >
                          {notification.notification_isRead ? "Read" : "Unread"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(notification.notification_createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            handleDelete(notification.notification_id)
                          }
                          disabled={deleteNotificationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}