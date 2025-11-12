"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, Eye, Search, Filter } from "lucide-react";

const ReportHistory = () => {
  const reports = [
    {
      id: "RPT-001",
      date: "2024-01-15",
      location: "Downtown Park, 5th Avenue",
      status: "Collected",
      materials: ["PET Plastic", "Glass Bottles"],
      points: 50,
      image: "https://images.unsplash.com/photo-1584736286279-4e5c6eb18f0e?w=400",
    },
    {
      id: "RPT-002",
      date: "2024-01-14",
      location: "Main Street Shopping Center",
      status: "In Progress",
      materials: ["E-waste", "Batteries"],
      points: 75,
      image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400",
    },
    {
      id: "RPT-003",
      date: "2024-01-12",
      location: "Beach Area, North Shore",
      status: "Pending",
      materials: ["HDPE Containers", "Textiles"],
      points: 40,
      image: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=400",
    },
    {
      id: "RPT-004",
      date: "2024-01-10",
      location: "City Center Plaza",
      status: "Collected",
      materials: ["Cardboard", "Paper"],
      points: 30,
      image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
    },
    {
      id: "RPT-005",
      date: "2024-01-08",
      location: "Riverside Park",
      status: "Collected",
      materials: ["Aluminum Cans", "Plastic Bags"],
      points: 45,
      image: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=400",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Collected":
        return "bg-eco-success/20 text-eco-success border-eco-success/30";
      case "In Progress":
        return "bg-warning/10 text-warning border-warning/20";
      case "Pending":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === "Collected").length;
  const pendingReports = reports.filter(r => r.status === "Pending" || r.status === "In Progress").length;

  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="rounded-lg bg-gradient-to-r from-eco-primary to-eco-success p-6 text-white shadow-lg flex-1">
              <h1 className="text-3xl font-bold">Report History</h1>
              <p className="mt-2 text-white/90">
                Track all your waste reports and their collection status
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search reports..." 
                className="pl-9 focus:border-eco-primary focus:ring-eco-primary" 
              />
            </div>
            <Button 
              variant="outline"
              className="border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          {/* Stats Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalReports}</div>
              </CardContent>
            </Card>
            <Card className="border-border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-eco-primary">{completedReports}</div>
              </CardContent>
            </Card>
            <Card className="border-border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{pendingReports}</div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="border-border transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row">
                    {/* Image */}
                    <div className="h-32 w-full overflow-hidden rounded-lg border-2 border-eco-primary/20 md:h-24 md:w-32">
                      <img
                        src={report.image}
                        alt={report.location}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">{report.id}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-eco-primary" />
                                <span>{report.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-eco-primary" />
                                <span>{report.date}</span>
                              </div>
                            </div>
                          </div>
                          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {report.materials.map((material) => (
                            <Badge 
                              key={material} 
                              variant="outline" 
                              className="text-xs border-eco-primary/30 text-eco-primary"
                            >
                              {material}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Points earned: </span>
                          <span className="font-semibold text-eco-primary">+{report.points}</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-eco-primary text-eco-primary hover:bg-eco-primary hover:text-white"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportHistory;