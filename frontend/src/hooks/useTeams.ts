import { API_URL } from "@/lib/api-url";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

interface CreateTeamParams {
  name: string;
  specialization:
    | "general"
    | "recyclables"
    | "e-waste"
    | "organic"
    | "hazardous";
}

interface UpdateTeamParams {
  id: string;
  name?: string;
  specialization?:
    | "general"
    | "recyclables"
    | "e-waste"
    | "organic"
    | "hazardous";
  status?: "active" | "inactive";
}

interface Team {
  _id: string;
  team_name: string;
  team_specialization: string;
  team_status: string;
  team_members?: any[];
  team_trucks?: any[];
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
    onSuccess: (data) => {
      toast.success("Team created successfully!");
      queryClient.invalidateQueries({ queryKey: ["teams"] });
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
    enabled: !!id, // Only run if id is provided
  });
}

// UPDATE TEAM
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, specialization, status }: UpdateTeamParams) => {
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
      queryClient.invalidateQueries({ queryKey: ["teams", data._id] });
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
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete team");
    },
  });
}