"use client";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ProtectedRoute requiredRole="user">
        <Navbar />
        <main className="pt-16">{children}</main>
      </ProtectedRoute>
    </>
  );
}
