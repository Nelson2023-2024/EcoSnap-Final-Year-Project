"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, MapPin, Upload, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAnalyzeWaste } from "@/hooks/useWasteAnalysis";

const ReportWaste = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { analyzeWaste, isAnalyzing, data: analysisData } = useAnalyzeWaste();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureGPS = () => {
    if ("geolocation" in navigator) {
      toast.success("Getting your location...");
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          
          // Get human-readable address from coordinates
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
            .then(res => res.json())
            .then(data => {
              const address = data.display_name || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
              setLocation(address);
              toast.success(
                `Location captured with ${position.coords.accuracy.toFixed(0)}m accuracy`
              );
            })
            .catch(() => {
              setLocation(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
              toast.success("Location captured");
            });
        },
        (error) => {
          let errorMsg = "Could not get your location. Please enter manually.";
          if (error.code === 1) {
            errorMsg = "Location permission denied. Please enable location access in your browser settings.";
          } else if (error.code === 2) {
            errorMsg = "Location unavailable. Please check your device settings.";
          } else if (error.code === 3) {
            errorMsg = "Location request timed out. Please try again.";
          }
          toast.error(errorMsg);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      toast.error("Please upload an image first");
      return;
    }

    if (!location) {
      toast.error("Please enter a location");
      return;
    }

    // Use GPS coordinates if available, otherwise try to extract from location string
    let lat = gpsLocation?.lat || -1.2921; // Default fallback
    let lng = gpsLocation?.lng || 36.8219; // Default fallback

    // Try to extract coordinates from location string if it looks like coordinates
    if (!gpsLocation && location.includes(",")) {
      const coords = location.split(",").map(s => parseFloat(s.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        lat = coords[0];
        lng = coords[1];
      }
    }

    analyzeWaste({
      image: imageFile,
      latitude: lat,
      longitude: lng,
      address: location,
    });
  };

  const analysis = analysisData?.data;

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="rounded-lg bg-gradient-to-r from-eco-primary to-eco-success p-6 text-white shadow-lg mb-8">
          <h1 className="text-4xl font-bold">Report Waste</h1>
          <p className="mt-2 text-white/90">
            Upload a photo and let our AI analyze the waste for efficient collection
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="p-6 border-border transition-all hover:shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Upload Image</h2>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="image" className="text-foreground">Waste Photo</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Waste" className="w-full h-64 object-cover rounded-lg border-2 border-eco-primary/30" />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-eco-primary transition-all">
                      <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload</p>
                      <input
                        id="image"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="location" className="text-foreground">Location</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="location"
                    placeholder="Enter address, landmark, or click map icon"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="focus:border-eco-primary focus:ring-eco-primary"
                  />
                  <Button 
                    onClick={captureGPS} 
                    variant="outline"
                    className="border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white"
                    title="Get approximate location (WiFi-based)"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
                {gpsLocation && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Detected: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Tip: For accurate location on desktop, manually type your address or nearby landmark
                </p>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={isAnalyzing || !imageFile || !location}
                className="w-full bg-eco-primary text-white hover:bg-eco-primary/90 shadow-lg transition-all hover:shadow-xl"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-5 w-5" />
                    Analyze & Submit
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Analysis Results */}
          <Card className="p-6 border-border transition-all hover:shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-foreground">AI Analysis</h2>
            
            {!analysis && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Camera className="h-16 w-16 mb-4 text-muted-foreground/50" />
                <p className="text-center">Upload an image to see analysis results</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-eco-primary mb-4" />
                <p className="text-muted-foreground">Analyzing waste materials...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                {analysis.containsWaste ? (
                  <>
                    <div>
                      <h3 className="font-semibold mb-3 text-foreground">Materials Detected:</h3>
                      {analysis.wasteCategories.map((category, i) => (
                        <Card key={i} className="p-3 mb-2 bg-muted/50 border-border">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-foreground">{category.type}</p>
                              <p className="text-sm text-muted-foreground">
                                Percentage: {category.estimatedPercentage}%
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {analysis.dominantWasteType && (
                      <div className="pt-2">
                        <h3 className="font-semibold text-foreground">Dominant Waste Type:</h3>
                        <p className="text-sm text-muted-foreground">{analysis.dominantWasteType}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-foreground">Estimated Volume:</h3>
                      <p className="text-sm text-muted-foreground">
                        {analysis.estimatedVolume.value} {analysis.estimatedVolume.unit}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground">Possible Source:</h3>
                      <p className="text-sm text-muted-foreground">{analysis.possibleSource}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground">Environmental Impact:</h3>
                      <p className="text-sm text-muted-foreground">{analysis.environmentalImpact}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground">Confidence Level:</h3>
                      <p className="text-sm text-muted-foreground">{analysis.confidenceLevel}</p>
                    </div>

                    <div className="bg-gradient-to-r from-eco-primary/20 to-eco-success/20 p-4 rounded-lg border border-eco-primary/30">
                      <h3 className="font-semibold text-eco-primary">Points Earned:</h3>
                      <p className="text-3xl font-bold text-eco-primary">{analysisData?.pointsAwarded || 0}</p>
                    </div>

                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      ✓ Status: {analysis.status.replace(/_/g, " ").toUpperCase()}
                    </p>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <p className="text-lg font-medium text-muted-foreground">
                      No waste detected in this image
                    </p>
                    {analysis.errorMessage && (
                      <p className="text-sm text-destructive mt-2">{analysis.errorMessage}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportWaste;