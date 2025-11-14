"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, MapPin, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ReportWaste = () => {
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.success(
            `Location captured: Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
          );
        },
        (error) => {
          toast.error("Could not get your location. Please enter manually.");
        }
      );
    }
  };

  const analyzeWaste = async () => {
    if (!image) {
      toast.error("Please upload an image first");
      return;
    }

    setAnalyzing(true);
    
    // Mock AI analysis
    setTimeout(() => {
      const mockAnalysis = {
        materials: [
          { type: "PET Plastic Bottles", quantity: "3-4", impact: "High", recyclable: true },
          { type: "Paper/Cardboard", quantity: "Multiple pieces", impact: "Medium", recyclable: true },
          { type: "Food Waste", quantity: "Significant", impact: "Medium", recyclable: false },
        ],
        source: "Likely from nearby residential area or small business",
        totalWeight: "~5-7 kg estimated",
        collectionType: "Mixed recyclables + organic waste",
        points: 150,
        priority: "Medium",
      };
      
      setAnalysis(mockAnalysis);
      setAnalyzing(false);
      
      toast.success(`Report submitted! You've earned ${mockAnalysis.points} points. Collection dispatched!`);
    }, 2000);
  };

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
                  {image ? (
                    <div className="relative">
                      <img src={image} alt="Waste" className="w-full h-64 object-cover rounded-lg border-2 border-eco-primary/30" />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => setImage(null)}
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
                    placeholder="Enter location or use GPS"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="focus:border-eco-primary focus:ring-eco-primary"
                  />
                  <Button 
                    onClick={captureGPS} 
                    variant="outline"
                    className="border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
                {gpsLocation && (
                  <p className="text-sm text-muted-foreground mt-1">
                    GPS: {gpsLocation.lat.toFixed(4)}, {gpsLocation.lng.toFixed(4)}
                  </p>
                )}
              </div>

              <Button 
                onClick={analyzeWaste} 
                disabled={analyzing || !image}
                className="w-full bg-eco-primary text-white hover:bg-eco-primary/90 shadow-lg transition-all hover:shadow-xl"
                size="lg"
              >
                {analyzing ? (
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
            
            {!analysis && !analyzing && (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Camera className="h-16 w-16 mb-4 text-muted-foreground/50" />
                <p className="text-center">Upload an image to see analysis results</p>
              </div>
            )}

            {analyzing && (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-eco-primary mb-4" />
                <p className="text-muted-foreground">Analyzing waste materials...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">Materials Detected:</h3>
                  {analysis.materials.map((material: any, i: number) => (
                    <Card key={i} className="p-3 mb-2 bg-muted/50 border-border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-foreground">{material.type}</p>
                          <p className="text-sm text-muted-foreground">Qty: {material.quantity}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          material.recyclable ? "bg-eco-primary/20 text-eco-primary" : "bg-destructive/20 text-destructive"
                        }`}>
                          {material.recyclable ? "Recyclable" : "Non-recyclable"}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="pt-2">
                  <h3 className="font-semibold text-foreground">Source:</h3>
                  <p className="text-sm text-muted-foreground">{analysis.source}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground">Estimated Weight:</h3>
                  <p className="text-sm text-muted-foreground">{analysis.totalWeight}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground">Collection Type:</h3>
                  <p className="text-sm text-muted-foreground">{analysis.collectionType}</p>
                </div>

                <div className="bg-gradient-to-r from-eco-primary/20 to-eco-success/20 p-4 rounded-lg border border-eco-primary/30">
                  <h3 className="font-semibold text-eco-primary">Points Earned:</h3>
                  <p className="text-3xl font-bold text-eco-primary">{analysis.points}</p>
                </div>

                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  ✓ Collection team dispatched! Expected arrival: 24-48 hours
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportWaste;