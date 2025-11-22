"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, User, Trash2, LoaderIcon } from "lucide-react";
import { useCreateTeam, useTeams, useDeleteTeam, useUpdateTeam } from "@/hooks/useTeams";
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

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Specialization = "general" | "recyclables" | "e-waste" | "organic" | "hazardous";

export default function Teams() {
  const { data: teams, isLoading, error } = useTeams();
  const createTeamMutation = useCreateTeam();
  const deleteTeamMutation = useDeleteTeam();
  const updateTeamMutation = useUpdateTeam();

  const [teamName, setTeamName] = React.useState("");
  const [specialization, setSpecialization] = React.useState<Specialization | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Update dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [selectedTeam, setSelectedTeam] = React.useState<any>(null);
  const [updateTeamName, setUpdateTeamName] = React.useState("");
  const [updateSpecialization, setUpdateSpecialization] = React.useState<Specialization | undefined>(undefined);
  const [updateStatus, setUpdateStatus] = React.useState<"active" | "off_duty">("active");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName || !specialization) {
      toast.error("Team name and specialization are required");
      return;
    }

    try {
      await createTeamMutation.mutateAsync({ name: teamName, specialization });
      setDialogOpen(false);
      setTeamName("");
      setSpecialization(undefined);
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const handleDelete = async (teamId: string, teamName: string) => {
    if (window.confirm(`Are you sure you want to delete team "${teamName}"? This action cannot be undone.`)) {
      try {
        await deleteTeamMutation.mutateAsync(teamId);
      } catch (err) {
        // Error is already handled in the hook
      }
    }
  };

  const handleManageTeam = (team: any) => {
    setSelectedTeam(team);
    setUpdateTeamName(team.team_name);
    setUpdateSpecialization(team.team_specialization as Specialization);
    setUpdateStatus(team.team_status);
    setUpdateDialogOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!updateTeamName || !updateSpecialization) {
      toast.error("Team name and specialization are required");
      return;
    }

    try {
      await updateTeamMutation.mutateAsync({
        id: selectedTeam._id,
        name: updateTeamName,
        specialization: updateSpecialization,
        status: updateStatus,
      });
      setUpdateDialogOpen(false);
      setSelectedTeam(null);
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const getSpecializationColor = (type: string) => {
    switch (type) {
      case "recyclables":
        return "bg-accent/20 text-accent-foreground";
      case "e-waste":
        return "bg-yellow-200 text-yellow-900";
      case "organic":
        return "bg-green-200 text-green-900";
      case "general":
        return "bg-secondary text-secondary-foreground";
      case "hazardous":
        return "bg-red-200 text-red-900";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

 if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderIcon className="h-8 w-8 animate-spin text-eco-primary" />
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }
  if (error)
    return (
      <p className="text-center text-red-500 py-10">Failed to load teams</p>
    );
  if (!teams || teams.length === 0)
    return <p className="text-center py-10">No teams available</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Teams Management
          </h2>
          <p className="text-muted-foreground">
            Manage your waste collection teams
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Team</DialogTitle>
              <DialogDescription>
                Enter team details below and click save to create a new team.
              </DialogDescription>
            </DialogHeader>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-3">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="specialization">Specialization</Label>
                <Select
                  value={specialization}
                  onValueChange={(value) => setSpecialization(value as Specialization)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Specialization</SelectLabel>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="recyclables">Recyclables</SelectItem>
                      <SelectItem value="e-waste">E-Waste</SelectItem>
                      <SelectItem value="organic">Organic</SelectItem>
                      <SelectItem value="hazardous">Hazardous</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={createTeamMutation.isPending}>
                  {createTeamMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team: any) => (
          <Card key={team._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{team.team_name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{team._id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      team.team_status === "active" ? "default" : "secondary"
                    }
                  >
                    {team.team_status}
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(team._id, team.team_name)}
                    disabled={deleteTeamMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getSpecializationColor(
                    team.team_specialization
                  )}`}
                >
                  {team.team_specialization}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Team Members</span>
                  <span className="font-medium text-foreground">
                    {team.team_members?.length || 0}
                  </span>
                </div>

                <div className="space-y-1">
                  {team.team_members?.map((member: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <User className="h-3 w-3 text-muted-foreground" />
                      {member.fullName}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assigned Trucks</span>
                <span className="font-medium text-foreground">
                  {team.team_trucks?.length || 0}
                </span>
              </div>

              <Button variant="outline" className="w-full" onClick={() => handleManageTeam(team)}>
                Manage Team
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Update Team Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Team</DialogTitle>
            <DialogDescription>
              Update team details below and click save to apply changes.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleUpdateSubmit}>
            <div className="grid gap-3">
              <Label htmlFor="update-name">Team Name</Label>
              <Input
                id="update-name"
                name="name"
                placeholder="Enter team name"
                value={updateTeamName}
                onChange={(e) => setUpdateTeamName(e.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-specialization">Specialization</Label>
              <Select
                value={updateSpecialization}
                onValueChange={(value) => setUpdateSpecialization(value as Specialization)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Specialization</SelectLabel>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="recyclables">Recyclables</SelectItem>
                    <SelectItem value="e-waste">E-Waste</SelectItem>
                    <SelectItem value="organic">Organic</SelectItem>
                    <SelectItem value="hazardous">Hazardous</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-status">Status</Label>
              <Select
                value={updateStatus}
                onValueChange={(value) => setUpdateStatus(value as "active" | "off_duty")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="off_duty">Off Duty</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={updateTeamMutation.isPending}>
                {updateTeamMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}