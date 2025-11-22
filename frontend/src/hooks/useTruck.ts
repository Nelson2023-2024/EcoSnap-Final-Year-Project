import { API_URL } from "@/lib/api-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Get all trucks
export function useTrucks() {
  return useQuery({
    queryKey: ["trucks"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/truck`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch trucks");
      }

      const data = await response.json();
      return data.data;
    },
  });
}

// Get single truck
export function useTruck(id: string) {
  return useQuery({
    queryKey: ["truck", id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/truck/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch truck");
      }

      const data = await response.json();
      return data.data;
    },
    enabled: !!id,
  });
}

// Create truck
export function useCreateTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (truckData: {
      registrationNumber: string;
      truckType: string;
      capacity: number;
      assignedTeam?: string;
      image: File;
    }) => {
      const formData = new FormData();
      formData.append("registrationNumber", truckData.registrationNumber);
      formData.append("truckType", truckData.truckType);
      formData.append("capacity", truckData.capacity.toString());
      if (truckData.assignedTeam) {
        formData.append("assignedTeam", truckData.assignedTeam);
      }
      formData.append("image", truckData.image);

      const response = await fetch(`${API_URL}/truck`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create truck");
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      toast.success("Truck created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create truck");
    },
  });
}

// Update truck
export function useUpdateTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updateData
    }: {
      id: string;
      registrationNumber?: string;
      truckType?: string;
      capacity?: number;
      status?: string;
      assignedTeam?: string;
      imageURL?: string;
    }) => {
      const response = await fetch(`${API_URL}/truck/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update truck");
      }

      const data = await response.json();
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      queryClient.invalidateQueries({ queryKey: ["truck", data._id] });
      toast.success("Truck updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update truck");
    },
  });
}

// Delete truck
export function useDeleteTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/truck/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete truck");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trucks"] });
      toast.success("Truck deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete truck");
    },
  });
}