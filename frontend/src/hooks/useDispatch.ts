// src/hooks/useDispatch.ts
import { API_URL } from "@/lib/api-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// ============================================
// TYPES
// ============================================

interface WasteAnalysis {
  waste_id: string;
  waste_dominantWasteType?: string;
  waste_locationAddress: string;
  waste_locationLongitude: number;
  waste_locationLatitude: number;
  waste_analysedBy: string;
  waste_user?: {
    user_id: string;
    user_fullName: string;
    user_email: string;
    user_phoneNumber?: string;
  };
  waste_wasteCategories?: Array<{
    id: string;
    waste_type: string;
    waste_estimatedPercentage: number;
  }>;
}

interface Team {
  team_id: string;
  team_name: string;
  team_specialization: string;
  team_members?: Array<{
    id: string;
    userId: string;
    user: {
      user_id: string;
      user_fullName: string;
      user_email: string;
      user_role: string;
    };
  }>;
}

interface Truck {
  truck_id: string;
  truck_registrationNumber: string;
  truck_truckType: string;
  truck_status: string;
}

interface DispatchImage {
  id: string;
  imageURL: string;
  dispatchId: string;
}

export interface Dispatch {
  dispatch_id: string;
  dispatch_wasteAnalysisId: string;
  dispatch_assignedTeamId: string;
  dispatch_assignedTruckId: string;
  dispatch_locationLongitude: number;
  dispatch_locationLatitude: number;
  dispatch_locationAddress?: string;
  dispatch_status: "pending" | "assigned" | "en_route" | "collected" | "completed" | "cancelled";
  dispatch_scheduledDate: string;
  dispatch_estimatedArrival?: string;
  dispatch_actualCollectionDate?: string;
  dispatch_collectionVerified: boolean;
  dispatch_collectionNotes?: string;
  dispatch_pointsAwarded: number;
  dispatch_priority: "low" | "normal" | "high" | "urgent";
  dispatch_createdAt: string;
  dispatch_updatedAt: string;
  dispatch_wasteAnalysis?: WasteAnalysis;
  dispatch_assignedTeam?: Team;
  dispatch_assignedTruck?: Truck;
  dispatch_collectionImages?: DispatchImage[];
}

interface PaginatedDispatchResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  results: number;
  data: Dispatch[];
}

interface SingleDispatchResponse {
  success: boolean;
  data: Dispatch;
}

// ============================================
// JOB RESPONSE TYPES
// ============================================
interface JobResponse {
  success: boolean;
  message: string;
  jobId: string;
  queueStatus?: {
    isQueued: boolean;
    queueInfo?: {
      waitingForDispatch: string;
      currentDispatchETA: string;
      truckAvailableAfter: string;
      estimatedWaitTime: number;
    };
  };
  estimatedProcessingTime: string;
}

interface JobStatus {
  success: boolean;
  job: {
    id: string;
    name: string;
    state: "waiting" | "active" | "completed" | "failed" | "delayed";
    progress: number;
    result?: {
      success: boolean;
      dispatchId?: string;
      dispatch?: Dispatch;
    };
    error?: string;
    attemptsMade: number;
    timestamp: number;
    processedOn?: number;
    finishedOn?: number;
  };
}

interface CreateAutoDispatchParams {
  wasteAnalysisId: string;
}

interface CreateManualDispatchParams {
  wasteAnalysisId: string;
  teamId: string;
  truckId: string;
  scheduledDate?: string;
  priority?: "low" | "normal" | "high" | "urgent";
}

interface UpdateDispatchStatusParams {
  dispatchId: string;
  status: "pending" | "assigned" | "en_route" | "collected" | "completed" | "cancelled";
  collectionNotes?: string;
}

interface GetDispatchesParams {
  status?: string;
  teamId?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

interface CanDispatchResponse {
  success: boolean;
  canDispatch: boolean;
  message: string;
  details?: string;
  dispatchId?: string;
  data?: {
    wasteId: string;
    containsWaste: boolean;
    status: string;
    dominantType: string;
    categories: any[];
  };
}

interface TeamAvailability {
  teamId: string;
  teamName: string;
  specialization: string;
  status: string;
  totalTrucks: number;
  availableTrucks: number;
  busyTrucks: number;
  activeDispatches: number;
  immediatelyAvailable: boolean;
  nextAvailableTime: string | null;
  nextAvailableTruck: {
    truckId: string;
    registration: string;
    currentDispatchId: string;
    estimatedArrival: string;
  } | null;
  estimatedWaitHours: number | null;
  availableTruckDetails: Array<{
    truckId: string;
    registration: string;
    type: string;
    capacity: number;
  }>;
}

interface AvailabilityResponse {
  success: boolean;
  summary: {
    totalTeams: number;
    teamsWithAvailableTrucks: number;
    teamsFullyBusy: number;
    totalAvailableTrucks: number;
    totalBusyTrucks: number;
  };
  teams: TeamAvailability[];
}

interface DispatchableWasteResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  results: number;
  data: WasteAnalysis[];
}

