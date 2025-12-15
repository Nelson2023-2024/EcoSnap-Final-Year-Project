"use client";
import {
  LayoutDashboard,
  FileText,
  Users,
  Truck,
  Store,
  Bell,
  User,
  Shovel
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
import { useAdminUnreadCount } from "@/hooks/useNotification";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: User },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Teams", url: "/admin/teams", icon: Users },
  { title: "Trucks", url: "/admin/trucks", icon: Truck },
  { title: "Dispatch", url: "/admin/dispatch", icon: Shovel },
  { title: "Eco Store", url: "/admin/store", icon: Store },
  { title: "Notifications", url: "/admin/notifications", icon: Bell, showBadge: true },
];

export function AdminSidebar() {
  const { open } = useSidebar();
  const pathname = usePathname();
  const { data: unreadCount } = useAdminUnreadCount();

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

                const showBadge = item.showBadge && unreadCount && unreadCount > 0;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={`hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1 transition relative ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : ""
                        }`}
                      >
                        <div className="relative">
                          <item.icon className="h-4 w-4" />
                          {showBadge && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </div>
                        {open && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.title}</span>
                            {showBadge && (
                              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                                {unreadCount > 99 ? "99+" : unreadCount}
                              </span>
                            )}
                          </div>
                        )}
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