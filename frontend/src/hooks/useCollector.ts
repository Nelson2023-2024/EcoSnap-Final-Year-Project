// frontend/src/hooks/useCollector.ts
import { API_URL } from "@/lib/api-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Types
export interface TeamAssignment {
  teamId: string;
  teamName: string;
  specialization: string;
  status: string;
  trucks: Array<{
    truck_id: string;
    truck_registrationNumber: string;
    truck_truckType: string;
    truck_status: string;
    truck_capacity: number;
    truck_imageURL: string;
  }>;
  members: Array<{
    user: {
      user_id: string;
      user_fullName: string;
      user_email: string;
      user_role: string;
      user_profileImage: string;
    };
  }>;
}

export interface Dispatch {
  dispatch_id: string;
  dispatch_status: string;
  dispatch_priority: string;
  dispatch_scheduledDate: string;
  dispatch_estimatedArrival: string;
  dispatch_actualCollectionDate?: string;
  dispatch_locationAddress: string;
  dispatch_locationLatitude: number;
  dispatch_locationLongitude: number;
  dispatch_collectionNotes?: string;
  dispatch_pointsAwarded: number;
  dispatch_wasteAnalysis: {
    waste_id: string;
    waste_dominantWasteType: string;
    waste_overallCategory: string;
    waste_imageURL: string;
    waste_locationAddress: string;
    waste_user: {
      user_id: string;
      user_fullName: string;
      user_email: string;
      user_phoneNumber: string;
    };
    waste_wasteCategories: Array<{
      waste_type: string;
      waste_estimatedPercentage: number;
    }>;
  };
  dispatch_assignedTeam: {
    team_id: string;
    team_name: string;
    team_specialization: string;
  };
  dispatch_assignedTruck: {
    truck_id: string;
    truck_registrationNumber: string;
    truck_truckType: string;
    truck_capacity: number;
    truck_imageURL: string;
  };
  dispatch_collectionImages: Array<{
    id: string;
    imageURL: string;
  }>;
}

export interface CollectorStats {
  totalDispatches: number;
  completedDispatches: number;
  pendingDispatches: number;
  enRouteDispatches: number;
  totalPointsAwarded: number;
  statusBreakdown: Record<string, number>;
  recentCollections: Array<{
    dispatch_id: string;
    dispatch_actualCollectionDate: string;
    dispatch_pointsAwarded: number;
    dispatch_wasteAnalysis: {
      waste_dominantWasteType: string;
      waste_locationAddress: string;
    };
  }>;
}

// Get team assignment
export function useTeamAssignment() {
  return useQuery<TeamAssignment>({
    queryKey: ["team-assignment"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/collector/my-assignment`, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch team assignment");
      }

      const data = await response.json();
      return data.data;
    },
    retry: 1,
  });
}

// Get collector dispatches
export function useCollectorDispatches(status?: string, page = 1, limit = 20) {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  return useQuery<{
    data: Dispatch[];
    total: number;
    page: number;
    totalPages: number;
    summary: Record<string, number>;
  }>({
    queryKey: ["collector-dispatches", status, page, limit],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/collector/my-dispatches?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch dispatches");
      }

      const result = await response.json();
      return result;
    },
  });
}

// Get single dispatch
export function useDispatchDetails(dispatchId: string) {
  return useQuery<Dispatch>({
    queryKey: ["dispatch-details", dispatchId],
    queryFn: async () => {
      const response = await fetch(
        `${API_URL}/collector/dispatch/${dispatchId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch dispatch details");
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!dispatchId,
  });
}

// Get collector stats
export function useCollectorStats() {
  return useQuery<CollectorStats>({
    queryKey: ["collector-stats"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/collector/my-stats`, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch stats");
      }

      const data = await response.json();
      return data.data;
    },
  });
}

// Start dispatch
export function useStartDispatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dispatchId: string) => {
      const response = await fetch(
        `${API_URL}/collector/dispatch/${dispatchId}/start`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to start dispatch");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data, dispatchId) => {
      toast.success("Dispatch started! Status updated to en route.");
      queryClient.invalidateQueries({ queryKey: ["collector-dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch-details", dispatchId] });
      queryClient.invalidateQueries({ queryKey: ["collector-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start dispatch");
    },
  });
}

// Complete dispatch
export function useCompleteDispatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dispatchId,
      verificationImages,
      collectionNotes,
    }: {
      dispatchId: string;
      verificationImages: File[];
      collectionNotes?: string;
    }) => {
      const formData = new FormData();

      // Add images
      verificationImages.forEach((image) => {
        formData.append("verificationImages", image);
      });

      // Add notes
      if (collectionNotes) {
        formData.append("collectionNotes", collectionNotes);
      }
      formData.append("collectionVerified", "true");

      const response = await fetch(
        `${API_URL}/collector/dispatch/${dispatchId}/complete`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete dispatch");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data, { dispatchId }) => {
      toast.success(
        `Dispatch completed! ${data.data.pointsAwarded} points awarded to reporter.`
      );
      queryClient.invalidateQueries({ queryKey: ["collector-dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch-details", dispatchId] });
      queryClient.invalidateQueries({ queryKey: ["collector-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete dispatch");
    },
  });
}

// Report issue
export function useReportIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dispatchId,
      issue,
      notes,
    }: {
      dispatchId: string;
      issue: string;
      notes?: string;
    }) => {
      const response = await fetch(
        `${API_URL}/collector/dispatch/${dispatchId}/report-issue`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ issue, notes }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to report issue");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data, { dispatchId }) => {
      toast.success("Issue reported successfully. Admins have been notified.");
      queryClient.invalidateQueries({ queryKey: ["collector-dispatches"] });
      queryClient.invalidateQueries({ queryKey: ["dispatch-details", dispatchId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to report issue");
    },
  });
}