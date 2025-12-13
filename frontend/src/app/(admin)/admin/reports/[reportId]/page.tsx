// src/app/(admin)/admin/reports/[reportId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Calendar,
  Gauge,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ArrowLeft,
  LoaderIcon,
  Settings,
} from "lucide-react";
import { useWasteAnalysis } from "@/hooks/useWasteAnalysis";
import { useGetDispatch } from "@/hooks/useDispatch";
import { useCreateAutoDispatch, useCreateManualDispatch } from "@/hooks/useDispatch";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTeams } from "@/hooks/useTeams";
import { useTrucks } from "@/hooks/useTruck";

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.reportId as string;

  const { data: waste, isLoading: wasteLoading } = useWasteAnalysis(reportId);
  const { data: dispatch, isLoading: dispatchLoading } = useGetDispatch(
    waste?._id || ""
  );

  const { createAutoDispatch, isCreatingAutoDispatch } = useCreateAutoDispatch();
  const { createManualDispatch, isCreatingManualDispatch } = useCreateManualDispatch();
  const { data: teams } = useTeams();
  const { data: trucks } = useTrucks();

  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [scheduledDate, setScheduledDate] = useState("");

  const handleAutoDispatch = () => {
    if (waste?._id) {
      createAutoDispatch({ wasteAnalysisId: waste._id });
    }
  };

  const handleManualDispatch = () => {
    if (!waste?._id || !selectedTeam || !selectedTruck) {
      return;
    }

    createManualDispatch(
      {
        wasteAnalysisId: waste._id,
        teamId: selectedTeam,
        truckId: selectedTruck,
        priority: selectedPriority,
        scheduledDate: scheduledDate || undefined,
      },
      {
        onSuccess: () => {
          setIsManualDialogOpen(false);
          setSelectedTeam("");
          setSelectedTruck("");
          setSelectedPriority("normal");
          setScheduledDate("");
        },
      }
    );
  };

  // Filter trucks by selected team
  const availableTrucks = trucks?.filter((truck: any) => {
    if (!selectedTeam) return true;
    const team = teams?.find((t: any) => t._id === selectedTeam);
    return team?.team_trucks?.some((t: any) => t._id === truck._id || t === truck._id);
  });

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

  const getDispatchStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40";
      case "collected":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40";
      case "en_route":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40";
      case "assigned":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/40";
      case "cancelled":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/40";
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (wasteLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="h-8 w-8 animate-spin text-eco-primary" />
          <p className="text-muted-foreground">Loading report details...</p>
        </div>
      </div>
    );
  }

  if (!waste) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Failed to load report details. Please try again.
            </p>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reports
        </Button>

        {/* Header */}
        <div className="rounded-lg bg-gradient-to-r from-eco-primary to-eco-success p-6 text-white shadow-lg mb-6">
          <h1 className="text-3xl font-bold">Waste Report Details</h1>
          <p className="mt-2 text-white/90">
            Complete information about this waste report
          </p>
        </div>

        <div className="space-y-6">
          {/* Image */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Waste Image</h3>
              <div className="relative rounded-lg overflow-hidden border-2 border-eco-primary/20">
                <img
                  src={waste.imageURL}
                  alt="Waste"
                  className="w-full h-96 object-cover"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4"
                  onClick={() => window.open(waste.imageURL, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Full Size
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Status
                  </p>
                  <Badge className={getStatusColor(waste.status)}>
                    {waste.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Confidence Level
                  </p>
                  <p className="text-lg font-semibold text-eco-primary">
                    {waste.confidenceLevel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dispatch */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-eco-primary" />
                Dispatch Information
              </h3>

              {dispatchLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                  <span>Loading dispatch info...</span>
                </div>
              ) : dispatch ? (
                <div className="space-y-4 bg-muted p-4 rounded-lg">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge
                        className={getDispatchStatusColor(dispatch.dispatch_status)}
                      >
                        {dispatch.dispatch_status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Priority</p>
                      <Badge variant="outline">
                        {dispatch.dispatch_priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Assigned Team</p>
                    <p className="font-medium">
                      {typeof dispatch.dispatch_assignedTeam === "object"
                        ? dispatch.dispatch_assignedTeam.team_name
                        : "N/A"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Assigned Truck</p>
                    <p className="font-medium">
                      {typeof dispatch.dispatch_assignedTruck === "object"
                        ? dispatch.dispatch_assignedTruck.truck_registrationNumber
                        : "N/A"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Scheduled Date</p>
                    <p className="font-medium">
                      {formatDate(dispatch.dispatch_scheduledDate)}
                    </p>
                  </div>
                </div>
              ) : waste.status === "pending_dispatch" ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No dispatch assigned yet. Choose automatic or manual dispatch.
                  </p>

                  <div className="grid gap-3 md:grid-cols-2">
                    {/* Auto Dispatch Button */}
                    <Button
                      onClick={handleAutoDispatch}
                      disabled={isCreatingAutoDispatch}
                      className="w-full bg-eco-primary hover:bg-eco-primary/90"
                    >
                      {isCreatingAutoDispatch ? (
                        <>
                          <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 mr-2" />
                          Auto Dispatch
                        </>
                      )}
                    </Button>

                    {/* Manual Dispatch Dialog */}
                    <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Settings className="h-4 w-4 mr-2" />
                          Manual Dispatch
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Manual Dispatch Assignment</DialogTitle>
                          <DialogDescription>
                            Manually select team, truck, and schedule for this pickup.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          {/* Team Selection */}
                          <div className="space-y-2">
                            <Label htmlFor="team">Team *</Label>
                            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                              <SelectTrigger id="team">
                                <SelectValue placeholder="Select a team" />
                              </SelectTrigger>
                              <SelectContent>
                                {teams?.map((team: any) => (
                                  <SelectItem key={team._id} value={team._id}>
                                    {team.team_name} ({team.team_specialization})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Truck Selection */}
                          <div className="space-y-2">
                            <Label htmlFor="truck">Truck *</Label>
                            <Select
                              value={selectedTruck}
                              onValueChange={setSelectedTruck}
                              disabled={!selectedTeam}
                            >
                              <SelectTrigger id="truck">
                                <SelectValue placeholder="Select a truck" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableTrucks?.map((truck: any) => (
                                  <SelectItem key={truck._id} value={truck._id}>
                                    {truck.truck_registrationNumber} ({truck.truck_status})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Priority Selection */}
                          <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={selectedPriority} onValueChange={(v: any) => setSelectedPriority(v)}>
                              <SelectTrigger id="priority">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Scheduled Date */}
                          <div className="space-y-2">
                            <Label htmlFor="date">Scheduled Date (Optional)</Label>
                            <input
                              id="date"
                              type="datetime-local"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="w-full px-3 py-2 border rounded-md"
                            />
                          </div>

                          {/* Submit Button */}
                          <Button
                            onClick={handleManualDispatch}
                            disabled={
                              !selectedTeam ||
                              !selectedTruck ||
                              isCreatingManualDispatch
                            }
                            className="w-full bg-eco-primary hover:bg-eco-primary/90"
                          >
                            {isCreatingManualDispatch ? (
                              <>
                                <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                                Creating Dispatch...
                              </>
                            ) : (
                              <>
                                <Truck className="h-4 w-4 mr-2" />
                                Create Manual Dispatch
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No dispatch information available.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}