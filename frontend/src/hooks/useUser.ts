import { API_URL } from "@/lib/api-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

interface Team {
  team_id: string;
  team_name: string;
  team_specialization: string;
  team_status: string;
}

interface User {
  user_id: string;
  user_email: string;
  user_username: string;
  user_firstName: string | null;
  user_lastName: string | null;
  user_fullName: string | null;
  user_phoneNumber: string | null;
  user_profileImage: string | null;
  user_role: string;
  user_points: number;
  user_createdAt: string;
  user_updatedAt: string;
  user_assignedTeams: Team[];
  totalReports: number;
  totalPoints: number;
}

// Get all users
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/user`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      return data.data as User[];
    },
  });
}

// Get single user
export function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/user/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      return data.data as User;
    },
    enabled: !!id,
  });
}

// Create collector
export function useCreateCollector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectorData: {
      email: string;
      firstName: string;
      lastName: string;
      assignedTeam: string;
      password: string; // ✅ Add password field
    }) => {
      const response = await fetch(`${API_URL}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(collectorData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create collector");
      }

      const data = await response.json();
      return data.data as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Collector created successfully!");

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create collector");
    },
  });
}

// Update user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updateData
    }: {
      id: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      phoneNumber?: string;
      assignedTeams?: string[];
    }) => {
      const response = await fetch(`${API_URL}/user/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      const data = await response.json();
      return data.data as User;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", data.user_id] });
      toast.success("User updated successfully!");

      // ✅ Invalidate notifications directly
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });
}

// Delete user
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/user/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully!");

      // ✅ Invalidate notifications directly
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });
}