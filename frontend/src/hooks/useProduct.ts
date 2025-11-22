import { API_URL } from "@/lib/api-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Get all products
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/product`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      return data.data || [];
    },
  });
}

// Get single product
export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/product/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

// Create product
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: {
      productName: string;
      productDescription: string;
      productPointsCost: number;
      productStock: number;
      productImage: File;
    }) => {
      const formData = new FormData();
      formData.append("productName", productData.productName);
      formData.append("productDescription", productData.productDescription);
      formData.append("productPointsCost", productData.productPointsCost.toString());
      formData.append("productStock", productData.productStock.toString());
      formData.append("productImage", productData.productImage);

      const response = await fetch(`${API_URL}/product`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create product");
    },
  });
}

// Update product
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      productName,
      productDescription,
      productPointsCost,
      productStock,
      productIsAvailable,
      productImage,
    }: {
      id: string;
      productName?: string;
      productDescription?: string;
      productPointsCost?: number;
      productStock?: number;
      productIsAvailable?: boolean;
      productImage?: File;
    }) => {
      const formData = new FormData();
      if (productName) formData.append("productName", productName);
      if (productDescription) formData.append("productDescription", productDescription);
      if (productPointsCost !== undefined) formData.append("productPointsCost", productPointsCost.toString());
      if (productStock !== undefined) formData.append("productStock", productStock.toString());
      if (productIsAvailable !== undefined) formData.append("productIsAvailable", productIsAvailable.toString());
      if (productImage) formData.append("productImage", productImage);

      const response = await fetch(`${API_URL}/product/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product");
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", data._id] });
      toast.success("Product updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update product");
    },
  });
}

// Delete product
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/product/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete product");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete product");
    },
  });
}