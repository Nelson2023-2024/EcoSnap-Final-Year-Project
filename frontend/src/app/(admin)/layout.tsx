"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSideBar";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <ProtectedRoute requiredRole="admin">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main Section */}
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b bg-card flex items-center px-6 sticky top-0 z-10 justify-between">
              {/* Left: Sidebar Trigger + Title */}
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold">
                  EcoWaste Management System
                </h1>
              </div>

              {/* Right: Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setTheme(theme === "dark" ? "light" : "dark")
                }
                className="transition-all"
              >
                {theme === "dark" ? (
                  <Sun className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem]" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </header>

            <main className="flex-1 p-6 bg-muted/30">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
