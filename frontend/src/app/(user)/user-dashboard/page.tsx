"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, History, Trophy, Leaf, MapPin, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { useUserDashboard } from "@/hooks/useUserDashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";

const UserDashboard = () => {
  const { data: dashboardData, isLoading, error } = useUserDashboard();

  const quickActions = [
    { 
      id: 1, 
      title: "Report Waste", 
      href: "/report", 
      icon: <Upload className="h-6 w-6" />, 
      variant: "primary" 
    },
    { 
      id: 2, 
      title: "Browse Rewards", 
      href: "/rewards", 
      icon: <Leaf className="h-6 w-6" />, 
      variant: "outline" 
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-eco-primary mx-auto" />
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load dashboard data. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  // Prepare stats with data or defaults
  const userStats = [
    { 
      id: 1, 
      title: "Total Reports", 
      value: dashboardData?.stats.totalReports.value ?? 0, 
      subtitle: dashboardData?.stats.totalReports.subtitle ?? "No reports yet", 
      icon: <Upload className="h-4 w-4 text-muted-foreground" /> 
    },
    { 
      id: 2, 
      title: "Eco Points", 
      value: dashboardData?.stats.ecoPoints.value ?? 0, 
      subtitle: dashboardData?.stats.ecoPoints.subtitle ?? "Start earning points", 
      icon: <Trophy className="h-4 w-4 text-warning" /> 
    },
    { 
      id: 3, 
      title: "Items Redeemed", 
      value: dashboardData?.stats.itemsRedeemed.value ?? 0, 
      subtitle: dashboardData?.stats.itemsRedeemed.subtitle ?? "Redeemed rewards", 
      icon: <Leaf className="h-4 w-4 text-success" /> 
    },
  ];

  const recentReports = dashboardData?.recentReports ?? [];
  const levelProgress = dashboardData?.levelProgress;

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {userStats.map((stat) => (
              <Card key={stat.id} className="border-border transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
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
                      <span className={`text-lg font-semibold ${action.variant === "primary" ? "text-white" : ""}`}>
                        {action.title}
                      </span>
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
              <Link href="/report-history">
                <Button variant="outline" size="sm">
                  <History className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentReports.length > 0 ? (
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
                          <p className="text-sm text-muted-foreground">
                            {report.date} • {report.wasteType}
                          </p>
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
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No reports yet. Start by reporting your first waste!</p>
                  <Link href="/report">
                    <Button className="mt-4 bg-eco-primary hover:bg-eco-primary/90">
                      <Upload className="mr-2 h-4 w-4" />
                      Report Waste
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress to Next Level */}
          {levelProgress && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Level Progress</CardTitle>
                <CardDescription>
                  {levelProgress.level === 5
                    ? "You've reached the maximum level!"
                    : "You're on your way to becoming an Eco Champion!"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Current: {levelProgress.currentLevel}
                    </span>
                    <span className="font-medium text-foreground">
                      Level {levelProgress.level}
                    </span>
                  </div>
                  <Progress value={levelProgress.progress} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Next: {levelProgress.nextLevel}
                    </span>
                    <span className="text-muted-foreground">
                      {levelProgress.pointsToNextLevel} points to go
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;