"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Award, UserCog, Plus, Trash2, Edit, LoaderIcon, Eye, EyeOff } from "lucide-react";
import { useUsers, useCreateCollector, useDeleteUser, useUpdateUser } from "@/hooks/useUser";
import { useTeams } from "@/hooks/useTeams";
import { toast } from "react-hot-toast";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Users() {
  const { data: users, isLoading, error } = useUsers();
  const { data: teams } = useTeams();
  const createCollectorMutation = useCreateCollector();
  const deleteUserMutation = useDeleteUser();
  const updateUserMutation = useUpdateUser();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "admin" | "collector" | "user">("all");
  
  // Create collector dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [assignedTeam, setAssignedTeam] = React.useState<string>("");
  const [password, setPassword] = React.useState("");

  // Update user dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [updateFirstName, setUpdateFirstName] = React.useState("");
  const [updateLastName, setUpdateLastName] = React.useState("");
  const [updateEmail, setUpdateEmail] = React.useState("");
  const [updateUsername, setUpdateUsername] = React.useState("");
  const [updatePhoneNumber, setUpdatePhoneNumber] = React.useState("");
  const [updatePassword, setUpdatePassword] = React.useState("");
  const [updatePoints, setUpdatePoints] = React.useState("");
  const [updateRole, setUpdateRole] = React.useState("");
  const [updateAssignedTeams, setUpdateAssignedTeams] = React.useState<string[]>([]);
  const [showPassword, setShowPassword] = React.useState(false);

  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch =
      user.user_fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || user.user_role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleCreateCollector = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !firstName || !lastName || !assignedTeam || !password) {
      toast.error("All fields are required");
      return;
    }

    // Password validation
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      await createCollectorMutation.mutateAsync({
        email,
        firstName,
        lastName,
        assignedTeam,
        password,
      });
      setCreateDialogOpen(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      setAssignedTeam("");
      setPassword("");
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const handleDelete = async (userId: string, userName: string | null) => {
    if (window.confirm(`Are you sure you want to delete user "${userName || 'this user'}"? This action cannot be undone.`)) {
      try {
        await deleteUserMutation.mutateAsync(userId);
      } catch (err) {
        // Error is already handled in the hook
      }
    }
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUpdateFirstName(user.user_firstName || "");
    setUpdateLastName(user.user_lastName || "");
    setUpdateEmail(user.user_email || "");
    setUpdateUsername(user.user_username || "");
    setUpdatePhoneNumber(user.user_phoneNumber || "");
    setUpdatePassword("");
    setUpdatePoints(user.user_points?.toString() || "0");
    setUpdateRole(user.user_role || "user");
    setUpdateAssignedTeams(user.user_assignedTeams?.map((t: any) => t.team_id) || []);
    setUpdateDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!updateFirstName || !updateLastName || !updateEmail || !updateUsername) {
      toast.error("First name, last name, email, and username are required");
      return;
    }

    // Password validation if provided
    if (updatePassword && updatePassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      const updateData: any = {
        id: selectedUser.user_id,
        firstName: updateFirstName,
        lastName: updateLastName,
        email: updateEmail,
        username: updateUsername,
        phoneNumber: updatePhoneNumber,
        points: parseInt(updatePoints) || 0,
        role: updateRole,
        assignedTeams: updateAssignedTeams,
      };

      // Only include password if it's not empty
      if (updatePassword) {
        updateData.password = updatePassword;
      }

      await updateUserMutation.mutateAsync(updateData);
      setUpdateDialogOpen(false);
      setSelectedUser(null);
      setUpdatePassword("");
      setShowPassword(false);
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const toggleTeamSelection = (teamId: string) => {
    setUpdateAssignedTeams((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  };

  // Calculate statistics
  const totalUsers = users?.length || 0;
  const activeCollectors = users?.filter((u: any) => u.user_role === "collector").length || 0;
  const totalAdmins = users?.filter((u: any) => u.user_role === "admin").length || 0;
  const regularUsers = users?.filter((u: any) => u.user_role === "user").length || 0;
  const totalPoints = users?.reduce((sum: number, u: any) => sum + (u.totalPoints || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="h-8 w-8 animate-spin text-eco-primary" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">Failed to load users</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage user accounts and track their contributions.</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Collector
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Collector</DialogTitle>
              <DialogDescription>
                Enter collector details below and click save to create a new collector.
              </DialogDescription>
            </DialogHeader>

            <form className="grid gap-4" onSubmit={handleCreateCollector}>
              <div className="grid gap-3">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="assignedTeam">Assigned Team</Label>
                <Select value={assignedTeam} onValueChange={setAssignedTeam}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Teams</SelectLabel>
                      {teams?.map((team: any) => (
                        <SelectItem key={team.team_id} value={team.team_id}>
                          {team.team_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={createCollectorMutation.isPending}>
                  {createCollectorMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCog className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Collectors</CardTitle>
            <Award className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCollectors}</div>
            <p className="text-xs text-muted-foreground">Field collectors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points Earned</CardTitle>
            <Award className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>View and manage registered users</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: any) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(user.user_fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.user_fullName || "N/A"}</p>
                          <p className="text-sm text-muted-foreground">{user.user_username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.user_email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.user_role === "admin"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : user.user_role === "collector"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {user.user_role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-warning" />
                        <span className="font-medium">{(user.totalPoints || 0).toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.totalReports || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(user.user_id, user.user_fullName)}
                          disabled={deleteUserMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update User Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
            <DialogDescription>
              Update user details below and click save to apply changes.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleUpdateUser}>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-3">
                <Label htmlFor="update-firstName">First Name *</Label>
                <Input
                  id="update-firstName"
                  placeholder="Enter first name"
                  value={updateFirstName}
                  onChange={(e) => setUpdateFirstName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="update-lastName">Last Name *</Label>
                <Input
                  id="update-lastName"
                  placeholder="Enter last name"
                  value={updateLastName}
                  onChange={(e) => setUpdateLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-email">Email *</Label>
              <Input
                id="update-email"
                type="email"
                placeholder="Enter email"
                value={updateEmail}
                onChange={(e) => setUpdateEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-username">Username *</Label>
              <Input
                id="update-username"
                placeholder="Enter username"
                value={updateUsername}
                onChange={(e) => setUpdateUsername(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-phoneNumber">Phone Number</Label>
              <Input
                id="update-phoneNumber"
                placeholder="Enter phone number"
                value={updatePhoneNumber}
                onChange={(e) => setUpdatePhoneNumber(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-password">
                New Password (Leave empty to keep current)
              </Label>
              <div className="relative">
                <Input
                  id="update-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (min 6 characters)"
                  value={updatePassword}
                  onChange={(e) => setUpdatePassword(e.target.value)}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-3">
                <Label htmlFor="update-points">Points</Label>
                <Input
                  id="update-points"
                  type="number"
                  placeholder="Enter points"
                  value={updatePoints}
                  onChange={(e) => setUpdatePoints(e.target.value)}
                  min="0"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="update-role">Role</Label>
                <Select value={updateRole} onValueChange={setUpdateRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="collector">Collector</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedUser?.user_role === "collector" || updateRole === "collector") && (
              <div className="grid gap-3">
                <Label>Assigned Teams</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {teams && teams.length > 0 ? (
                    teams.map((team: any) => (
                      <div key={team.team_id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`team-${team.team_id}`}
                          checked={updateAssignedTeams.includes(team.team_id)}
                          onChange={() => toggleTeamSelection(team.team_id)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`team-${team.team_id}`} className="text-sm cursor-pointer">
                          {team.team_name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No teams available</p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}