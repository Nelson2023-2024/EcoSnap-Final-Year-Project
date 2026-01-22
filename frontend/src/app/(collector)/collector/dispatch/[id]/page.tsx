// frontend/src/app/(collector)/collector/dispatch/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Truck,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Package,
  AlertCircle,
  LoaderIcon,
  Upload,
  CheckCircle,
  Navigation,
  Image as ImageIcon,
  X,
} from "lucide-react";
import {
  useDispatchDetails,
  useStartDispatch,
  useCompleteDispatch,
  useReportIssue,
} from "@/hooks/useCollector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const DispatchDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const dispatchId = params.id as string;

  const { data: dispatch, isLoading } = useDispatchDetails(dispatchId);
  const { mutate: startDispatch, isPending: isStarting } = useStartDispatch();
  const { mutate: completeDispatch, isPending: isCompleting } = useCompleteDispatch();
  const { mutate: reportIssue, isPending: isReporting } = useReportIssue();

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [collectionNotes, setCollectionNotes] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueNotes, setIssueNotes] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex items-center justify-center h-96">
            <LoaderIcon className="h-12 w-12 animate-spin text-eco-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!dispatch) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Dispatch not found</AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setSelectedImages([...selectedImages, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (selectedImages.length === 0) {
      alert("Please upload at least one verification image");
      return;
    }

    completeDispatch(
      {
        dispatchId,
        verificationImages: selectedImages,
        collectionNotes,
      },
      {
        onSuccess: () => {
          setShowCompleteDialog(false);
          router.push("/collector-dashboard");
        },
      }
    );
  };

  const handleReportIssue = () => {
    if (!issueDescription.trim()) {
      alert("Please describe the issue");
      return;
    }

    reportIssue(
      {
        dispatchId,
        issue: issueDescription,
        notes: issueNotes,
      },
      {
        onSuccess: () => {
          setShowIssueDialog(false);
          setIssueDescription("");
          setIssueNotes("");
        },
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "en_route":
        return "bg-warning/10 text-warning border-warning/20";
      case "collected":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const canStart = dispatch.dispatch_status === "assigned";
  const canComplete = ["assigned", "en_route"].includes(dispatch.dispatch_status);

  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dispatch Details</h1>
              <p className="text-muted-foreground mt-1">
                ID: {dispatchId.substring(0, 8)}...
              </p>
            </div>
            <Badge
              variant="outline"
              className={`${getStatusColor(dispatch.dispatch_status)} text-lg px-4 py-2`}
            >
              {dispatch.dispatch_status}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canStart && (
              <Button
                onClick={() => startDispatch(dispatchId)}
                disabled={isStarting}
                className="bg-eco-primary hover:bg-eco-primary/90"
              >
                {isStarting ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Navigation className="mr-2 h-4 w-4" />
                    Start Dispatch
                  </>
                )}
              </Button>
            )}

            {canComplete && (
              <Button
                onClick={() => setShowCompleteDialog(true)}
                variant="default"
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Collection
              </Button>
            )}

            <Button
              onClick={() => setShowIssueDialog(true)}
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Report Issue
            </Button>
          </div>

          {/* Waste Information */}
          <Card>
            <CardHeader>
              <CardTitle>Waste Information</CardTitle>
              <CardDescription>Details about the reported waste</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={dispatch.dispatch_wasteAnalysis.waste_imageURL}
                    alt="Waste"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Waste Type</Label>
                    <p className="text-lg font-semibold">
                      {dispatch.dispatch_wasteAnalysis.waste_dominantWasteType}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <Badge variant="outline" className="mt-1">
                      {dispatch.dispatch_wasteAnalysis.waste_overallCategory}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Composition</Label>
                    <div className="space-y-2 mt-2">
                      {dispatch.dispatch_wasteAnalysis.waste_wasteCategories.map((cat) => (
                        <div key={cat.waste_type} className="flex justify-between text-sm">
                          <span>{cat.waste_type}</span>
                          <span className="font-medium">
                            {cat.waste_estimatedPercentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Schedule */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-eco-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{dispatch.dispatch_locationAddress}</p>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps?q=${dispatch.dispatch_locationLatitude},${dispatch.dispatch_locationLongitude}`,
                        "_blank"
                      );
                    }}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Open in Maps
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-eco-primary" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Scheduled</Label>
                  <p className="text-sm font-medium">
                    {formatDate(dispatch.dispatch_scheduledDate)}
                  </p>
                </div>
                {dispatch.dispatch_estimatedArrival && (
                  <div>
                    <Label className="text-muted-foreground text-xs">ETA</Label>
                    <p className="text-sm font-medium">
                      {formatDate(dispatch.dispatch_estimatedArrival)}
                    </p>
                  </div>
                )}
                {dispatch.dispatch_actualCollectionDate && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Collected</Label>
                    <p className="text-sm font-medium text-success">
                      {formatDate(dispatch.dispatch_actualCollectionDate)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team & Truck */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-eco-primary" />
                  Assigned Truck
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-eco-primary/10 flex items-center justify-center">
                    <Truck className="h-8 w-8 text-eco-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {dispatch.dispatch_assignedTruck.truck_registrationNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dispatch.dispatch_assignedTruck.truck_truckType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Capacity: {dispatch.dispatch_assignedTruck.truck_capacity}kg
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-eco-primary" />
                  Reporter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {dispatch.dispatch_wasteAnalysis.waste_user.user_fullName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {dispatch.dispatch_wasteAnalysis.waste_user.user_email}
                  </span>
                </div>
                {dispatch.dispatch_wasteAnalysis.waste_user.user_phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {dispatch.dispatch_wasteAnalysis.waste_user.user_phoneNumber}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Collection Images (if completed) */}
          {dispatch.dispatch_collectionImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Verification Images</CardTitle>
                <CardDescription>
                  {dispatch.dispatch_collectionImages.length} image(s) uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {dispatch.dispatch_collectionImages.map((img) => (
                    <img
                      key={img.id}
                      src={img.imageURL}
                      alt="Collection verification"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {dispatch.dispatch_collectionNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Collection Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {dispatch.dispatch_collectionNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Collection</DialogTitle>
            <DialogDescription>
              Upload verification images and add notes to complete this dispatch
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label htmlFor="images">
                Verification Images * (1-5 images required)
              </Label>
              <div className="mt-2">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload images ({selectedImages.length}/5)
                    </p>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>

                {/* Preview selected images */}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {selectedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(img)}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Collection Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any relevant notes about the collection..."
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={isCompleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isCompleting || selectedImages.length === 0}
              className="bg-success hover:bg-success/90"
            >
              {isCompleting ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Collection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Issue</DialogTitle>
            <DialogDescription>
              Describe the issue you encountered with this dispatch
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="issue">Issue Description *</Label>
              <Textarea
                id="issue"
                placeholder="Describe the issue..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="issue-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="issue-notes"
                placeholder="Any additional information..."
                value={issueNotes}
                onChange={(e) => setIssueNotes(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowIssueDialog(false)}
              disabled={isReporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportIssue}
              disabled={isReporting || !issueDescription.trim()}
              variant="destructive"
            >
              {isReporting ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Report Issue
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatchDetailsPage;