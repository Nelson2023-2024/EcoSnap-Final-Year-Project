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
import { 
  useGetDispatches, 
  useCreateAutoDispatch, 
  useCreateManualDispatch,
  useCanDispatch 
} from "@/hooks/useDispatch";
import { useState, useEffect } from "react";
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
import { toast } from "react-hot-toast";

export default function ReportDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.reportId as string;

  const { data: waste, isLoading: wasteLoading } = useWasteAnalysis(reportId);
  
  // Get all dispatches and filter for this waste report
  const { data: dispatchesData } = useGetDispatches({ page: 1, limit: 100 });
  const dispatch = dispatchesData?.data.find(
    (d) => d.dispatch_wasteAnalysisId === reportId
  );

  // Check if waste can be dispatched
  const { data: canDispatchData } = useCanDispatch(reportId);

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
    if (waste?.waste_id) {
      createAutoDispatch({ wasteAnalysisId: waste.waste_id });
    }
  };

  const handleManualDispatch = () => {
    if (!waste?.waste_id || !selectedTeam || !selectedTruck) {
      return;
    }

    createManualDispatch(
      {
        wasteAnalysisId: waste.waste_id,
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
    return truck.truck_assignedTeamId === selectedTeam;
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

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

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

  const canDispatch = canDispatchData?.canDispatch && waste.waste_status === "pending_dispatch";

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
                  src={waste.waste_imageURL}
                  alt="Waste"
                  className="w-full h-96 object-cover"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4"
                  onClick={() => window.open(waste.waste_imageURL, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Full Size
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Analysis Details</h3>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Status */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Status
                  </p>
                  <Badge className={getStatusColor(waste.waste_status)}>
                    {formatStatus(waste.waste_status)}
                  </Badge>
                </div>

                {/* Contains Waste */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Contains Waste</p>
                  <Badge variant={waste.waste_containsWaste ? "default" : "secondary"}>
                    {waste.waste_containsWaste ? "Yes ✓" : "No ✗"}
                  </Badge>
                </div>

                {/* Confidence Level */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Confidence Level
                  </p>
                  <p className="text-lg font-semibold text-eco-primary">
                    {waste.waste_confidenceLevel || "N/A"}
                  </p>
                </div>

                {/* Overall Category */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Overall Category</p>
                  <p className="text-lg font-semibold capitalize">
                    {waste.waste_overallCategory?.replace(/_/g, " ") || "General"}
                  </p>
                </div>

                {/* Dominant Waste Type */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Dominant Waste Type</p>
                  <p className="text-lg font-semibold">
                    {waste.waste_dominantWasteType || "Mixed Waste"}
                  </p>
                </div>

                {/* Estimated Volume */}
                {waste.waste_estimatedVolumeValue && waste.waste_estimatedVolumeUnit && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Estimated Volume</p>
                    <p className="text-lg font-semibold">
                      {waste.waste_estimatedVolumeValue} {waste.waste_estimatedVolumeUnit}
                    </p>
                  </div>
                )}

                {/* Waste Categories */}
                {waste.waste_wasteCategories && waste.waste_wasteCategories.length > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Waste Categories Breakdown</p>
                    <div className="flex flex-wrap gap-2">
                      {waste.waste_wasteCategories.map((cat) => (
                        <Badge key={cat.id} variant="outline" className="text-xs">
                          {cat.waste_type}: {cat.waste_estimatedPercentage}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </p>
                  <p className="text-base">{waste.waste_locationAddress || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {waste.waste_locationLatitude.toFixed(6)}, {waste.waste_locationLongitude.toFixed(6)}
                  </p>
                </div>

                {/* Reporter Information */}
                {waste.waste_user && (
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Reported By</p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{waste.waste_user.user_fullName || "Unknown User"}</p>
                      <p className="text-sm text-muted-foreground">{waste.waste_user.user_email}</p>
                      {waste.waste_user.user_phoneNumber && (
                        <p className="text-sm text-muted-foreground">{waste.waste_user.user_phoneNumber}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Possible Source */}
                {waste.waste_possibleSource && (
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Possible Source
                    </p>
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm text-amber-900 dark:text-amber-200">
                        {waste.waste_possibleSource}
                      </p>
                    </div>
                  </div>
                )}

                {/* Environmental Impact */}
                {waste.waste_environmentalImpact && (
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Environmental Impact
                    </p>
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-900 dark:text-red-200">
                        {waste.waste_environmentalImpact}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Message if any */}
                {waste.waste_errorMessage && (
                  <div className="space-y-2 md:col-span-2">
                    <p className="text-sm text-muted-foreground">Error Details</p>
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {waste.waste_errorMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="space-y-2 md:col-span-2 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Reported On
                      </p>
                      <p className="font-medium">{formatDate(waste.waste_createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Last Updated
                      </p>
                      <p className="font-medium">{formatDate(waste.waste_updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dispatch Section */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-eco-primary" />
                Dispatch Information
              </h3>

              {dispatch ? (
                <div className="space-y-4 bg-muted p-4 rounded-lg">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={getDispatchStatusColor(dispatch.dispatch_status)}>
                        {formatStatus(dispatch.dispatch_status)}
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
                      {dispatch.dispatch_assignedTeam?.team_name || "N/A"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Assigned Truck</p>
                    <p className="font-medium">
                      {dispatch.dispatch_assignedTruck?.truck_registrationNumber || "N/A"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Scheduled Date</p>
                    <p className="font-medium">
                      {formatDate(dispatch.dispatch_scheduledDate)}
                    </p>
                  </div>

                  {dispatch.dispatch_estimatedArrival && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                      <p className="font-medium">
                        {formatDate(dispatch.dispatch_estimatedArrival)}
                      </p>
                    </div>
                  )}

                  {dispatch.dispatch_actualCollectionDate && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Collection Date</p>
                      <p className="font-medium text-green-600">
                        {formatDate(dispatch.dispatch_actualCollectionDate)}
                      </p>
                    </div>
                  )}

                  {dispatch.dispatch_collectionNotes && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Collection Notes</p>
                      <p className="text-sm">{dispatch.dispatch_collectionNotes}</p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/dispatch`)}
                    className="w-full mt-4"
                  >
                    View in Dispatch Manager
                  </Button>
                </div>
              ) : canDispatch ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No dispatch assigned yet. Choose automatic or manual dispatch.
                  </p>

                  {!canDispatchData?.canDispatch && canDispatchData && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          {canDispatchData.message}
                        </p>
                        {canDispatchData.details && (
                          <p className="text-xs text-amber-700 mt-1">
                            {canDispatchData.details}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    {/* Auto Dispatch Button */}
                    <Button
                      onClick={handleAutoDispatch}
                      disabled={isCreatingAutoDispatch || !canDispatch}
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
                        <Button 
                          variant="outline" 
                          className="w-full"
                          disabled={!canDispatch}
                        >
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
                                  <SelectItem key={team.team_id} value={team.team_id}>
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
                                  <SelectItem key={truck.truck_id} value={truck.truck_id}>
                                    {truck.truck_registrationNumber} - {truck.truck_status}
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
                  This waste report cannot be dispatched at this time.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}