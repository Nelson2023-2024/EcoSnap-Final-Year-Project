// frontend/src/app/(collector)/layout.tsx
"use client";

import { useAuthCollector } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import CollectorNavbar from "@/components/CollectorNavbar";

export default function CollectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading } = useAuthCollector();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "collector")) {
      router.push("/collector-login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-eco-primary mx-auto" />
          <p className="text-muted-foreground">Loading collector portal...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "collector") {
    return null;
  }

  return (
    <>
      <CollectorNavbar />
      {children}
    </>
  );
}