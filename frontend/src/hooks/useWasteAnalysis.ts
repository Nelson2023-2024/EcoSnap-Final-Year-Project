import { API_URL } from "@/lib/api-url";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Types
interface WasteCategory {
  type: string;
  estimatedPercentage: number;
}

interface WasteAnalysisItem {
  _id: string;
  analysedBy: string;
  imageURL: string;
  containsWaste: boolean;
  wasteCategories: WasteCategory[];
  dominantWasteType: string | null;
  estimatedVolume: {
    value: number;
    unit: "kg" | "liters" | "cubic_meters";
  };
  possibleSource: string;
  environmentalImpact: string;
  confidenceLevel: string;
  status:
    | "pending_dispatch"
    | "dispatched"
    | "collected"
    | "no_waste"
    | "error";
  errorMessage: string | null;
  location: {
    type: "Point";
    coordinates: [number, number];
    address: string;
  };
  createdAt: string;
  updatedAt: string;
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
      // Method 1: Invalidate with refetchType to ensure active queries refetch
      queryClient.invalidateQueries({
        queryKey: ["wasteAnalysis", "history"],
        refetchType: "active", // This ensures active queries are refetched immediately
      });

      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
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
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useWasteAnalysis(id: string | undefined) {
  return useQuery<WasteAnalysisItem, Error>({
    queryKey: ["wasteAnalysis", id],
    enabled: !!id, // Prevents running before id exists

    queryFn: async () => {
      const res = await fetch(`${API_URL}/waste-analysis/${id}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch report");
      }

      const json: SingleWasteAnalysisResponse = await res.json();
      return json.data;
    },

    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
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

    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
  });
}
