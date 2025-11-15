import { API_URL } from "@/lib/api-url";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Types
interface WasteCategory {
  type: string;
  estimatedPercentage: number;
}

interface WasteAnalysisResponse {
  success: boolean;
  message: string;
  data: {
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
      coordinates: [number, number]; // [longitude, latitude]
      address: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  pointsAwarded: number;
}

interface AnalyzeWasteParams {
  image: File;
  latitude: number;
  longitude: number;
  address: string;
}

// Submit waste analysis
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
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["wasteAnalysis"] });
      queryClient.invalidateQueries({ queryKey: ["authUser"] }); // Update user points

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

// Get user's waste analysis history
export function useWasteAnalysisHistory() {
  return useQuery({
    queryKey: ["wasteAnalysis", "history"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/waste-analysis/history`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch waste analysis history");
      }

      const data = await response.json();
      return data.data;
    },
  });
}

// Get single waste analysis by ID
export function useWasteAnalysisById(id: string) {
  return useQuery({
    queryKey: ["wasteAnalysis", id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/waste-analysis/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch waste analysis");
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!id, // Only run query if id exists
  });
}