interface QueuedDispatch extends Dispatch {
  queuePosition: number;
  estimatedActivation: string | null;
  blockedBy: {
    dispatchId: string;
    estimatedCompletion: string;
  } | null;
  waitTimeHours: number | null;
}

interface QueueResponse {
  success: boolean;
  total: number;
  data: QueuedDispatch[];
}

// ============================================
// GET JOB STATUS
// ============================================
export function useGetJobStatus(jobId: string | null) {
  return useQuery<JobStatus, Error>({
    queryKey: ["jobStatus", jobId],
    queryFn: async () => {
      if (!jobId) throw new Error("No job ID provided");

      const response = await fetch(`${API_URL}/dispatch/job/${jobId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch job status");
      }

      return response.json();
    },
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Stop polling if job is completed or failed
      if (!data?.job) return false;
      const state = data.job.state;
      if (state === "completed" || state === "failed") return false;
      // Poll every 2 seconds while job is processing
      return 2000;
    },
    staleTime: 0, // Always fetch fresh data
  });
}

// ============================================
// CHECK IF WASTE CAN BE DISPATCHED
// ============================================
export function useCanDispatch(wasteAnalysisId: string) {
  return useQuery<CanDispatchResponse, Error>({
    queryKey: ["canDispatch", wasteAnalysisId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/dispatch/can-dispatch/${wasteAnalysisId}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to check dispatch eligibility");
      }

      return response.json();
    },
    enabled: !!wasteAnalysisId,
    staleTime: 1000 * 30,
  });
}

// ============================================
// GET ALL DISPATCHES
// ============================================
export function useGetDispatches(params?: GetDispatchesParams) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.teamId) queryParams.append("teamId", params.teamId);
  if (params?.priority) queryParams.append("priority", params.priority);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const queryString = queryParams.toString();

  return useQuery<PaginatedDispatchResponse, Error>({
    queryKey: ["dispatches", params],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/dispatch${queryString ? `?${queryString}` : ""}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch dispatches");
      }

      return response.json();
    },
    staleTime: 1000 * 60,
  });
}

// ============================================
// GET SINGLE DISPATCH
// ============================================
export function useGetDispatch(dispatchId: string) {
  return useQuery<Dispatch, Error>({
    queryKey: ["dispatch", dispatchId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/dispatch/${dispatchId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch dispatch");
      }

      const data: SingleDispatchResponse = await response.json();
      return data.data;
    },
    enabled: !!dispatchId,
    staleTime: 1000 * 30,
  });
}

// ============================================
// CREATE AUTOMATIC DISPATCH
// ============================================
export function useCreateAutoDispatch() {
  const queryClient = useQueryClient();

  const { mutate: createAutoDispatch, isPending: isCreatingAutoDispatch } =
    useMutation({
      mutationFn: async ({ wasteAnalysisId }: CreateAutoDispatchParams) => {
        const response = await fetch(
          `${API_URL}/dispatch/auto/${wasteAnalysisId}`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create auto dispatch");
        }

        return response.json() as Promise<JobResponse>;
      },
      onSuccess: (data) => {
        toast.success(`${data.message}`, {
          duration: 4000,
        });

        // Invalidate queries after a delay to allow job processing
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["dispatches"] });
          queryClient.invalidateQueries({ queryKey: ["wasteAnalysis"] });
          queryClient.invalidateQueries({ queryKey: ["adminWasteReports"] });
          queryClient.invalidateQueries({ queryKey: ["dispatchableWaste"] });
          queryClient.invalidateQueries({ queryKey: ["availability"] });
          queryClient.invalidateQueries({ queryKey: ["dispatchQueue"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
        }, 3000);

        return data;
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to create dispatch");
      },
    });

  return { createAutoDispatch, isCreatingAutoDispatch };
}

// ============================================
// CREATE MANUAL DISPATCH
// ============================================
export function useCreateManualDispatch() {
  const queryClient = useQueryClient();

  const { mutate: createManualDispatch, isPending: isCreatingManualDispatch } =
    useMutation({
      mutationFn: async (params: CreateManualDispatchParams) => {
        const response = await fetch(`${API_URL}/dispatch/manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create manual dispatch");
        }

        return response.json() as Promise<JobResponse>;
      },
      onSuccess: (data) => {
        toast.success(`${data.message}`, {
          duration: 4000,
        });

        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["dispatches"] });
          queryClient.invalidateQueries({ queryKey: ["wasteAnalysis"] });
          queryClient.invalidateQueries({ queryKey: ["adminWasteReports"] });
          queryClient.invalidateQueries({ queryKey: ["dispatchableWaste"] });
          queryClient.invalidateQueries({ queryKey: ["availability"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
        }, 3000);

        return data;
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to create dispatch");
      },
    });

  return { createManualDispatch, isCreatingManualDispatch };
}

