import { API_URL } from "@/lib/api-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
//useQuery - GET || useMutation -> POST,GET,PUT,DELETE



//get the autheniticated user
export function useAuthUser() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    },
  });

  // ✅ Side-effects belong here in v5
  useEffect(() => {
    if (!query.data) return;

    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
  }, [query.data, queryClient]);

  return query;
}

//login
export function useGoogleLogin() {
  return {
    loginWithGoogle: () => {
      // Redirect to backend Google OAuth
      window.location.href = `${API_URL}/auth/google`;
    },
  };
}

//logout
export function useLogout() {
  const queryClient = useQueryClient();
   const router = useRouter();

  const { mutate: logout, isPending: isLoggingOut } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response) throw new Error("Logout failed");

      const data = await response.json();

      return data;
    },
    onSuccess: () => {
      queryClient.setQueryData(["authUser"], null);
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Logged out successfully!");
      router.push("/login");
    },
    onError: async (error: Error) => {
      toast.error(error.message || "failed to logout");
    },
  });

  return { logout, isLoggingOut };
}

// Collector login
export function useCollectorLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: loginCollector, isPending: isLoggingIn } = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch(`${API_URL}/collector-auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["authUser"], data.user);
      toast.success("Login successful!");
      router.push("/collector-dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to login");
    },
  });

  return { loginCollector, isLoggingIn };
}

// Get authenticated collector
export function useAuthCollector() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["authCollector"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/collector-auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.user;
    },
  });

  useEffect(() => {
    if (!query.data) return;

    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [query.data, queryClient]);

  return query;
}