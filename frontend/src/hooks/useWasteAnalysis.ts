import { API_URL } from "@/lib/api-url";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Types matching Prisma schema
interface WasteCategory {
  id: string;
  waste_type: string;
  waste_estimatedPercentage: number;
  wasteAnalysisId: string;
}

interface User {
  user_id: string;
  user_fullName: string | null;
  user_email: string;
  user_phoneNumber?: string | null;
}

interface WasteAnalysisItem {
  waste_id: string;
  waste_analysedBy: string;
  waste_imageURL: string;
  waste_containsWaste: boolean;
  waste_overallCategory: "general" | "recyclables" | "e_waste" | "organic" | "hazardous" | null;
  waste_dominantWasteType: string | null;
  waste_estimatedVolumeValue: number | null;
  waste_estimatedVolumeUnit: "kg" | "liters" | "cubic_meters" | null;
  waste_possibleSource: string | null;
  waste_environmentalImpact: string | null;
  waste_confidenceLevel: string | null;
  waste_status: "pending_dispatch" | "dispatched" | "collected" | "no_waste" | "error";
  waste_errorMessage: string | null;
  waste_locationLongitude: number;
  waste_locationLatitude: number;
  waste_locationAddress: string | null;
  waste_createdAt: string;
  waste_updatedAt: string;
  waste_wasteCategories: WasteCategory[];
  waste_user?: User;
}

interface WasteAnalysisResponse {
  success: boolean;
  message: string;
  data: WasteAnalysisItem;
  pointsAwarded: number;
}

interface PaginatedResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: WasteAnalysisItem[];
}

interface AnalyzeWasteParams {
  image: File;
  latitude: number;
  longitude: number;
  address: string;
}

interface SingleWasteAnalysisResponse {
  success: boolean;
  data: WasteAnalysisItem;
}

// -------------------- Mutation: Analyze Waste --------------------
export function useAnalyzeWaste() {
  const queryClient = useQueryClient();

  const {
    mutate: analyzeWaste,
    isPending: isAnalyzing,
    data,
    error,
  } = useMutation({
    mutationFn: async ({
      image,
      latitude,
      longitude,
      address,
    }: AnalyzeWasteParams) => {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("latitude", latitude.toString());
      formData.append("longitude", longitude.toString());
      formData.append("address", address);

      const response = await fetch(`${API_URL}/waste-analysis`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to analyze waste");
      }

      const data: WasteAnalysisResponse = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["wasteAnalysis", "history"],
        refetchType: "active",
      });

      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });

      // ✅ Invalidate notifications directly
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
      toast.success(
        `${data.message} You earned ${data.pointsAwarded} points!`,
        {
          duration: 5000,
        }
      );
    },
    onError: (error: Error) => {
      toast.error(
        error.message || "Failed to analyze waste. Please try again."
      );
    },
  });

  return { analyzeWaste, isAnalyzing, data, error };
}

// -------------------- Infinite Query: Waste Analysis History --------------------
export function useWasteAnalysisHistoryInfinite(limit = 10) {
  return useInfiniteQuery<PaginatedResponse, Error>({
    queryKey: ["wasteAnalysis", "history"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `${API_URL}/waste-analysis?page=${pageParam}&limit=${limit}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to fetch waste analysis history");
      const json = await res.json();
      return json;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages
        ? lastPage.page + 1
        : undefined;
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Get single waste analysis (with admin support)
export function useWasteAnalysis(id: string, isAdmin: boolean = true) {
  return useQuery({
    queryKey: ["wasteAnalysis", id],
    queryFn: async () => {
      // Use admin endpoint if isAdmin flag is true
      const endpoint = isAdmin 
        ? `${API_URL}/waste-analysis/admin/${id}`
        : `${API_URL}/waste-analysis/${id}`;
        
      const response = await fetch(endpoint, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch waste analysis");
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

// -------------------- Infinite Query: Admin Waste Reports --------------------
export function useAdminWasteReportsInfinite(limit = 10) {
  return useInfiniteQuery<PaginatedResponse, Error>({
    queryKey: ["adminWasteReports", "all"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `${API_URL}/waste-analysis/admin/all?page=${pageParam}&limit=${limit}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to fetch admin waste reports");

      const json = await res.json();
      return json;
    },

    initialPageParam: 1,

    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages
        ? lastPage.page + 1
        : undefined;
    },

    staleTime: 1000 * 60 * 2,
  });
}


// Add to useWasteAnalysis.ts
export function useAdminWasteAnalysis(id: string) {
  return useQuery({
    queryKey: ["adminWasteAnalysis", id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/waste-analysis/admin/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch waste analysis");
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}