// ============================================
// UPDATE DISPATCH STATUS
// ============================================
export function useUpdateDispatchStatus() {
  const queryClient = useQueryClient();

  const { mutate: updateDispatchStatus, isPending: isUpdatingStatus } =
    useMutation({
      mutationFn: async ({
        dispatchId,
        status,
        collectionNotes,
      }: UpdateDispatchStatusParams) => {
        const response = await fetch(`${API_URL}/dispatch/${dispatchId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status, collectionNotes }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update dispatch status");
        }

        return response.json() as Promise<JobResponse>;
      },
      onSuccess: (data, variables) => {
        toast.success(`Status update queued`, {
          duration: 4000,
        });

        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["dispatches"] });
          queryClient.invalidateQueries({
            queryKey: ["dispatch", variables.dispatchId],
          });
          queryClient.invalidateQueries({ queryKey: ["wasteAnalysis"] });
          queryClient.invalidateQueries({ queryKey: ["availability"] });
          queryClient.invalidateQueries({ queryKey: ["dispatchQueue"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
        }, 3000);

        return data;
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to update status");
      },
    });

  return { updateDispatchStatus, isUpdatingStatus };
}

// ============================================
// DELETE/CANCEL DISPATCH
// ============================================
export function useDeleteDispatch() {
  const queryClient = useQueryClient();

  const { mutate: deleteDispatch, isPending: isDeletingDispatch } = useMutation({
    mutationFn: async (dispatchId: string) => {
      const response = await fetch(`${API_URL}/dispatch/${dispatchId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete dispatch");
      }

      return response.json() as Promise<JobResponse>;
    },
    onSuccess: (data) => {
      toast.success(`Dispatch cancellation queued`, {
        duration: 4000,
      });

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["dispatches"] });
        queryClient.invalidateQueries({ queryKey: ["wasteAnalysis"] });
        queryClient.invalidateQueries({ queryKey: ["adminWasteReports"] });
        queryClient.invalidateQueries({ queryKey: ["dispatchableWaste"] });
        queryClient.invalidateQueries({ queryKey: ["availability"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
        queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      }, 3000);

      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete dispatch");
    },
  });

  return { deleteDispatch, isDeletingDispatch };
}

// ============================================
// GET TEAM/TRUCK AVAILABILITY
// ============================================
export function useGetAvailability(specialization?: string) {
  const queryParams = specialization ? `?specialization=${specialization}` : "";

  return useQuery<AvailabilityResponse, Error>({
    queryKey: ["availability", specialization],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/dispatch/availability${queryParams}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch availability");
      }

      return response.json();
    },
    staleTime: 1000 * 30,
  });
}

// ============================================
// GET DISPATCHABLE WASTE REPORTS
// ============================================
export function useGetDispatchableWaste(page = 1, limit = 20) {
  return useQuery<DispatchableWasteResponse, Error>({
    queryKey: ["dispatchableWaste", page, limit],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/dispatch/dispatchable-waste?page=${page}&limit=${limit}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch dispatchable waste");
      }

      return response.json();
    },
    staleTime: 1000 * 60,
  });
}

// ============================================
// GET DISPATCH QUEUE
// ============================================
export function useGetDispatchQueue(teamId?: string) {
  const queryParams = teamId ? `?teamId=${teamId}` : "";

  return useQuery<QueueResponse, Error>({
    queryKey: ["dispatchQueue", teamId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/dispatch/queue${queryParams}`,
        { credentials: "include" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch dispatch queue");
      }

      return response.json();
    },
    staleTime: 1000 * 30,
  });
}

// ============================================
// HELPER HOOKS
// ============================================
export function useGetDispatchesByStatus(
  status: "pending" | "assigned" | "en_route" | "collected" | "completed" | "cancelled"
) {
  return useGetDispatches({ status });
}

export function useGetTeamDispatches(teamId: string) {
  return useGetDispatches({ teamId });
}