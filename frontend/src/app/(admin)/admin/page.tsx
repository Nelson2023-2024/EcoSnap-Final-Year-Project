"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  FileText,
  Users,
  Truck,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  LoaderIcon,
  Clock,
  Award,
  MapPin,
} from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { Badge } from "@/components/ui/badge";
import AdminReportGenerator from "@/components/admin/AdminReportGenerator";

const CHART_COLORS = {
  primary: "#10b981",
  secondary: "#3b82f6",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  teal: "#14b8a6",
  indigo: "#6366f1",
};

export default function AdminDashboard() {
  const { data, isLoading, isError } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="h-8 w-8 animate-spin text-eco-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Failed to load dashboard. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview } = data;

  // Prepare stats data
  const statsData = [
    {
      title: "Total Reports",
      value: overview.totalReports.value.toLocaleString(),
      change: overview.totalReports.change,
      trend: overview.totalReports.trend,
      icon: FileText,
      color: "text-eco-primary",
    },
    {
      title: "Active Users",
      value: overview.activeUsers.value.toLocaleString(),
      change: overview.activeUsers.change,
      trend: overview.activeUsers.trend,
      icon: Users,
      color: "text-blue-600",
      subtitle: `${overview.activeUsers.weeklyActive} active this week`,
    },
    {
      title: "Dispatched Trucks",
      value: overview.dispatchedTrucks.value.toLocaleString(),
      change: overview.dispatchedTrucks.change,
      trend: overview.dispatchedTrucks.trend,
      icon: Truck,
      color: "text-orange-600",
      subtitle: `${overview.dispatchedTrucks.inUse} in use`,
    },
    {
      title: "Completed Collections",
      value: overview.completedCollections.value.toLocaleString(),
      change: overview.completedCollections.change,
      trend: overview.completedCollections.trend,
      icon: CheckCircle,
      color: "text-green-600",
    },
  ];

  // Prepare weekly activity data
  const weeklyData = data.weeklyActivity.reports.map((report, index) => ({
    day: report.day,
    reports: report.count,
    collections: data.weeklyActivity.collections[index]?.count || 0,
  }));

  // Format time for recent alerts
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's your system overview.
          <AdminReportGenerator/>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <p
                  className={`text-xs flex items-center gap-1 ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stat.change} from last month
                </p>
              </div>
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.subtitle}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {overview.avgResponseTime.toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Report to dispatch time
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Collection Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {overview.collectionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully collected
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Points Awarded
            </CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {overview.totalPointsAwarded.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ecosystem rewards
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Line Chart - Weekly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>
              Reports and collections over the last week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="reports"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    name="Reports"
                  />
                  <Line
                    type="monotone"
                    dataKey="collections"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2}
                    name="Collections"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Waste Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Waste Type Distribution</CardTitle>
            <CardDescription>
              Breakdown of reported waste categories
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.wasteTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    dataKey="value"
                  >
                    {data.wasteTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdowns */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Waste Status */}
        <Card>
          <CardHeader>
            <CardTitle>Waste Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.wasteStatus.map((status) => (
                <div
                  key={status.status}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm capitalize">
                    {status.status.replace(/_/g, " ")}
                  </span>
                  <Badge variant="secondary">{status.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dispatch Status */}
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.dispatchStatus.map((status) => (
                <div
                  key={status.status}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm capitalize">
                    {status.status.replace(/_/g, " ")}
                  </span>
                  <Badge variant="secondary">{status.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Truck Status */}
        <Card>
          <CardHeader>
            <CardTitle>Truck Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.truckStatus.map((status) => (
                <div
                  key={status.status}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="text-sm capitalize">
                    {status.status.replace(/_/g, " ")}
                  </span>
                  <Badge variant="secondary">{status.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
          <CardDescription>Top performing collection teams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.teamPerformance.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="teamName" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalDispatches"
                  fill={CHART_COLORS.primary}
                  name="Dispatches"
                />
                <Bar
                  dataKey="memberCount"
                  fill={CHART_COLORS.secondary}
                  name="Members"
                />
                <Bar
                  dataKey="truckCount"
                  fill={CHART_COLORS.warning}
                  name="Trucks"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts & Location Hotspots */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentAlerts.length > 0 ? (
                data.recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {alert.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {alert.issue}
                      </p>
                      {alert.reporter && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reported by: {alert.reporter}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(alert.time)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No recent alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Hotspots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Location Hotspots
            </CardTitle>
            <CardDescription>
              Areas with multiple reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.locationHotspots.length > 0 ? (
                data.locationHotspots.map((spot) => (
                  <div
                    key={spot.location}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {spot.location}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {spot.reportCount} reports
                        {spot.category && (
                          <span className="ml-2 capitalize">
                            • {spot.category}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(spot.lastReport)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No hotspots detected
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
          <CardDescription>Users with highest impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topUsers.slice(0, 10).map((user, index) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-eco-primary text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <img
                    src={
                      user.profileImage ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt={user.name || "User"}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-sm">
                      {user.name || user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.reportCount} reports
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-eco-primary">
                    {user.points.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}