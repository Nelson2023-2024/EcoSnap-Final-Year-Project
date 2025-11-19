"use client";
import {
  LayoutDashboard,
  FileText,
  Users,
  Truck,
  Store,
  Bell,
  TruckIcon,
  User2Icon,
  Spade
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: User2Icon },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Teams", url: "/admin/teams", icon: Users },
  { title: "Trucks", url: "/admin/trucks", icon: TruckIcon },
  { title: "Dispatch", url: "/admin/dispatch", icon: Spade },
  { title: "Eco Store", url: "/admin/store", icon: Store },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-semibold">
            EcoWaste Admin
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  item.url === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={`hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1 transition ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : ""
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {open && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
