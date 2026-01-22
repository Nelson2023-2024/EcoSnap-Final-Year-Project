import { API_URL } from "@/lib/api-url";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

interface CreateTeamParams {
  name: string;
  specialization:
    | "general"
    | "recyclables"
    | "e_waste"
    | "organic"
    | "hazardous";
}

interface UpdateTeamParams {
  id: string;
  name?: string;
  specialization?:
    | "general"
    | "recyclables"
    | "e_waste"
    | "organic"
    | "hazardous";
  status?: "active" | "off_duty";
}

interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  user: {
    user_id: string;
    user_fullName: string;
    user_email: string;
    user_role: string;
    user_phoneNumber: string;
    user_profileImage?: string;
  };
}

interface Truck {
  truck_id: string;
  truck_registrationNumber: string;
  truck_truckType: string;
  truck_status: string;
  truck_capacity: number;
  truck_imageURL?: string;
}

interface Team {
  team_id: string;
  team_name: string;
  team_specialization: string;
  team_status: string;
  team_createdAt: string;
  team_updatedAt: string;
  team_members?: TeamMember[];
  team_trucks?: Truck[];
  _count?: {
    team_dispatches: number;
    team_members?: number;
  };
}

// CREATE TEAM
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, specialization }: CreateTeamParams) => {
      const res = await fetch(`${API_URL}/teams`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, specialization }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to create team");
      }

      const json = await res.json();
      return json.data as Team;
    },
    onSuccess: () => {
      toast.success("Team created successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });

      // ✅ Invalidate notifications directly
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create team");
    },
  });
}

// GET ALL TEAMS
export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/teams`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }

      const data = await response.json();
      return data.data as Team[];
    },
  });
}

// GET SINGLE TEAM
export function useTeam(id: string) {
  return useQuery({
    queryKey: ["teams", id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/teams/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch team");
      }

      const data = await response.json();
      return data.data as Team;
    },
    enabled: !!id,
  });
}

// UPDATE TEAM
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      specialization,
      status,
    }: UpdateTeamParams) => {
      const res = await fetch(`${API_URL}/teams/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, specialization, status }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update team");
      }

      const json = await res.json();
      return json.data as Team;
    },
    onSuccess: (data) => {
      toast.success("Team updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams", data.team_id] });

      // ✅ Invalidate notifications directly
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update team");
    },
  });
}

// DELETE TEAM
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/teams/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to delete team");
      }

      return id;
    },
    onSuccess: () => {
      toast.success("Team deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });

      // ✅ Invalidate notifications directly
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete team");
    },
  });
}
