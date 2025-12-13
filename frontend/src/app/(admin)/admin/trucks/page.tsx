"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Plus, Trash2, Edit, LoaderIcon, Upload, X } from "lucide-react";
import { useTrucks, useCreateTruck, useDeleteTruck, useUpdateTruck } from "@/hooks/useTruck";
import { useTeams } from "@/hooks/useTeams";
import { toast } from "react-hot-toast";
import Image from "next/image";

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

type TruckType = "general" | "recyclables" | "e-waste" | "organic" | "hazardous";
type TruckStatus = "available" | "in_use" | "maintenance";

export default function Trucks() {
  const { data: trucks, isLoading, error } = useTrucks();
  const { data: teams } = useTeams();
  const createTruckMutation = useCreateTruck();
  const deleteTruckMutation = useDeleteTruck();
  const updateTruckMutation = useUpdateTruck();

  // File input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [registrationNumber, setRegistrationNumber] = React.useState("");
  const [truckType, setTruckType] = React.useState<TruckType | undefined>(undefined);
  const [capacity, setCapacity] = React.useState("");
  const [assignedTeam, setAssignedTeam] = React.useState<string>("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string>("");

  // Update dialog state
  const [updateDialogOpen, setUpdateDialogOpen] = React.useState(false);
  const [selectedTruck, setSelectedTruck] = React.useState<any>(null);
  const [updateRegistrationNumber, setUpdateRegistrationNumber] = React.useState("");
  const [updateTruckType, setUpdateTruckType] = React.useState<TruckType | undefined>(undefined);
  const [updateCapacity, setUpdateCapacity] = React.useState("");
  const [updateStatus, setUpdateStatus] = React.useState<TruckStatus>("available");
  const [updateAssignedTeam, setUpdateAssignedTeam] = React.useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCreateTruck = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registrationNumber || !truckType || !capacity || !imageFile) {
      toast.error("All fields including image are required");
      return;
    }

    try {
      await createTruckMutation.mutateAsync({
        registrationNumber,
        truckType,
        capacity: Number(capacity),
        assignedTeam: assignedTeam && assignedTeam !== "none" ? assignedTeam : undefined,
        image: imageFile,
      });
      setCreateDialogOpen(false);
      setRegistrationNumber("");
      setTruckType(undefined);
      setCapacity("");
      setAssignedTeam("");
      setImageFile(null);
      setImagePreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const handleDelete = async (truckId: string, truckReg: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete truck "${truckReg}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteTruckMutation.mutateAsync(truckId);
      } catch (err) {
        // Error is already handled in the hook
      }
    }
  };

  const handleManageTruck = (truck: any) => {
    setSelectedTruck(truck);
    setUpdateRegistrationNumber(truck.truck_registrationNumber);
    setUpdateTruckType(truck.truck_truckType as TruckType);
    setUpdateCapacity(truck.truck_capacity.toString());
    setUpdateStatus(truck.truck_status);
    setUpdateAssignedTeam(truck.truck_assignedTeam?._id || "none");
    setUpdateDialogOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!updateRegistrationNumber || !updateTruckType || !updateCapacity) {
      toast.error("Registration number, type, and capacity are required");
      return;
    }

    try {
      await updateTruckMutation.mutateAsync({
        id: selectedTruck._id,
        registrationNumber: updateRegistrationNumber,
        truckType: updateTruckType,
        capacity: Number(updateCapacity),
        status: updateStatus,
        assignedTeam: updateAssignedTeam && updateAssignedTeam !== "none" ? updateAssignedTeam : undefined,
      });
      setUpdateDialogOpen(false);
      setSelectedTruck(null);
    } catch (err) {
      // Error is already handled in the hook
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "default";
      case "in_use":
        return "default";
      case "maintenance":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTypeColor = (type: string) => {
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
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading trucks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 py-10">Failed to load trucks</p>;
  }

  const CreateTruckForm = () => (
    <form className="grid gap-4" onSubmit={handleCreateTruck}>
      <div className="grid gap-3">
        <Label>Truck Image *</Label>
        <div className="flex flex-col gap-3">
          {imagePreview ? (
            <div className="relative w-full h-48 border rounded-lg overflow-hidden">
              <Image
                src={imagePreview}
                alt="Truck preview"
                fill
                className="object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={triggerFileInput}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload truck image
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 5MB
              </p>
            </div>
          )}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="registrationNumber">Registration Number *</Label>
        <Input
          id="registrationNumber"
          placeholder="e.g., ECO-1234"
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-3">
          <Label htmlFor="truckType">Truck Type *</Label>
          <Select value={truckType} onValueChange={(value) => setTruckType(value as TruckType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Type</SelectLabel>
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
          <Label htmlFor="capacity">Capacity (kg) *</Label>
          <Input
            id="capacity"
            type="number"
            placeholder="e.g., 5000"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-3">
        <Label htmlFor="assignedTeam">Assigned Team (Optional)</Label>
        <Select value={assignedTeam} onValueChange={setAssignedTeam}>
          <SelectTrigger>
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Teams</SelectLabel>
              <SelectItem value="none">None</SelectItem>
              {teams?.map((team: any) => (
                <SelectItem key={team._id} value={team._id}>
                  {team.team_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" type="button">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={createTruckMutation.isPending}>
          {createTruckMutation.isPending ? "Adding..." : "Add Truck"}
        </Button>
      </DialogFooter>
    </form>
  );

  if (!trucks || trucks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Trucks Management</h2>
            <p className="text-muted-foreground">Manage your fleet of waste collection trucks</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Truck
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Truck</DialogTitle>
                <DialogDescription>
                  Enter truck details below and upload an image to add a new truck to your fleet.
                </DialogDescription>
              </DialogHeader>
              <CreateTruckForm />
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-center py-10">No trucks available. Add your first truck!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Trucks Management</h2>
          <p className="text-muted-foreground">Manage your fleet of waste collection trucks</p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Truck
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Truck</DialogTitle>
              <DialogDescription>
                Enter truck details below and upload an image to add a new truck to your fleet.
              </DialogDescription>
            </DialogHeader>
            <CreateTruckForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trucks.map((truck: any) => (
          <Card key={truck._id} className="hover:shadow-lg transition-shadow overflow-hidden">
            {truck.truck_imageURL && (
              <div className="relative w-full h-48">
                <Image
                  src={truck.truck_imageURL}
                  alt={truck.truck_registrationNumber}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {truck.truck_registrationNumber}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{truck.truck_id}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() =>
                    handleDelete(truck._id, truck.truck_registrationNumber)
                  }
                  disabled={deleteTruckMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getTypeColor(
                    truck.truck_truckType
                  )}`}
                >
                  {truck.truck_truckType}
                </span>
                <Badge variant={getStatusColor(truck.truck_status)}>
                  {truck.truck_status.replace("_", " ")}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium text-foreground">
                    {truck.truck_capacity} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned Team:</span>
                  <span className="font-medium text-foreground">
                    {truck.truck_assignedTeam?.team_name || "Not assigned"}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleManageTruck(truck)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Manage
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Update Truck Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Truck</DialogTitle>
            <DialogDescription>
              Update truck details below and click save to apply changes.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleUpdateSubmit}>
            <div className="grid gap-3">
              <Label htmlFor="update-registrationNumber">Registration Number</Label>
              <Input
                id="update-registrationNumber"
                placeholder="e.g., ECO-1234"
                value={updateRegistrationNumber}
                onChange={(e) => setUpdateRegistrationNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-3">
                <Label htmlFor="update-truckType">Truck Type</Label>
                <Select
                  value={updateTruckType}
                  onValueChange={(value) => setUpdateTruckType(value as TruckType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Type</SelectLabel>
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
                <Label htmlFor="update-capacity">Capacity (kg)</Label>
                <Input
                  id="update-capacity"
                  type="number"
                  placeholder="e.g., 5000"
                  value={updateCapacity}
                  onChange={(e) => setUpdateCapacity(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-status">Status</Label>
              <Select
                value={updateStatus}
                onValueChange={(value) => setUpdateStatus(value as TruckStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status</SelectLabel>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In Use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="update-assignedTeam">Assigned Team</Label>
              <Select value={updateAssignedTeam} onValueChange={setUpdateAssignedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Teams</SelectLabel>
                    <SelectItem value="none">None</SelectItem>
                    {teams?.map((team: any) => (
                      <SelectItem key={team._id} value={team._id}>
                        {team.team_name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={updateTruckMutation.isPending}>
                {updateTruckMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}