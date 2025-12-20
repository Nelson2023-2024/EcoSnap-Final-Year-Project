// frontend/src/app/(collector)/collector/team/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Truck,
  MapPin,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  UserCircle,
  TrendingUp,
  Package,
  Clock,
  Navigation,
  CheckCircle,
  Shield,
  Calendar,
} from "lucide-react";
import { useTeamAssignment, useCollectorStats } from "@/hooks/useCollector";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CollectorTeamPage = () => {
  const { data: teamData, isLoading: teamLoading, error: teamError } = useTeamAssignment();
  const { data: stats, isLoading: statsLoading } = useCollectorStats();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // Loading state
  if (teamLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-eco-primary mx-auto" />
              <p className="text-muted-foreground">Loading team information...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
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

  const teams = teamData?.teams ?? [];
  const summary = teamData?.summary;
  const primaryTeam = teamData?.primaryTeam;

  // Select primary team by default
  const currentTeam = selectedTeamId
    ? teams.find((t) => t.teamId === selectedTeamId) || primaryTeam
    : primaryTeam;

  const getSpecializationColor = (specialization: string) => {
    switch (specialization) {
      case "recyclables":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "e_waste":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "organic":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "hazardous":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-success/10 text-success border-success/20"
      : "bg-muted text-muted-foreground";
  };

  const getTruckStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-success/10 text-success border-success/20";
      case "in_use":
        return "bg-warning/10 text-warning border-warning/20";
      case "maintenance":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Team</h1>
              <p className="text-muted-foreground mt-1">
                View your team members, trucks, and performance
              </p>
            </div>
            {summary && summary.totalTeams > 1 && (
              <Badge variant="outline" className="text-sm px-3 py-1 w-fit">
                <Users className="h-3 w-3 mr-1" />
                Member of {summary.totalTeams} teams
              </Badge>
            )}
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Teams
                  </CardTitle>
                  <Users className="h-4 w-4 text-eco-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-eco-primary">
                    {summary.totalTeams}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active assignments
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Trucks
                  </CardTitle>
                  <Truck className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {summary.totalTrucks}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all teams
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Available Now
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {summary.availableTrucks}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ready for dispatch
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Team Members
                  </CardTitle>
                  <UserCircle className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">
                    {summary.totalMembers}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total collectors
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Team Selector - Only show if multiple teams */}
          {teams.length > 1 && (
            <Card className="border-eco-primary/50">
              <CardHeader>
                <CardTitle className="text-sm">Select Team to View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {teams.map((team) => (
                    <button
                      key={team.teamId}
                      onClick={() => setSelectedTeamId(team.teamId)}
                      className={`p-4 rounded-lg border-2 transition-all text-left hover:shadow-md ${
                        currentTeam?.teamId === team.teamId
                          ? "border-eco-primary bg-eco-primary/5"
                          : "border-border hover:border-eco-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{team.teamName}</p>
                          <Badge
                            variant="outline"
                            className={`${getSpecializationColor(
                              team.specialization
                            )} mt-1 text-xs`}
                          >
                            {team.specialization}
                          </Badge>
                        </div>
                        {currentTeam?.teamId === team.teamId && (
                          <CheckCircle className="h-5 w-5 text-eco-primary flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{team.trucksCount} trucks</span>
                        <span>•</span>
                        <span>{team.membersCount} members</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Team Details */}
          {currentTeam && (
            <>
              {/* Team Header */}
              <Card className="border-eco-primary/50 bg-gradient-to-r from-eco-primary/5 to-eco-success/5">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-eco-primary flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{currentTeam.teamName}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={getSpecializationColor(currentTeam.specialization)}
                            >
                              {currentTeam.specialization}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={getStatusColor(currentTeam.status)}
                            >
                              {currentTeam.status}
                            </Badge>
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-eco-primary">
                          {currentTeam.trucksCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Trucks</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-success">
                          {currentTeam.availableTrucks}
                        </p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-warning">
                          {currentTeam.membersCount}
                        </p>
                        <p className="text-xs text-muted-foreground">Members</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Tabs for Members and Trucks */}
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="members" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Team Members ({currentTeam.membersCount})
                  </TabsTrigger>
                  <TabsTrigger value="trucks" className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Fleet ({currentTeam.trucksCount})
                  </TabsTrigger>
                </TabsList>

                {/* Team Members Tab */}
                <TabsContent value="members" className="mt-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {currentTeam.members.map((member) => (
                      <Card
                        key={member.userId}
                        className="border-border hover:shadow-md transition-all"
                      >
                        <CardHeader>
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={member.profileImage} />
                              <AvatarFallback className="bg-eco-primary text-white text-lg">
                                {member.fullName?.charAt(0) ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">
                                {member.fullName}
                              </CardTitle>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {member.role === "collector" && (
                                  <>
                                    <Truck className="h-3 w-3 mr-1" />
                                    Collector
                                  </>
                                )}
                                {member.role === "admin" && (
                                  <>
                                    <Shield className="h-3 w-3 mr-1" />
                                    Admin
                                  </>
                                )}
                                {member.role === "user" && (
                                  <>
                                    <UserCircle className="h-3 w-3 mr-1" />
                                    User
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate text-muted-foreground">
                              {member.email}
                            </span>
                          </div>
                          {member.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">
                                {member.phoneNumber}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Trucks Tab */}
                <TabsContent value="trucks" className="mt-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {currentTeam.trucks.map((truck) => (
                      <Card
                        key={truck.truck_id}
                        className="border-border hover:shadow-md transition-all"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base">
                                {truck.truck_registrationNumber}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {truck.truck_truckType}
                              </CardDescription>
                            </div>
                            <Badge
                              variant="outline"
                              className={getTruckStatusColor(truck.truck_status)}
                            >
                              {truck.truck_status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Truck Image */}
                          {truck.truck_imageURL && (
                            <div className="relative h-32 w-full rounded-lg overflow-hidden bg-muted">
                              <img
                                src={truck.truck_imageURL}
                                alt={truck.truck_registrationNumber}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}

                          {/* Truck Details */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Capacity
                              </span>
                              <span className="font-medium">
                                {truck.truck_capacity.toLocaleString()} kg
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Location
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => {
                                  window.open(
                                    `https://www.google.com/maps?q=${truck.truck_locationLatitude},${truck.truck_locationLongitude}`,
                                    "_blank"
                                  );
                                }}
                              >
                                View Map
                              </Button>
                            </div>
                          </div>

                          {/* Status Indicator */}
                          <div className="pt-3 border-t border-border">
                            <div className="flex items-center gap-2">
                              {truck.truck_status === "available" && (
                                <>
                                  <CheckCircle className="h-4 w-4 text-success" />
                                  <span className="text-sm text-success font-medium">
                                    Ready for dispatch
                                  </span>
                                </>
                              )}
                              {truck.truck_status === "in_use" && (
                                <>
                                  <Navigation className="h-4 w-4 text-warning" />
                                  <span className="text-sm text-warning font-medium">
                                    Currently collecting
                                  </span>
                                </>
                              )}
                              {truck.truck_status === "maintenance" && (
                                <>
                                  <Clock className="h-4 w-4 text-destructive" />
                                  <span className="text-sm text-destructive font-medium">
                                    Under maintenance
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {currentTeam.trucks.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">No trucks assigned</p>
                        <p className="text-sm text-muted-foreground">
                          This team doesn't have any trucks assigned yet.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* Performance Stats */}
          {stats && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-eco-primary" />
                  Your Performance
                </CardTitle>
                <CardDescription>
                  Statistics across all your teams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.pendingDispatches}</p>
                      <p className="text-sm text-muted-foreground">Pending Tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Navigation className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.enRouteDispatches}</p>
                      <p className="text-sm text-muted-foreground">En Route</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.completedDispatches}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
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

export default CollectorTeamPage;