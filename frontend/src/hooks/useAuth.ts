import { API_URL } from "@/lib/api-url";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
//useQuery - GET || useMutation -> POST,GET,PUT,DELETE



//get the autheniticated user
export function useAuthUser() {
  return useQuery({
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
