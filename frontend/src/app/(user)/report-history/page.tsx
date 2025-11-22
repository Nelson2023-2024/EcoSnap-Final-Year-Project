"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Calendar,
  Eye,
  Search,
  Filter,
  LoaderIcon,
} from "lucide-react";
import { useWasteAnalysisHistoryInfinite } from "@/hooks/useWasteAnalysis";
import { useEffect, useRef } from "react";

const ReportHistory = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useWasteAnalysisHistoryInfinite(10);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Flatten all pages into single reports array
  const reports = data?.pages.flatMap((page) => page.data) ?? [];
  const totalReports = data?.pages[0]?.total ?? 0;
  const completedReports = reports.filter(
    (r) => r.status === "collected"
  ).length;
  const pendingReports = reports.filter(
    (r) => r.status === "pending_dispatch" || r.status === "dispatched"
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "collected":
        return "bg-eco-success/20 text-eco-success border-eco-success/30";
      case "dispatched":
        return "bg-warning/10 text-warning border-warning/20";
      case "pending_dispatch":
        return "bg-muted text-muted-foreground border-border";
      case "no_waste":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30";
      case "error":
        return "bg-red-500/20 text-red-600 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      collected: "Collected",
      dispatched: "In Progress",
      pending_dispatch: "Pending",
      no_waste: "No Waste",
      error: "Error",
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="h-8 w-8 animate-spin text-eco-primary" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Failed to load reports. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="rounded-lg bg-gradient-to-r from-eco-primary to-eco-success p-6 text-white shadow-lg flex-1">
              <h1 className="text-3xl font-bold">Report History</h1>
              <p className="mt-2 text-white/90">
                Track all your waste reports and their collection status
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                className="pl-9 focus:border-eco-primary focus:ring-eco-primary"
              />
            </div>
            <Button
              variant="outline"
              className="border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Stats Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalReports}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-eco-primary">
                  {completedReports}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {pendingReports}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          {reports.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No reports found. Start by submitting your first waste report!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card
                  key={report._id}
                  className="border-border transition-all hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 md:flex-row">
                      {/* Image */}
                      <div className="h-32 w-full overflow-hidden rounded-lg border-2 border-eco-primary/20 md:h-24 md:w-32">
                        <img
                          src={report.imageURL}
                          alt={report.location.address}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-foreground text-lg">
                                {report.dominantWasteType || "Waste Report"}
                              </h3>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4 text-eco-primary" />
                                  <span>{report.location.address}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-eco-primary" />
                                  <span>{formatDate(report.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <Badge className={getStatusColor(report.status)}>
                              {formatStatus(report.status)}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {report.wasteCategories.map((category, index) => (
                              <Badge
                                key={`${category.type ?? "unknown"}-${
                                  category.estimatedPercentage ?? "0"
                                }-${index}`}
                                variant="outline"
                                className="text-xs border-eco-primary/30 text-eco-primary"
                              >
                                {category.type || "Unknown"} (
                                {category.estimatedPercentage ?? 0}%)
                              </Badge>
                            ))}
                          </div>

                          {report.estimatedVolume && (
                            <div className="text-sm text-muted-foreground">
                              Est. Volume: {report.estimatedVolume.value}{" "}
                              {report.estimatedVolume.unit}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Confidence:{" "}
                            </span>
                            <span className="font-semibold text-eco-primary capitalize">
                              {report.confidenceLevel}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Infinite Scroll Trigger */}
              <div ref={observerTarget} className="flex justify-center py-4">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LoaderIcon className="h-5 w-5 animate-spin" />
                    <span>Loading more reports...</span>
                  </div>
                )}
                {!hasNextPage && reports.length > 0 && (
                  <p className="text-muted-foreground">
                    No more reports to load
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportHistory;
