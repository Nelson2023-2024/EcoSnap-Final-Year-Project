"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, History, Trophy, Leaf, TrendingUp, MapPin } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

const UserDashboard = () => {
  const userStats = [
    { id: 1, title: "Total Reports", value: 12, subtitle: "+2 from last month", icon: <Upload className="h-4 w-4 text-muted-foreground" /> },
    { id: 2, title: "Eco Points", value: 450, subtitle: "50 points until next reward", icon: <Trophy className="h-4 w-4 text-warning" /> },
    { id: 3, title: "Items Redeemed", value: 3, subtitle: "Trees, bins & more", icon: <Leaf className="h-4 w-4 text-success" /> },
    { id: 4, title: "CO₂ Saved", value: "24.5 kg", subtitle: "Estimated impact", icon: <TrendingUp className="h-4 w-4 text-accent" /> },
  ];

  const quickActions = [
    { id: 1, title: "Report Waste", href: "/user-dashboard/report", icon: <Upload className="h-6 w-6" />, variant: "primary" },
    { id: 2, title: "Browse Rewards", href: "/user-dashboard/rewards", icon: <Leaf className="h-6 w-6" />, variant: "outline" },
  ];

  const recentReports = [
    { id: 1, date: "2024-01-15", status: "Collected", location: "Downtown Park" },
    { id: 2, date: "2024-01-14", status: "In Progress", location: "Main Street" },
    { id: 3, date: "2024-01-12", status: "Pending", location: "Beach Area" },
  ];

  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="rounded-lg bg-gradient-to-r from-eco-primary to-eco-success p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold">Your Impact Overview</h1>
            <p className="mt-2 text-white/90">
              Keep up the great work! Every report you make brings us closer to a cleaner, greener planet.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {userStats.map((stat) => (
              <Card key={stat.id} className="border-border transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>What would you like to do today?</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {quickActions.map((action) => (
                <Link key={action.id} href={action.href}>
                  <Button
                    variant={action.variant === "outline" ? "outline" : undefined}
                    className={`h-24 w-full ${
                      action.variant === "primary"
                        ? "bg-eco-primary text-primary-foreground hover:bg-eco-primary/90"
                        : "border-2 border-eco-primary hover:bg-eco-primary/70 hover:text-white"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {action.icon}
                      <span className={`text-lg font-semibold ${action.variant === "primary" ? "text-white" : ""}`}>{action.title}</span>
                    </div>
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent Reports */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Recent Reports</CardTitle>
                <CardDescription>Your latest waste reports and their status</CardDescription>
              </div>
              <Link href="/user-dashboard/history">
                <Button variant="outline" size="sm">
                  <History className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-all hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{report.location}</p>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        report.status === "Collected"
                          ? "bg-success/10 text-success"
                          : report.status === "In Progress"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {report.status}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress to Next Level */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Level Progress</CardTitle>
              <CardDescription>You're on your way to becoming an Eco Champion!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current: Eco Warrior</span>
                  <span className="font-medium text-foreground">Level 3</span>
                </div>
                <Progress value={65} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next: Eco Champion</span>
                  <span className="text-muted-foreground">35 points to go</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
