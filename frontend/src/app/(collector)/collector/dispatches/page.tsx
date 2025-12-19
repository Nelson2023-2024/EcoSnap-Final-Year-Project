// frontend/src/app/(collector)/collector/dispatches/page.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Truck,
  Calendar,
  Loader2,
  Package,
  Navigation,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  MapPinned,
} from "lucide-react";
import Link from "next/link";
import { useCollectorDispatches } from "@/hooks/useCollector";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AllDispatchesPage = () => {
  const [selectedTab, setSelectedTab] = useState<string>("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 12;

  const { data: dispatchesData, isLoading } = useCollectorDispatches(
    selectedTab === "all" ? undefined : selectedTab,
    currentPage,
    limit
  );

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
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned":
        return <Clock className="h-4 w-4" />;
      case "en_route":
        return <Navigation className="h-4 w-4" />;
      case "collected":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const formatScheduledDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const dispatches = dispatchesData?.data ?? [];
  const summary = dispatchesData?.summary ?? {};
  const totalPages = dispatchesData?.totalPages ?? 1;
  const total = dispatchesData?.total ?? 0;

  // Filter dispatches by search query
  const filteredDispatches = dispatches.filter((dispatch) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dispatch.dispatch_wasteAnalysis.waste_dominantWasteType?.toLowerCase().includes(query) ||
      dispatch.dispatch_locationAddress?.toLowerCase().includes(query) ||
      dispatch.dispatch_assignedTruck.truck_registrationNumber?.toLowerCase().includes(query) ||
      dispatch.dispatch_wasteAnalysis.waste_user.user_fullName?.toLowerCase().includes(query)
    );
  });

  const tabs = [
    {
      value: "active",
      label: "Active",
      count: (summary.assigned ?? 0) + (summary.en_route ?? 0),
      icon: <Navigation className="h-4 w-4" />,
      description: "Tasks in progress",
    },
    {
      value: "assigned",
      label: "Assigned",
      count: summary.assigned ?? 0,
      icon: <Clock className="h-4 w-4" />,
      description: "Waiting to start",
    },
    {
      value: "en_route",
      label: "En Route",
      count: summary.en_route ?? 0,
      icon: <Navigation className="h-4 w-4" />,
      description: "Currently collecting",
    },
    {
      value: "collected",
      label: "Collected",
      count: summary.collected ?? 0,
      icon: <CheckCircle className="h-4 w-4" />,
      description: "Completed today",
    },
    {
      value: "all",
      label: "All",
      count: Object.values(summary).reduce((a: number, b: number) => a + b, 0),
      icon: <Package className="h-4 w-4" />,
      description: "All dispatches",
    },
  ];

  const currentTab = tabs.find((t) => t.value === selectedTab);

  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Active Tasks</h1>
              <p className="text-muted-foreground mt-1">
                Manage your waste collection dispatches
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm px-3 py-1">
                <Package className="h-3 w-3 mr-1" />
                {total} Total
              </Badge>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by location, waste type, truck, or reporter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs Filter */}
          <Tabs
            value={selectedTab}
            onValueChange={(value) => {
              setSelectedTab(value);
              setCurrentPage(1); // Reset to page 1 when changing tabs
            }}
          >
            <TabsList className="grid w-full grid-cols-5 h-auto">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-eco-primary data-[state=active]:text-white"
                >
                  <div className="flex items-center gap-2">
                    {tab.icon}
                    <span className="hidden sm:inline font-medium">{tab.label}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="mt-1 data-[state=active]:bg-white/20 data-[state=active]:text-white"
                  >
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Current Tab Info */}
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-eco-primary/10 flex items-center justify-center">
                    {currentTab?.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{currentTab?.label} Dispatches</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentTab?.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-eco-primary">
                    {currentTab?.count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {filteredDispatches.length !== currentTab?.count &&
                      `${filteredDispatches.length} filtered`}
                  </p>
                </div>
              </div>
            </div>

            <TabsContent value={selectedTab} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-eco-primary mx-auto" />
                    <p className="text-muted-foreground">Loading dispatches...</p>
                  </div>
                </div>
              ) : filteredDispatches.length > 0 ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredDispatches.map((dispatch) => (
                      <Link
                        key={dispatch.dispatch_id}
                        href={`/collector/dispatch/${dispatch.dispatch_id}`}
                      >
                        <Card className="border-border transition-all hover:shadow-lg cursor-pointer hover:border-eco-primary/50 h-full">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base truncate">
                                  {dispatch.dispatch_wasteAnalysis.waste_dominantWasteType}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {dispatch.dispatch_locationAddress?.split(",")[0]}
                                  </span>
                                </CardDescription>
                              </div>
                              <Badge
                                variant="outline"
                                className={`${getPriorityColor(
                                  dispatch.dispatch_priority
                                )} flex-shrink-0`}
                              >
                                {dispatch.dispatch_priority}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Waste Image */}
                            <div className="relative h-32 w-full rounded-lg overflow-hidden bg-muted">
                              <img
                                src={dispatch.dispatch_wasteAnalysis.waste_imageURL}
                                alt="Waste"
                                className="h-full w-full object-cover"
                              />
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(
                                  dispatch.dispatch_status
                                )} absolute top-2 right-2 backdrop-blur-sm`}
                              >
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(dispatch.dispatch_status)}
                                  <span className="text-xs">
                                    {dispatch.dispatch_status.replace("_", " ")}
                                  </span>
                                </div>
                              </Badge>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Scheduled
                                </span>
                                <span className="font-medium">
                                  {formatScheduledDate(dispatch.dispatch_scheduledDate)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Truck className="h-3 w-3" />
                                  Truck
                                </span>
                                <span className="font-medium">
                                  {dispatch.dispatch_assignedTruck.truck_registrationNumber}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  Category
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {dispatch.dispatch_wasteAnalysis.waste_overallCategory}
                                </Badge>
                              </div>
                            </div>

                            {/* Reporter */}
                            <div className="pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                Reported by{" "}
                                <span className="font-medium text-foreground">
                                  {dispatch.dispatch_wasteAnalysis.waste_user.user_fullName}
                                </span>
                              </p>
                            </div>

                            {/* Action Hint */}
                            <Button
                              className="w-full bg-eco-primary hover:bg-eco-primary/90"
                              size="sm"
                            >
                              {dispatch.dispatch_status === "assigned" && "Start Collection"}
                              {dispatch.dispatch_status === "en_route" && "Complete Collection"}
                              {dispatch.dispatch_status === "collected" && "View Details"}
                              {!["assigned", "en_route", "collected"].includes(
                                dispatch.dispatch_status
                              ) && "View Details"}
                            </Button>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 p-4 bg-muted/50 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} • Showing{" "}
                        {filteredDispatches.length} of {total} dispatches
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-medium mb-2">
                          No {selectedTab} dispatches found
                        </p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {selectedTab === "active" &&
                            "No active tasks at the moment. Check back later for new assignments."}
                          {selectedTab === "assigned" &&
                            "No tasks waiting to be started. All caught up!"}
                          {selectedTab === "en_route" &&
                            "No tasks currently in progress. Start an assigned task to see it here."}
                          {selectedTab === "collected" &&
                            "No completed collections yet. Complete a dispatch to see it here."}
                          {selectedTab === "all" &&
                            "No dispatches available for your team."}
                          {searchQuery &&
                            " Try adjusting your search criteria."}
                        </p>
                      </div>
                      {searchQuery && (
                        <Button
                          variant="outline"
                          onClick={() => setSearchQuery("")}
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AllDispatchesPage;