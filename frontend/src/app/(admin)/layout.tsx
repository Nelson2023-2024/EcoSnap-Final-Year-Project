"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSideBar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main Section */}
          <div className="flex-1 flex flex-col">
            <header className="h-16 border-b bg-card flex items-center px-6 sticky top-0 z-10">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold">EcoWaste Management System</h1>
            </header>

            <main className="flex-1 p-6 bg-muted/30">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
