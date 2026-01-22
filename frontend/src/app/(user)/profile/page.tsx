"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoaderIcon, User, Mail, Phone, Award } from "lucide-react";
import { toast } from "react-hot-toast";

import { useAuthUser, useUpdateProfile } from "@/hooks/useAuth";

const ProfileSettings = () => {
  const { data: user, isLoading } = useAuthUser();
  const { updateProfile, isUpdating } = useUpdateProfile();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
  });

  // Populate form when user loads
  useEffect(() => {
    if (!user) return;

    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      phoneNumber: user.phoneNumber || "",
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username || form.username.trim() === "") {
      toast.error("Username is required");
      return;
    }

    // Only send fields that have been changed
    const updates: any = {};
    
    if (form.firstName !== (user?.firstName || "")) {
      updates.firstName = form.firstName;
    }
    if (form.lastName !== (user?.lastName || "")) {
      updates.lastName = form.lastName;
    }
    if (form.username !== (user?.username || "")) {
      updates.username = form.username;
    }
    if (form.phoneNumber !== (user?.phoneNumber || "")) {
      updates.phoneNumber = form.phoneNumber;
    }

    // If nothing changed, don't make the request
    if (Object.keys(updates).length === 0) {
      toast.error("No changes to save");
      return;
    }

    updateProfile(updates);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoaderIcon className="h-8 w-8 animate-spin text-eco-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profileImage} alt={user.fullName || "User"} />
              <AvatarFallback className="bg-eco-primary/10 text-eco-primary text-xl">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.fullName || "Welcome"}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
              <div className="flex items-center gap-2 mt-2">
                <Award className="h-4 w-4 text-warning" />
                <span className="font-medium">{user.points || 0} points</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Edit Form */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-6 w-6 text-eco-primary" />
            <h2 className="text-xl font-bold">Edit Profile</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Enter your first name"
                  value={form.firstName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Enter your last name"
                  value={form.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="Enter your phone number"
                value={form.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="pl-9 bg-muted cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>
            </div>

            <Button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-eco-primary hover:bg-eco-primary/90"
            >
              {isUpdating ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;