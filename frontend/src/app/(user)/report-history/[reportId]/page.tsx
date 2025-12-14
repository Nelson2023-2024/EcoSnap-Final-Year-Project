"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  MapPin,
  Calendar,
  ArrowLeft,
  LoaderIcon,
  Package,
  AlertCircle,
  TrendingUp,
  Recycle,
} from "lucide-react";

import { useWasteAnalysis } from "@/hooks/useWasteAnalysis";

interface ReportDetailPageProps {
  params: Promise<{ reportId: string }>;
}

export default function ReportDetailPage({ params }: ReportDetailPageProps) {
  const router = useRouter();

  // ✅ Correct way to unwrap params in Next 15/16
  const { reportId } = React.use(params);

  const { data: report, isLoading, isError } = useWasteAnalysis(reportId);

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
    const map: Record<string, string> = {
      collected: "Collected",
      dispatched: "In Progress",
      pending_dispatch: "Pending",
      no_waste: "No Waste",
      error: "Error",
    };
    return map[status] ?? status;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ---------------- LOADING ----------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="h-8 w-8 animate-spin text-eco-primary" />
          <p className="text-muted-foreground">Loading report details...</p>
        </div>
      </div>
    );
  }

  // ---------------- ERROR ----------------
  if (isError || !report) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">
              Failed to load report details.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/report-history")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------- PAGE ----------------
  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/report-history")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>

        {/* HEADER */}
        <Card className="border-eco-primary/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">
                  {report.waste_dominantWasteType ?? "Waste Report"}
                </h1>

                <div className="flex flex-wrap gap-4 text-muted-foreground mt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-eco-primary" />
                    {report.waste_locationAddress ?? "Location not specified"}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-eco-primary" />
                    {formatDate(report.waste_createdAt)}
                  </div>
                </div>
              </div>

              <Badge
                className={`${getStatusColor(report.waste_status)} px-4 py-2 text-lg`}
              >
                {formatStatus(report.waste_status)}
              </Badge>
            </div>

            {/* LOCATION */}
            <div className="p-3 bg-eco-primary/5 rounded-lg text-sm">
              <p>
                <strong>Coordinates:</strong>{" "}
                {report.waste_locationLatitude.toFixed(6)},{" "}
                {report.waste_locationLongitude.toFixed(6)}
              </p>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${report.waste_locationLatitude},${report.waste_locationLongitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-eco-primary underline"
              >
                Open in Google Maps →
              </a>
            </div>
          </CardContent>
        </Card>

        {/* IMAGE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <Package className="h-5 w-5 text-eco-primary" />
              Waste Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <img
              src={report.waste_imageURL}
              alt="Waste"
              className="w-full max-h-96 object-contain rounded-lg border"
            />
          </CardContent>
        </Card>

        {/* WASTE CATEGORIES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <Recycle className="h-5 w-5 text-eco-primary" />
              Waste Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.waste_wasteCategories.map((c) => (
              <div
                key={c.id}
                className="p-3 border rounded-lg flex justify-between"
              >
                <span>{c.waste_type}</span>
                <Badge variant="outline">{c.waste_estimatedPercentage}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* METRICS */}
        <div className="grid md:grid-cols-2 gap-6">
          {report.waste_estimatedVolumeValue && (
            <Card>
              <CardHeader>
                <CardTitle className="flex gap-2">
                  <TrendingUp className="h-5 w-5 text-eco-primary" />
                  Estimated Volume
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-bold text-eco-primary">
                {report.waste_estimatedVolumeValue}{" "}
                {report.waste_estimatedVolumeUnit}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Analysis Confidence</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold text-eco-primary">
              {report.waste_confidenceLevel ?? "N/A"}
            </CardContent>
          </Card>
        </div>

        {/* SOURCE */}
        {report.waste_possibleSource && (
          <Card>
            <CardHeader>
              <CardTitle>Possible Source (AI)</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground whitespace-pre-line">
              {report.waste_possibleSource}
            </CardContent>
          </Card>
        )}

        {/* IMPACT */}
        {report.waste_environmentalImpact && (
          <Card>
            <CardHeader>
              <CardTitle>Environmental Impact</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground whitespace-pre-line">
              {report.waste_environmentalImpact}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
