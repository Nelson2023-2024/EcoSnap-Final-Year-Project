// frontend/src/components/CollectorNavbar.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Menu,
  X,
  Moon,
  Sun,
  Home,
  Package,
  CheckCircle,
  LogOut,
  Bell,
  UserCircle,
  Users,
  Navigation,
  BarChart3,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthCollector } from "@/hooks/useAuth";
import { useLogout } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useNotification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCollectorStats } from "@/hooks/useCollector";

const CollectorNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useAuthCollector();
  const { logout, isLoggingOut } = useLogout();
  const { data: unreadCount } = useUnreadCount();
  const { data: stats } = useCollectorStats();

  const navItems = [
    { 
      title: "Dashboard", 
      href: "/collector-dashboard", 
      icon: Home,
      badge: null 
    },
    { 
      title: "Active Tasks", 
      href: "/collector/dispatches", 
      icon: Navigation,
      badge: stats ? (stats.pendingDispatches + stats.enRouteDispatches) : null
    },
    { 
      title: "Completed", 
      href: "/collector/completed", 
      icon: CheckCircle,
      badge: null
    },
    { 
      title: "Team", 
      href: "/collector/team", 
      icon: Users,
      badge: null
    },
  ];

  const hasUnreadNotifications = unreadCount && unreadCount > 0;
  const activeTasksCount = stats ? (stats.pendingDispatches + stats.enRouteDispatches) : 0;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={user ? "/collector-dashboard" : "/"}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-eco-primary flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Eco<span className="text-eco-primary">Snap</span>
              <span className="ml-2 text-xs bg-eco-primary/10 text-eco-primary px-2 py-1 rounded-full font-medium">
                Collector
              </span>
            </span>
          </Link>

          {/* Desktop Menu - Only show if authenticated */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`relative ${
                        isActive
                          ? "bg-eco-primary text-white hover:bg-eco-primary/90"
                          : ""
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                      {item.badge !== null && item.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 h-5 min-w-5 px-1.5 text-xs"
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Active Tasks Quick View */}
            {user && activeTasksCount > 0 && (
              <Link href="/collector/dispatches">
                <Button
                  variant="outline"
                  className="relative border-eco-primary/50 hover:bg-eco-primary/10"
                >
                  <Navigation className="mr-2 h-4 w-4 text-eco-primary" />
                  <span className="font-semibold">{activeTasksCount}</span>
                  <span className="ml-1 text-muted-foreground">Active</span>
                </Button>
              </Link>
            )}

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="transition-all"
            >
              {theme === "dark" ? (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {isLoading ? (
              <div className="w-20 h-10 bg-muted animate-pulse rounded" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-eco-primary/20">
                      <AvatarImage
                        src={user.profileImage || ""}
                        alt={user.fullName || "Collector"}
                      />
                      <AvatarFallback className="bg-eco-primary text-white">
                        {user.fullName?.charAt(0).toUpperCase() || "C"}
                      </AvatarFallback>
                    </Avatar>
                    {/* Notification Badge on Avatar */}
                    {hasUnreadNotifications && (
                      <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-background">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.fullName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <Badge 
                        variant="outline" 
                        className="w-fit mt-1 bg-eco-primary/10 text-eco-primary border-eco-primary/20"
                      >
                        Collector
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/collector/profile">
                    <DropdownMenuItem>
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/collector/stats">
                    <DropdownMenuItem>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>My Statistics</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/notifications">
                    <DropdownMenuItem>
                      <div className="relative mr-2">
                        <Bell className="h-4 w-4" />
                        {hasUnreadNotifications && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500"></span>
                        )}
                      </div>
                      <span>Notifications</span>
                      {hasUnreadNotifications && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 min-w-5 px-1.5 text-xs"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/collector-login">
                <Button className="bg-eco-primary text-white hover:bg-eco-primary/85">
                  <Truck className="mr-2 w-4 h-4" />
                  Collector Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground relative"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <>
                <Menu className="w-6 h-6" />
                {/* Combined Badge for Notifications + Active Tasks */}
                {user && (hasUnreadNotifications || activeTasksCount > 0) && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {(unreadCount || 0) + activeTasksCount > 9 ? "9+" : (unreadCount || 0) + activeTasksCount}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border">
            {/* Active Tasks Alert for Mobile */}
            {user && activeTasksCount > 0 && (
              <Link
                href="/collector/dispatches"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="mx-2 p-3 rounded-lg bg-eco-primary/10 border border-eco-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-eco-primary" />
                    <span className="font-medium text-eco-primary">
                      {activeTasksCount} Active Task{activeTasksCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <Badge className="bg-eco-primary">
                    View
                  </Badge>
                </div>
              </Link>
            )}

            {user &&
              navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`relative ${
                        isActive
                          ? "w-full justify-start bg-eco-primary text-white hover:bg-eco-primary/90"
                          : "w-full justify-start"
                      }`}
                    >
                      <Icon className="mr-2 h-5 w-5" />
                      {item.title}
                      {item.badge !== null && item.badge > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto h-5 min-w-5 px-1.5 text-xs"
                        >
                          {item.badge > 99 ? "99+" : item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            <div className="pt-4 space-y-2 border-t border-border">
              {/* Mobile Theme Toggle */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" /> Dark Mode
                  </>
                )}
              </Button>

              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Signed in as{" "}
                    <span className="font-medium text-foreground">
                      {user.fullName}
                    </span>
                    <Badge 
                      variant="outline" 
                      className="ml-2 bg-eco-primary/10 text-eco-primary border-eco-primary/20 text-xs"
                    >
                      Collector
                    </Badge>
                  </div>
                  <Link href="/collector/profile" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <UserCircle className="mr-2 w-4 h-4" />
                      Profile
                    </Button>
                  </Link>
                  <Link href="/collector/stats" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <BarChart3 className="mr-2 w-4 h-4" />
                      My Statistics
                    </Button>
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start relative"
                    >
                      <div className="relative mr-2">
                        <Bell className="w-4 h-4" />
                        {hasUnreadNotifications && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500"></span>
                        )}
                      </div>
                      <span>Notifications</span>
                      {hasUnreadNotifications && (
                        <Badge
                          variant="destructive"
                          className="ml-auto h-5 min-w-5 px-1.5 text-xs"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 w-4 h-4" />
                    {isLoggingOut ? "Logging out..." : "Log out"}
                  </Button>
                </>
              ) : (
                <Link href="/collector-login" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-eco-primary text-white hover:bg-eco-primary/90">
                    <Truck className="mr-2 w-4 h-4" />
                    Collector Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default CollectorNavbar;