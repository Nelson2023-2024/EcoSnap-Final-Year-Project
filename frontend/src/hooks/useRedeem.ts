// frontend/src/hooks/useRedeem.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { API_URL } from "@/lib/api-url";

interface RedeemResponse {
  success: boolean;
  message: string;
  data: {
    product: any;
    remainingPoints: number;
  };
}

export function useRedeemProduct() {
  const queryClient = useQueryClient();

  return useMutation<RedeemResponse, Error, string>({
    mutationFn: async (productId: string) => {
      const response = await fetch(`${API_URL}/redeem/${productId}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to redeem product");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message, { 
        duration: 4000,
        icon: "🎉",
      });

      // Invalidate queries to refresh user points and products
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to redeem product");
    },
  });
}