// import AdminSidebar from "@/components/layout/AdminSidebar";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRole="admin">
       <div className="flex h-screen overflow-hidden">
      {/* <AdminSidebar /> */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
    </ProtectedRoute>
   
  );
}