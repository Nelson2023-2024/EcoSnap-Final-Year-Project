// frontend/src/app/(collector)/collector-dashboard/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  LoaderIcon,
  Package,
  TrendingUp,
  Calendar,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import {
  useTeamAssignment,
  useCollectorDispatches,
  useCollectorStats,
} from "@/hooks/useCollector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const CollectorDashboard = () => {
  const { data: teamData, isLoading: teamLoading, error: teamError } = useTeamAssignment();
  // Fetch both assigned AND en_route dispatches using "active" status
  const { data: dispatchesData, isLoading: dispatchesLoading } = useCollectorDispatches("active", 1, 10);
  const { data: stats, isLoading: statsLoading } = useCollectorStats();

  // Loading state
  if (teamLoading || dispatchesLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <LoaderIcon className="h-12 w-12 animate-spin text-eco-primary mx-auto" />
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state - No team assignment
  if (teamError) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are not assigned to any team yet. Please contact your administrator.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const pendingDispatches = dispatchesData?.data ?? [];
  const summary = dispatchesData?.summary ?? {};

  // Calculate active dispatches (assigned + en_route)
  const activeDispatchesCount = (summary.assigned ?? 0) + (summary.en_route ?? 0);

  // Stats cards
  const collectorStats = [
    {
      id: 1,
      title: "Pending Tasks",
      value: stats?.pendingDispatches ?? 0,
      subtitle: "Awaiting collection",
      icon: <Clock className="h-4 w-4 text-warning" />,
      color: "text-warning",
    },
    {
      id: 2,
      title: "En Route",
      value: stats?.enRouteDispatches ?? 0,
      subtitle: "Currently collecting",
      icon: <Navigation className="h-4 w-4 text-blue-500" />,
      color: "text-blue-500",
    },
    {
      id: 3,
      title: "Completed",
      value: stats?.completedDispatches ?? 0,
      subtitle: "Total collections",
      icon: <CheckCircle className="h-4 w-4 text-success" />,
      color: "text-success",
    },
    {
      id: 4,
      title: "Points Awarded",
      value: stats?.totalPointsAwarded ?? 0,
      subtitle: "To reporters",
      icon: <TrendingUp className="h-4 w-4 text-eco-primary" />,
      color: "text-eco-primary",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "en_route":
        return "bg-warning/10 text-warning border-warning/20";
      case "collected":
        return "bg-success/10 text-success border-success/20";
      case "completed":
        return "bg-eco-primary/10 text-eco-primary border-eco-primary/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "normal":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "low":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="rounded-lg bg-gradient-to-r from-eco-primary to-eco-success p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Collector Dashboard</h1>
                <p className="mt-2 text-white/90">
                  {teamData?.teamName} • {teamData?.specialization}
                </p>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                  <Truck className="h-5 w-5" />
                  <span className="font-semibold">
                    {teamData?.trucks.filter(t => t.truck_status === "available").length} Trucks Available
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {collectorStats.map((stat) => (
              <Card key={stat.id} className="border-border transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Team Information */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Team Members */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-eco-primary" />
                  Team Members
                </CardTitle>
                <CardDescription>Your collection team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamData?.members.map((member) => (
                    <div
                      key={member.user.user_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.user.user_profileImage} />
                        <AvatarFallback>
                          {member.user.user_fullName?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{member.user.user_fullName}</p>
                        <p className="text-xs text-muted-foreground">{member.user.user_email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.user.user_role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Available Trucks */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-eco-primary" />
                  Available Trucks
                </CardTitle>
                <CardDescription>Ready for dispatch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamData?.trucks.map((truck) => (
                    <div
                      key={truck.truck_id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-eco-primary/10 flex items-center justify-center">
                          <Truck className="h-6 w-6 text-eco-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {truck.truck_registrationNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {truck.truck_truckType} • {truck.truck_capacity}kg
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          truck.truck_status === "available"
                            ? "bg-success/10 text-success border-success/20"
                            : truck.truck_status === "in_use"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {truck.truck_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Dispatches */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Active Dispatches</CardTitle>
                <CardDescription>
                  Tasks in progress ({activeDispatchesCount})
                </CardDescription>
              </div>
              <Link href="/collector/dispatches">
                <Button variant="outline" size="sm">
                  <Package className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {pendingDispatches.length > 0 ? (
                <div className="space-y-4">
                  {pendingDispatches.map((dispatch) => (
                    <Link
                      key={dispatch.dispatch_id}
                      href={`/collector/dispatch/${dispatch.dispatch_id}`}
                    >
                      <div className="rounded-lg border border-border p-4 transition-all hover:bg-muted/50 hover:shadow-md cursor-pointer">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted">
                              <img
                                src={dispatch.dispatch_wasteAnalysis.waste_imageURL}
                                alt="Waste"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {dispatch.dispatch_wasteAnalysis.waste_dominantWasteType}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  {dispatch.dispatch_locationAddress}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant="outline"
                              className={getPriorityColor(dispatch.dispatch_priority)}
                            >
                              {dispatch.dispatch_priority}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getStatusColor(dispatch.dispatch_status)}
                            >
                              {dispatch.dispatch_status}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Scheduled: {formatDate(dispatch.dispatch_scheduledDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Truck className="h-4 w-4" />
                            <span>{dispatch.dispatch_assignedTruck.truck_registrationNumber}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            Reporter: {dispatch.dispatch_wasteAnalysis.waste_user.user_fullName}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium mb-2">No active dispatches</p>
                  <p className="text-sm">All caught up! Check back later for new tasks.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Collections */}
          {stats?.recentCollections && stats.recentCollections.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Collections</CardTitle>
                <CardDescription>Your latest completed tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentCollections.map((collection) => (
                    <div
                      key={collection.dispatch_id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {collection.dispatch_wasteAnalysis.waste_dominantWasteType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {collection.dispatch_wasteAnalysis.waste_locationAddress}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-success">
                          +{collection.dispatch_pointsAwarded} pts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(collection.dispatch_actualCollectionDate)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default CollectorDashboard;