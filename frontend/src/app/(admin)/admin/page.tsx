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
} from "recharts";
import {
  FileText,
  Users,
  Truck,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const statsData = [
  {
    title: "Total Reports",
    value: "1,247",
    change: "+12.3%",
    icon: FileText,
    color: "text-primary",
  },
  {
    title: "Active Users",
    value: "8,432",
    change: "+8.1%",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Dispatched Trucks",
    value: "156",
    change: "+5.2%",
    icon: Truck,
    color: "text-orange-600",
  },
  {
    title: "Completed Collections",
    value: "1,089",
    change: "+15.7%",
    icon: CheckCircle,
    color: "text-success",
  },
];

const weeklyData = [
  { day: "Mon", reports: 45, collections: 38 },
  { day: "Tue", reports: 52, collections: 45 },
  { day: "Wed", reports: 61, collections: 52 },
  { day: "Thu", reports: 48, collections: 41 },
  { day: "Fri", reports: 70, collections: 58 },
  { day: "Sat", reports: 38, collections: 30 },
  { day: "Sun", reports: 25, collections: 18 },
];

const wasteTypeData = [
  { name: "PET Plastic", value: 320, color: "#22c55e" },
  { name: "HDPE", value: 180, color: "#3b82f6" },
  { name: "Glass", value: 240, color: "#f59e0b" },
  { name: "E-waste", value: 150, color: "#ef4444" },
  { name: "Textiles", value: 120, color: "#8b5cf6" },
  { name: "Others", value: 237, color: "#6b7280" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's your system overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-success flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Line Chart */}
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="reports"
                    stroke="#16a34a"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="collections"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
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
                    data={wasteTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    dataKey="value"
                  >
                    {wasteTypeData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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
            {[
              {
                location: "Downtown Market",
                issue: "High e-waste concentration detected",
                time: "2 hours ago",
              },
              {
                location: "River Park",
                issue: "Multiple reports from same location",
                time: "5 hours ago",
              },
              {
                location: "Industrial Zone",
                issue: "Hazardous material flagged",
                time: "1 day ago",
              },
            ].map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.location}</p>
                  <p className="text-sm text-muted-foreground">{alert.issue}</p>
                </div>
                <span className="text-xs text-muted-foreground">{alert.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
