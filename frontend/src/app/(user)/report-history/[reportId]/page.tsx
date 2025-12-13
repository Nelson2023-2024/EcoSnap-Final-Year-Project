"use client";

import { use } from "react";
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

const ReportDetailPage = ({ params }: ReportDetailPageProps) => {
  const router = useRouter();
  const { reportId } = use(params);

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
    return map[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
          <p className="text-muted-foreground">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load report details.</p>
            <Button
              onClick={() => router.push("/report-history")}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <Button
          variant="ghost"
          className="mb-6 hover:bg-eco-primary/10"
          onClick={() => router.push("/report-history")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>

        <div className="space-y-6">
          {/* HEADER */}
          <Card className="border-eco-primary/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {report.dominantWasteType || "Waste Report"}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-eco-primary" />
                      <span>{report.location.address}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-eco-primary" />
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <Badge
                  className={`${getStatusColor(
                    report.status
                  )} text-lg px-4 py-2`}
                >
                  {formatStatus(report.status)}
                </Badge>
              </div>

              {/* Coordinates */}
              <div className="mt-4 p-3 bg-eco-primary/5 rounded-lg text-sm space-y-2">
                <p className="text-muted-foreground">
                  <span className="font-semibold">Coordinates:</span>{" "}
                  {report.location.coordinates[1]},{" "}
                  {report.location.coordinates[0]}
                </p>

                {/* GOOGLE MAP LINK */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${report.location.coordinates[1]},${report.location.coordinates[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-eco-primary underline hover:text-eco-primary/80"
                >
                  Open in Google Maps →
                </a>
              </div>
            </CardContent>
          </Card>

          {/* IMAGE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-eco-primary" />
                Waste Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border-2 border-eco-primary/20">
                <img
                  src={report.imageURL}
                  alt="Waste"
                  className="w-full h-auto max-h-96 object-contain bg-muted"
                />
              </div>
            </CardContent>
          </Card>

          {/* WASTE CATEGORIES */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Recycle className="h-5 w-5 text-eco-primary" />
                Waste Categories Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.wasteCategories.map((category, i) => (
                  <div
                    key={`${category.type}-${i}`}
                    className="p-4 border border-eco-primary/20 rounded-lg hover:bg-eco-primary/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{category.type}</h3>
                      <Badge
                        variant="outline"
                        className="text-eco-primary border-eco-primary"
                      >
                        {category.estimatedPercentage ?? 0}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* VOLUME + CONFIDENCE */}
          <div className="grid md:grid-cols-2 gap-6">
            {report.estimatedVolume && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-eco-primary" />
                    Estimated Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-eco-primary">
                    {report.estimatedVolume.value} {report.estimatedVolume.unit}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-eco-primary" />
                  Analysis Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-eco-primary">
                  {report.confidenceLevel}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* POSSIBLE SOURCE */}
          {report.possibleSource && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-eco-primary" />
                  Possible Source (AI Inference)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {report.possibleSource}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ENVIRONMENTAL IMPACT */}
          {report.environmentalImpact && (
            <Card>
              <CardHeader>
                <CardTitle>Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {report.environmentalImpact}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportDetailPage;
