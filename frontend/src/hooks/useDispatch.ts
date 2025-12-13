import { API_URL } from "@/lib/api-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Types
export interface Dispatch {
  _id: string;
  dispatch_id: string;
  dispatch_wasteAnalysis: string | WasteAnalysis;
  dispatch_assignedTeam: string | Team;
  dispatch_assignedTruck: string | Truck;
  dispatch_pickupLocation: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  dispatch_status:
    | "pending"
    | "assigned"
    | "en_route"
    | "collected"
    | "completed"
    | "cancelled";
  dispatch_scheduledDate: string;
  dispatch_estimatedArrival?: string;
  dispatch_actualCollectionDate?: string;
  dispatch_collectionVerified: boolean;
  dispatch_collectionNotes?: string;
  dispatch_collectionImages?: string[];
  dispatch_pointsAwarded: number;
  dispatch_priority: "low" | "normal" | "high" | "urgent";
  dispatch_createdAt: string;
  dispatch_updatedAt: string;
}

interface WasteAnalysis {
  _id: string;
  waste_dominantWasteType?: string;
  waste_location: {
    waste_address: string;
    waste_coordinates: [number, number];
  };
}

interface Team {
  _id: string;
  team_name: string;
  team_specialization: string;
}

interface Truck {
  _id: string;
  truck_registrationNumber: string;
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
  status:
    | "pending"
    | "assigned"
    | "en_route"
    | "collected"
    | "completed"
    | "cancelled";
  collectionNotes?: string;
}

interface GetDispatchesParams {
  status?: string;
  teamId?: string;
  priority?: string;
}

// ============================================
// GET ALL DISPATCHES
// ============================================
export function useGetDispatches(params?: GetDispatchesParams) {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.teamId) queryParams.append("teamId", params.teamId);
  if (params?.priority) queryParams.append("priority", params.priority);

  const queryString = queryParams.toString();

  return useQuery({
    queryKey: ["dispatches", params],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/dispatch${queryString ? `?${queryString}` : ""}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch dispatches");
      }

      const data = await response.json();
      return data.data as Dispatch[];
    },
  });
}

// ============================================
// GET SINGLE DISPATCH
// ============================================
export function useGetDispatch(dispatchId: string) {
  return useQuery({
    queryKey: ["dispatch", dispatchId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/dispatch/${dispatchId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch dispatch");
      }

      const data = await response.json();
      return data.data as Dispatch;
    },
    enabled: !!dispatchId,
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

        const data = await response.json();
        return data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["dispatches"] });
        queryClient.invalidateQueries({ queryKey: ["wasteAnalysis"] });
        toast.success(
          data.message || "Dispatch created automatically! 🚚"
        );
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
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create manual dispatch");
        }

        const data = await response.json();
        return data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["dispatches"] });
        queryClient.invalidateQueries({ queryKey: ["wasteAnalysis"] });
        toast.success(data.message || "Dispatch created manually! 🚚");
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
        const response = await fetch(
          `${API_URL}/dispatch/${dispatchId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ status, collectionNotes }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to update dispatch status");
        }

        const data = await response.json();
        return data;
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ["dispatches"] });
        queryClient.invalidateQueries({
          queryKey: ["dispatch", variables.dispatchId],
        });
        queryClient.invalidateQueries({ queryKey: ["wasteAnalysis"] });
        
        // Show appropriate toast based on status
        const statusMessages: Record<string, string> = {
          assigned: "Dispatch assigned! 📋",
          en_route: "Team is en route! 🚚",
          collected: "Waste collected! ✅",
          completed: "Dispatch completed! 🎉",
          cancelled: "Dispatch cancelled ❌",
        };

        toast.success(
          statusMessages[variables.status] || data.message || "Status updated!"
        );
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

  const { mutate: deleteDispatch, isPending: isDeletingDispatch } =
    useMutation({
      mutationFn: async (dispatchId: string) => {
        const response = await fetch(`${API_URL}/dispatch/${dispatchId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to delete dispatch");
        }

        const data = await response.json();
        return data;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["dispatches"] });
        queryClient.invalidateQueries({ queryKey: ["wasteAnalysis"] });
        toast.success(data.message || "Dispatch cancelled successfully");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to delete dispatch");
      },
    });

  return { deleteDispatch, isDeletingDispatch };
}

// ============================================
// GET DISPATCHES BY STATUS (Helper)
// ============================================
export function useGetDispatchesByStatus(
  status:
    | "pending"
    | "assigned"
    | "en_route"
    | "collected"
    | "completed"
    | "cancelled"
) {
  return useGetDispatches({ status });
}

// ============================================
// GET TEAM DISPATCHES (Helper)
// ============================================
export function useGetTeamDispatches(teamId: string) {
  return useGetDispatches({ teamId });
}