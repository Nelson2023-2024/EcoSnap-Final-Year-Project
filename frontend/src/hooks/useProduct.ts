// frontend/src/hooks/useProduct.ts
import { API_URL } from "@/lib/api-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useEffect } from "react";

// ------------------- Types -------------------
export interface Product {
  product_id: string;
  product_name: string;
  product_description?: string;
  product_imageURL: string;
  product_pointsCost: number;
  product_stock: number;
  product_isAvailable: boolean;
  product_createdAt: string;
  product_updatedAt: string;
}

interface CreateProductParams {
  productName: string;
  productDescription: string;
  productPointsCost: number;
  productStock: number;
  productImage: File;
}

// ------------------- Fetch all products -------------------
export function useProducts() {
  const query = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/product`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();

      // API might return { message: string } when empty
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Handle errors with useEffect instead
  useEffect(() => {
    if (query.error) {
      toast.error(query.error.message || "Failed to load products");
    }
  }, [query.error]);

  return query;
}

// ------------------- Create new product -------------------
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productName,
      productDescription,
      productPointsCost,
      productStock,
      productImage,
    }: CreateProductParams) => {
      const formData = new FormData();
      formData.append("productName", productName);
      formData.append("productDescription", productDescription);
      formData.append("productPointsCost", productPointsCost.toString());
      formData.append("productStock", productStock.toString());
      formData.append("productImage", productImage);

      const res = await fetch(`${API_URL}/product`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create product");
      }

      const json = await res.json();
      return json.data as Product;
    },
    onSuccess: (data) => {
      toast.success("Product created successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create product");
    },
  });
}