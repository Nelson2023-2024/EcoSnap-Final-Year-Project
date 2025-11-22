"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoaderIcon, Eye, MapPin } from "lucide-react";
import { useAdminWasteReportsInfinite } from "@/hooks/useWasteAnalysis";

const AdminWasteReports = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useAdminWasteReportsInfinite(10);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite Scroll
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
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Flatten pages → list
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
      return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40";
    
    case "dispatched":
      return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40";
    
    case "pending_dispatch":
      return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40";
    
    case "no_waste":
      return "bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-500/40";
    
    case "error":
      return "bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/40";
    
    default:
      return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/40";
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
      hour: "2-digit",
      minute: "2-digit",
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
          <div className="rounded-lg bg-gradient-to-r from-eco-primary to-eco-success p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold">Admin - All Waste Reports</h1>
            <p className="mt-2 text-white/90">
              Manage and monitor all waste reports from users
            </p>
          </div>

          {/* Stats */}
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
                <div className="text-2xl font-bold text-eco-success">
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

          {/* TABLE */}
          <Card className="border-border">
            <CardContent className="p-0">
              {reports.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">No reports found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="w-24">Image</TableHead>
                        <TableHead>Waste Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {reports.map((report) => (
                        <TableRow
                          key={`${report._id}-${report.createdAt}`}
                          className="border-border hover:bg-muted/50"
                        >
                          {/* IMAGE */}
                          <TableCell>
                            <div
                              className="h-16 w-16 overflow-hidden rounded-lg border-2 border-eco-primary/20 cursor-pointer"
                              onClick={() =>
                                window.open(report.imageURL, "_blank")
                              }
                            >
                              <img
                                src={report.imageURL}
                                alt="Waste"
                                className="h-full w-full object-cover transition-transform hover:scale-110"
                              />
                            </div>
                          </TableCell>

                          {/* WASTE TYPE + CATEGORIES */}
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {report.dominantWasteType || "Mixed Waste"}
                              </p>

                              {report.wasteCategories?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {report.wasteCategories
                                    .slice(0, 2)
                                    .map((cat, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-xs border-eco-primary/30 text-eco-primary"
                                      >
                                        {cat.type} ({cat.estimatedPercentage}%)
                                      </Badge>
                                    ))}

                                  {report.wasteCategories.length > 2 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{report.wasteCategories.length - 2} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* LOCATION */}
                          <TableCell>
                            <div className="flex items-start gap-1 max-w-xs">
                              <MapPin className="h-4 w-4 text-eco-primary mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground line-clamp-2 font-bold">
                                {report.location?.address || "Unknown"}
                              </span>
                            </div>
                          </TableCell>

                          {/* VOLUME */}
                          <TableCell>
                            {report.estimatedVolume ? (
                              <span className="text-sm text-foreground">
                                {report.estimatedVolume.value}{" "}
                                {report.estimatedVolume.unit}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                N/A
                              </span>
                            )}
                          </TableCell>

                          {/* STATUS */}
                          <TableCell>
                            <Badge className={getStatusColor(report.status)}>
                              {formatStatus(report.status)}
                            </Badge>
                          </TableCell>

                          {/* CONFIDENCE */}
                          <TableCell>
                            <span className="text-sm font-medium text-eco-primary capitalize">
                              {report.confidenceLevel || "N/A"}
                            </span>
                          </TableCell>

                          {/* DATE */}
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(report.createdAt)}
                            </span>
                          </TableCell>

                          {/* ACTION */}
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white"
                              onClick={() =>
                                window.open(report.imageURL, "_blank")
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Infinite Scroll Trigger */}
                  <div
                    ref={observerTarget}
                    className="flex justify-center py-6 border-t border-border"
                  >
                    {isFetchingNextPage && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <LoaderIcon className="h-5 w-5 animate-spin" />
                        <span>Loading more reports...</span>
                      </div>
                    )}

                    {!hasNextPage && reports.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        All reports loaded ({reports.length} of {totalReports})
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminWasteReports;
