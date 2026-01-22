"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LoaderIcon,
  Truck,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Play,
  Ban,
  TruckIcon,
  Users,
  Package,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  useGetDispatches,
  useGetDispatchableWaste,
  useGetAvailability,
  useGetDispatchQueue,
  useUpdateDispatchStatus,
  useDeleteDispatch,
  useCreateAutoDispatch,
  useCreateManualDispatch,
  useGetJobStatus,
} from "@/hooks/useDispatch";
import { useTeams } from "@/hooks/useTeams";
import { useTrucks } from "@/hooks/useTruck";

// ============================================
// JOB STATUS TRACKER COMPONENT
// ============================================
function JobStatusTracker({
  jobId,
  jobType,
  onComplete,
}: {
  jobId: string | null;
  jobType?: string;
  onComplete?: () => void;
}) {
  const { data: jobStatus, isLoading } = useGetJobStatus(jobId);

  if (!jobId || isLoading) return null;

  const job = jobStatus?.job;
  if (!job) return null;

  const stateConfig = {
    waiting: {
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 border-yellow-200",
      message: "Waiting in queue...",
    },
    active: {
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
      message: "Processing...",
    },
    completed: {
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50 border-green-200",
      message: job.result?.success
        ? `Completed! ${
            job.result.dispatchId
              ? `Dispatch ID: ${job.result.dispatchId.slice(0, 8)}...`
              : ""
          }`
        : "Completed",
    },
    failed: {
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200",
      message: `Failed: ${job.error || "Unknown error"}`,
    },
    delayed: {
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 border-orange-200",
      message: "Delayed, will retry...",
    },
  };

  const config = stateConfig[job.state] || stateConfig.waiting;
  const Icon = config.icon;

  // Call onComplete callback when job finishes
  if (job.state === "completed" && onComplete) {
    setTimeout(() => onComplete(), 1500);
  }

  return (
    <Alert className={`${config.bgColor} border`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{config.message}</span>
          {job.state === "active" && job.progress > 0 && (
            <span className="text-sm text-muted-foreground">
              ({job.progress}%)
            </span>
          )}
          {jobType && (
            <Badge variant="outline" className="text-xs">
              {jobType}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            Job: {job.id.slice(0, 8)}...
          </span>
          {job.state === "completed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onComplete}
              className="h-6 px-2 text-xs"
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function AdminDispatchPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDispatch, setSelectedDispatch] = useState<string | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [collectionNotes, setCollectionNotes] = useState("");

  // Manual dispatch dialog state
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [selectedWasteId, setSelectedWasteId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedTruck, setSelectedTruck] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<
    "low" | "normal" | "high" | "urgent"
  >("normal");
  const [scheduledDate, setScheduledDate] = useState("");

  // Job tracking state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobType, setJobType] = useState<string>("");

  // Fetch data
  const dispatchParams = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    page: currentPage,
    limit: 15,
  };

  const {
    data: dispatchesData,
    isLoading: dispatchesLoading,
    isError: dispatchesError,
  } = useGetDispatches(dispatchParams);

  const { data: dispatchableWaste, isLoading: wasteLoading } =
    useGetDispatchableWaste(1, 10);

  const { data: availability } = useGetAvailability();
  const { data: queueData } = useGetDispatchQueue();
  const { data: teams } = useTeams();
  const { data: trucks } = useTrucks();

  // Mutations
  const { updateDispatchStatus, isUpdatingStatus } = useUpdateDispatchStatus();
  const { deleteDispatch, isDeletingDispatch } = useDeleteDispatch();
  const { createAutoDispatch, isCreatingAutoDispatch } =
    useCreateAutoDispatch();
  const { createManualDispatch, isCreatingManualDispatch } =
    useCreateManualDispatch();

  const dispatches = dispatchesData?.data || [];
  const totalDispatches = dispatchesData?.total || 0;
  const totalPages = dispatchesData?.totalPages || 1;

  // Calculate stats
  const activeDispatches = dispatches.filter(
    (d) =>
      d.dispatch_status === "assigned" || d.dispatch_status === "en_route"
  ).length;
  const completedToday = dispatches.filter(
    (d) =>
      d.dispatch_status === "completed" &&
      new Date(d.dispatch_actualCollectionDate || "").toDateString() ===
        new Date().toDateString()
  ).length;
  const pendingDispatches = dispatches.filter(
    (d) => d.dispatch_status === "pending"
  ).length;

  // Handlers
  const handleStatusUpdate = () => {
    if (!selectedDispatch || !newStatus) return;

    updateDispatchStatus(
      {
        dispatchId: selectedDispatch,
        status: newStatus as any,
        collectionNotes: collectionNotes || undefined,
      },
      {
        onSuccess: (data) => {
          setActiveJobId(data.jobId);
          setJobType(`status-update: ${newStatus}`);
          setIsStatusDialogOpen(false);
          setSelectedDispatch(null);
          setNewStatus("");
          setCollectionNotes("");
        },
      }
    );
  };

  const handleDeleteDispatch = (dispatchId: string) => {
    if (
      confirm(
        "Are you sure you want to cancel this dispatch? This action cannot be undone."
      )
    ) {
      deleteDispatch(dispatchId, {
        onSuccess: (data) => {
          setActiveJobId(data.jobId);
          setJobType("cancel-dispatch");
        },
      });
    }
  };

  const handleAutoDispatch = (wasteId: string) => {
    if (confirm("Create automatic dispatch for this waste report?")) {
      createAutoDispatch(
        { wasteAnalysisId: wasteId },
        {
          onSuccess: (data) => {
            setActiveJobId(data.jobId);
            setJobType("auto-dispatch");
          },
        }
      );
    }
  };

  const handleManualDispatch = () => {
    if (!selectedWasteId || !selectedTeam || !selectedTruck) return;

    createManualDispatch(
      {
        wasteAnalysisId: selectedWasteId,
        teamId: selectedTeam,
        truckId: selectedTruck,
        priority: selectedPriority,
        scheduledDate: scheduledDate || undefined,
      },
      {
        onSuccess: (data) => {
          setActiveJobId(data.jobId);
          setJobType("manual-dispatch");
          setIsManualDialogOpen(false);
          setSelectedWasteId("");
          setSelectedTeam("");
          setSelectedTruck("");
          setSelectedPriority("normal");
          setScheduledDate("");
        },
      }
    );
  };

  const openStatusDialog = (dispatchId: string, currentStatus: string) => {
    setSelectedDispatch(dispatchId);
    setNewStatus(currentStatus);
    setIsStatusDialogOpen(true);
  };

  const openManualDispatchDialog = (wasteId: string) => {
    setSelectedWasteId(wasteId);
    setIsManualDialogOpen(true);
  };

  const clearJobTracking = () => {
    setActiveJobId(null);
    setJobType("");
  };

  // Filter trucks by selected team
  const availableTrucks = trucks?.filter((truck: any) => {
    if (!selectedTeam) return true;
    return truck.truck_assignedTeamId === selectedTeam;
  });

  // Utility functions
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending:
        "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/40",
      assigned:
        "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/40",
      en_route:
        "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/40",
      collected:
        "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/40",
      completed:
        "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/40",
      cancelled:
        "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/40",
    };
    return colors[status] || colors.pending;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-slate-500/20 text-slate-700 border-slate-500/40",
      normal: "bg-blue-500/20 text-blue-700 border-blue-500/40",
      high: "bg-orange-500/20 text-orange-700 border-orange-500/40",
      urgent: "bg-red-500/20 text-red-700 border-red-500/40",
    };
    return colors[priority] || colors.normal;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (dispatchesLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="h-8 w-8 animate-spin text-eco-primary" />
          <p className="text-muted-foreground">Loading dispatch system...</p>
        </div>
      </div>
    );
  }

  if (dispatchesError) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Failed to load dispatches. Please try again.
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
            <h1 className="text-3xl font-bold">Dispatch Management</h1>
            <p className="mt-2 text-white/90">
              Monitor and manage waste collection dispatches
            </p>
          </div>

          {/* Active Job Status Tracker */}
          {activeJobId && (
            <JobStatusTracker
              jobId={activeJobId}
              jobType={jobType}
              onComplete={clearJobTracking}
            />
          )}

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Total Dispatches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDispatches}</div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {activeDispatches}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-eco-success">
                  {completedToday}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {pendingDispatches}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="dispatches" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dispatches">All Dispatches</TabsTrigger>
              <TabsTrigger value="pending">Pending Waste</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="queue">Queue</TabsTrigger>
            </TabsList>

            {/* All Dispatches Tab */}
            <TabsContent value="dispatches" className="space-y-4">
              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>Status:</Label>
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="en_route">En Route</SelectItem>
                          <SelectItem value="collected">Collected</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label>Priority:</Label>
                      <Select
                        value={priorityFilter}
                        onValueChange={setPriorityFilter}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dispatches Table */}
              <Card>
                <CardContent className="p-0">
                  {dispatches.length === 0 ? (
                    <div className="py-12 text-center">
                      <TruckIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No dispatches found
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dispatch ID</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Truck</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Scheduled</TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dispatches.map((dispatch) => (
                            <TableRow key={dispatch.dispatch_id}>
                              <TableCell className="font-mono text-xs">
                                {dispatch.dispatch_id.slice(0, 8)}...
                              </TableCell>

                              <TableCell>
                                <div className="flex items-start gap-1 max-w-xs">
                                  <MapPin className="h-4 w-4 text-eco-primary mt-0.5 flex-shrink-0" />
                                  <span className="text-sm line-clamp-2">
                                    {dispatch.dispatch_locationAddress ||
                                      "Unknown"}
                                  </span>
                                </div>
                              </TableCell>

                              <TableCell>
                                <span className="text-sm">
                                  {dispatch.dispatch_assignedTeam?.team_name ||
                                    "N/A"}
                                </span>
                              </TableCell>

                              <TableCell>
                                <span className="text-sm font-mono">
                                  {dispatch.dispatch_assignedTruck
                                    ?.truck_registrationNumber || "N/A"}
                                </span>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  className={getStatusColor(
                                    dispatch.dispatch_status
                                  )}
                                >
                                  {formatStatus(dispatch.dispatch_status)}
                                </Badge>
                              </TableCell>

                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getPriorityColor(
                                    dispatch.dispatch_priority
                                  )}
                                >
                                  {dispatch.dispatch_priority.toUpperCase()}
                                </Badge>
                              </TableCell>

                              <TableCell className="text-sm">
                                {formatDate(dispatch.dispatch_scheduledDate)}
                              </TableCell>

                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        `/admin/dispatch/${dispatch.dispatch_id}`
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openStatusDialog(
                                        dispatch.dispatch_id,
                                        dispatch.dispatch_status
                                      )
                                    }
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>

                                  {dispatch.dispatch_status !== "completed" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:bg-red-50"
                                      onClick={() =>
                                        handleDeleteDispatch(
                                          dispatch.dispatch_id
                                        )
                                      }
                                      disabled={isDeletingDispatch}
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                              }
                              disabled={currentPage === 1}
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((p) =>
                                  Math.min(totalPages, p + 1)
                                )
                              }
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pending Waste Tab */}
            <TabsContent value="pending" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Waste Reports Ready for Dispatch</CardTitle>
                </CardHeader>
                <CardContent>
                  {wasteLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoaderIcon className="h-6 w-6 animate-spin text-eco-primary" />
                    </div>
                  ) : dispatchableWaste && dispatchableWaste.data.length > 0 ? (
                    <div className="space-y-4">
                      {dispatchableWaste.data.map((waste) => (
                        <div
                          key={waste.waste_id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">
                              {waste.waste_dominantWasteType || "Mixed Waste"}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {waste.waste_locationAddress}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleAutoDispatch(waste.waste_id)
                              }
                              disabled={isCreatingAutoDispatch}
                            >
                              {isCreatingAutoDispatch ? (
                                <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <Truck className="h-4 w-4 mr-2" />
                              )}
                              Auto Dispatch
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openManualDispatchDialog(waste.waste_id)
                              }
                            >
                              Manual
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No pending waste reports
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team & Truck Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  {availability ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid gap-4 md:grid-cols-4 p-4 bg-muted rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Teams
                          </p>
                          <p className="text-2xl font-bold">
                            {availability.summary.totalTeams}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Available
                          </p>
                          <p className="text-2xl font-bold text-green-600">
                            {availability.summary.teamsWithAvailableTrucks}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Available Trucks
                          </p>
                          <p className="text-2xl font-bold text-blue-600">
                            {availability.summary.totalAvailableTrucks}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Busy Trucks
                          </p>
                          <p className="text-2xl font-bold text-orange-600">
                            {availability.summary.totalBusyTrucks}
                          </p>
                        </div>
                      </div>

                      {/* Team Details */}
                      <div className="space-y-3">
                        {availability.teams.map((team) => (
                          <div
                            key={team.teamId}
                            className="p-4 border rounded-lg space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{team.teamName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {team.specialization}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  team.immediatelyAvailable
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {team.immediatelyAvailable
                                  ? "Available"
                                  : "Busy"}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">
                                  Total Trucks
                                </p>
                                <p className="font-medium">
                                  {team.totalTrucks}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  Available
                                </p>
                                <p className="font-medium text-green-600">
                                  {team.availableTrucks}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Busy</p>
                                <p className="font-medium text-orange-600">
                                  {team.busyTrucks}
                                </p>
                              </div>
                            </div>

                            {!team.immediatelyAvailable &&
                              team.nextAvailableTime && (
                                <div className="pt-2 border-t">
                                  <p className="text-sm text-muted-foreground">
                                    Next available:{" "}
                                    {formatDate(team.nextAvailableTime)} (~
                                    {team.estimatedWaitHours}h wait)
                                  </p>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <LoaderIcon className="h-6 w-6 animate-spin text-eco-primary" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Queue Tab */}
            <TabsContent value="queue" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Dispatch Queue ({queueData?.total || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {queueData && queueData.data.length > 0 ? (
                    <div className="space-y-3">
                      {queueData.data.map((dispatch, index) => (
                        <div
                          key={dispatch.dispatch_id}
                          className="p-4 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-eco-primary text-white font-bold">
                                {dispatch.queuePosition}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {dispatch.dispatch_assignedTeam?.team_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {dispatch.dispatch_locationAddress}
                                </p>
                              </div>
                            </div>
                            <Badge
                              className={getPriorityColor(
                                dispatch.dispatch_priority
                              )}
                            >
                              {dispatch.dispatch_priority}
                            </Badge>
                          </div>

                          {dispatch.estimatedActivation && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>
                                Estimated activation:{" "}
                                {formatDate(dispatch.estimatedActivation)} (~
                                {dispatch.waitTimeHours}h)
                              </span>
                            </div>
                          )}

                          {dispatch.blockedBy && (
                            <div className="flex items-center gap-2 text-sm text-orange-600">
                              <AlertCircle className="h-4 w-4" />
                              <span>
                                Waiting for dispatch{" "}
                                {dispatch.blockedBy.dispatchId.slice(0, 8)} to
                                complete
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-8 text-muted-foreground">
                      No queued dispatches
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Dispatch Status</DialogTitle>
            <DialogDescription>
              Change the status of this dispatch and add notes if needed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="en_route">En Route</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Collection Notes (Optional)</Label>
              <textarea
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                placeholder="Add any notes about the collection..."
              />
            </div>

            <Button
              onClick={handleStatusUpdate}
              disabled={!newStatus || isUpdatingStatus}
              className="w-full"
            >
              {isUpdatingStatus ? (
                <>
                  <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Dispatch Dialog */}
      <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manual Dispatch Assignment</DialogTitle>
            <DialogDescription>
              Manually assign a team and truck for waste collection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={selectedPriority}
                onValueChange={(v: any) => setSelectedPriority(v)}
              >
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
                  Creating...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Create Dispatch
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}