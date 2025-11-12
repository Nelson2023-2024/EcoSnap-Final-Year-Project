"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  Menu,
  X,
  User,
  Moon,
  Sun,
  Home,
  Upload,
  Gift,
  History,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const navItems = [
    { title: "Dashboard", href: "/user-dashboard", icon: Home },
    { title: "Report Waste", href: "/report", icon: Upload },
    { title: "History", href: "/report-history", icon: History },
    { title: "Rewards", href: "/rewards", icon: Gift },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-eco-primary flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Eco<span className="text-eco-primary">Snap</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={
                      isActive
                        ? "bg-eco-primary text-white hover:bg-eco-primary/90"
                        : ""
                    }
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
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

            <Link href="/login">
              <Button variant="outline">
                <User className="mr-2 w-4 h-4" />
                Sign In
              </Button>
            </Link>

            <Button className="bg-eco-primary text-white hover:bg-eco-primary/85">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border">
            {navItems.map((item) => {
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
                    className={
                      isActive
                        ? "w-full justify-start bg-eco-primary text-white hover:bg-eco-primary/90"
                        : "w-full justify-start"
                    }
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
            <div className="pt-4 space-y-2 border-t border-border">
              {/* Mobile Theme Toggle */}
              <Button
                variant="ghost"
                className="w-full"
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

              <Button variant="outline" className="w-full">
                <User className="mr-2 w-4 h-4" />
                Sign In
              </Button>
              <Button className="w-full bg-eco-primary text-white hover:bg-eco-primary/90">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
