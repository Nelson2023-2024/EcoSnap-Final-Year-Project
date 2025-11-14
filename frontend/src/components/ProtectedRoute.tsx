"use client";

import { useAuthUser } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderIcon } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "user" | "admin";
}

export default function ProtectedRoute({
  children,
  requiredRole = "user",
}: ProtectedRouteProps) {
  const { data: user, isLoading } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // If user not logged in → redirect to login
      if (!user) {
        router.push("/login");
        return;
      }

      // If admin route but user is not admin → redirect to dashboard
      if (requiredRole === "admin" && user.role !== "admin") {
        router.push("/user-dashboard");
      }
    }
  }, [user, isLoading, router, requiredRole]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoaderIcon className="h-12 w-12 animate-spin text-eco-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in or not authorized (redirect already triggered)
  if (!user) return null;

  if (requiredRole === "admin" && user.role !== "admin") return null;

  // Authenticated and authorized → render children
  return <>{children}</>;
}
