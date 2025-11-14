"use client";

import { ReactNode, createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuth";

type AuthContextType = {
  user: any | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: user, isLoading } = useAuthUser();
  const router = useRouter();

  // Optional: redirect authenticated user away from login page
  useEffect(() => {
    if (!isLoading && user) {
      const path = window.location.pathname;
      if (path === "/login") {
        router.replace(user.role === "admin" ? "/admin" : "/user-dashboard");
      }
    }
  }, [user, isLoading, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
