import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Loader2 } from "lucide-react";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const AdminReportGenerator = () => {
  const [reportType, setReportType] = useState("monthly");
  const [isGenerating, setIsGenerating] = useState(false);
  const { data, isLoading } = useAdminDashboard();

  const generatePDF = async () => {
    if (!data) return;

    setIsGenerating(true);

    try {
      // Create a new window for the report
      const reportWindow = window.open("", "_blank");
      if (!reportWindow) {
        alert("Please allow pop-ups to generate the report");
        setIsGenerating(false);
        return;
      }

      // Get current date for report
      const reportDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Calculate period
      let period = "";
      if (reportType === "weekly") period = "Last 7 Days";
      else if (reportType === "monthly") period = "Last 30 Days";
      else period = "Last 90 Days";

      // Prepare chart data
      const wasteTypesChart = data.wasteTypeDistribution
        .slice(0, 5)
        .map((item) => `${item.name}: ${item.value}`)
        .join(", ");

      const topTeam = data.teamPerformance[0];
      const topUser = data.topUsers[0];

      // HTML content for the report
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Waste Management System - Analytics Report</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 40px;
              background: #f5f5f5;
              color: #333;
              line-height: 1.6;
            }
            
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .header {
              text-align: center;
              border-bottom: 3px solid #10b981;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            
            .header h1 {
              color: #10b981;
              font-size: 28px;
              margin-bottom: 10px;
            }
            
            .header .subtitle {
              color: #666;
              font-size: 16px;
            }
            
            .meta-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
            }
            
            .meta-info div {
              text-align: center;
            }
            
            .meta-info .label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .meta-info .value {
              font-size: 14px;
              font-weight: 600;
              color: #333;
              margin-top: 5px;
            }
            
            .section {
              margin-bottom: 35px;
            }
            
            .section-title {
              font-size: 20px;
              color: #10b981;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            
            .stat-card {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #10b981;
            }
            
            .stat-card .label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            
            .stat-card .value {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            
            .stat-card .change {
              font-size: 13px;
              font-weight: 600;
            }
            
            .stat-card .change.up {
              color: #10b981;
            }
            
            .stat-card .change.down {
              color: #ef4444;
            }
            
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            
            .metric-card {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            
            .metric-card .metric-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 8px;
            }
            
            .metric-card .metric-value {
              font-size: 22px;
              font-weight: bold;
              color: #10b981;
            }
            
            .chart-container {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            
            .chart-title {
              font-size: 16px;
              font-weight: 600;
              color: #333;
              margin-bottom: 15px;
            }
            
            .bar-chart {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            
            .bar-item {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .bar-label {
              width: 150px;
              font-size: 13px;
              color: #666;
            }
            
            .bar-container {
              flex: 1;
              height: 24px;
              background: #e5e7eb;
              border-radius: 4px;
              position: relative;
              overflow: hidden;
            }
            
            .bar-fill {
              height: 100%;
              background: linear-gradient(90deg, #10b981, #059669);
              border-radius: 4px;
              transition: width 0.3s ease;
            }
            
            .bar-value {
              width: 60px;
              text-align: right;
              font-size: 13px;
              font-weight: 600;
              color: #333;
            }
            
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            .table th {
              background: #10b981;
              color: white;
              padding: 12px;
              text-align: left;
              font-size: 13px;
              font-weight: 600;
            }
            
            .table td {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }
            
            .table tr:hover {
              background: #f8f9fa;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
            }
            
            .status-badge.pending {
              background: #fef3c7;
              color: #92400e;
            }
            
            .status-badge.collected {
              background: #d1fae5;
              color: #065f46;
            }
            
            .status-badge.dispatched {
              background: #dbeafe;
              color: #1e40af;
            }
            
            .highlight-box {
              background: #ecfdf5;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            
            .highlight-box .title {
              font-weight: 600;
              color: #065f46;
              margin-bottom: 5px;
            }
            
            .highlight-box .content {
              color: #047857;
              font-size: 14px;
            }
            
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            
            .page-break {
              page-break-after: always;
            }
            
            @media print {
              body {
                padding: 0;
                background: white;
              }
              
              .container {
                box-shadow: none;
                padding: 20px;
              }
              
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>🌱 Waste Management System</h1>
              <div class="subtitle">Analytics & Performance Report</div>
            </div>
            
            <!-- Meta Information -->
            <div class="meta-info">
              <div>
                <div class="label">Report Period</div>
                <div class="value">${period}</div>
              </div>
              <div>
                <div class="label">Generated On</div>
                <div class="value">${reportDate}</div>
              </div>
              <div>
                <div class="label">Report Type</div>
                <div class="value">${
                  reportType.charAt(0).toUpperCase() + reportType.slice(1)
                }</div>
              </div>
            </div>
            
            <!-- Executive Summary -->
            <div class="section">
              <h2 class="section-title">Executive Summary</h2>
              <p style="margin-bottom: 20px; color: #666; font-size: 14px;">
                This report provides comprehensive insights into the waste management system's performance, 
                including waste collection metrics, user engagement, team efficiency, and environmental impact 
                for the period of ${period.toLowerCase()}.
              </p>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="label">Total Reports</div>
                  <div class="value">${data.overview.totalReports.value.toLocaleString()}</div>
                  <div class="change ${data.overview.totalReports.trend}">${
        data.overview.totalReports.change
      }</div>
                </div>
                
                <div class="stat-card">
                  <div class="label">Active Users</div>
                  <div class="value">${data.overview.activeUsers.value.toLocaleString()}</div>
                  <div class="change ${data.overview.activeUsers.trend}">${
        data.overview.activeUsers.change
      }</div>
                </div>
                
                <div class="stat-card">
                  <div class="label">Dispatched Trucks</div>
                  <div class="value">${data.overview.dispatchedTrucks.value.toLocaleString()}</div>
                  <div class="change ${data.overview.dispatchedTrucks.trend}">${
        data.overview.dispatchedTrucks.change
      }</div>
                </div>
                
                <div class="stat-card">
                  <div class="label">Collections</div>
                  <div class="value">${data.overview.completedCollections.value.toLocaleString()}</div>
                  <div class="change ${
                    data.overview.completedCollections.trend
                  }">${data.overview.completedCollections.change}</div>
                </div>
              </div>
            </div>
            
            <!-- Performance Metrics -->
            <div class="section">
              <h2 class="section-title">Performance Metrics</h2>
              
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-label">Avg Response Time</div>
                  <div class="metric-value">${data.overview.avgResponseTime.toFixed(
                    1
                  )}h</div>
                </div>
                
                <div class="metric-card">
                  <div class="metric-label">Collection Rate</div>
                  <div class="metric-value">${
                    data.overview.collectionRate
                  }%</div>
                </div>
                
                <div class="metric-card">
                  <div class="metric-label">Total Points Awarded</div>
                  <div class="metric-value">${data.overview.totalPointsAwarded.toLocaleString()}</div>
                </div>
              </div>
              
              <div class="highlight-box">
                <div class="title">Key Performance Indicator</div>
                <div class="content">
                  The system maintains an average response time of ${data.overview.avgResponseTime.toFixed(
                    1
                  )} hours 
                  from report submission to dispatch assignment, with a ${
                    data.overview.collectionRate
                  }% collection success rate.
                </div>
              </div>
            </div>
            
            <!-- Waste Analysis -->
            <div class="section">
              <h2 class="section-title">Waste Analysis</h2>
              
              <div class="chart-container">
                <div class="chart-title">Top Waste Categories Identified</div>
                <div class="bar-chart">
                  ${data.wasteTypeDistribution
                    .slice(0, 5)
                    .map((item, index) => {
                      const maxValue = Math.max(
                        ...data.wasteTypeDistribution.map((i) => i.value)
                      );
                      const percentage = (item.value / maxValue) * 100;
                      return `
                      <div class="bar-item">
                        <div class="bar-label">${item.name}</div>
                        <div class="bar-container">
                          <div class="bar-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="bar-value">${item.value}</div>
                      </div>
                    `;
                    })
                    .join("")}
                </div>
              </div>
              
              <table class="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Reports</th>
                    <th>Est. Volume</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.wasteByCategory
                    .slice(0, 5)
                    .map(
                      (cat) => `
                    <tr>
                      <td style="text-transform: capitalize;">${
                        cat.category || "General"
                      }</td>
                      <td>${cat.count}</td>
                      <td>${cat.totalVolume.toFixed(1)} units</td>
                      <td><span class="status-badge collected">Tracked</span></td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            
            <!-- Page Break -->
            <div class="page-break"></div>
            
            <!-- Team Performance -->
            <div class="section">
              <h2 class="section-title">Team Performance</h2>
              
              <div class="highlight-box">
                <div class="title">Top Performing Team</div>
                <div class="content">
                  ${
                    topTeam
                      ? `${topTeam.teamName} (${topTeam.specialization}) - ${topTeam.totalDispatches} dispatches completed with ${topTeam.memberCount} members`
                      : "No data available"
                  }
                </div>
              </div>
              
              <table class="table">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Specialization</th>
                    <th>Dispatches</th>
                    <th>Members</th>
                    <th>Trucks</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.teamPerformance
                    .slice(0, 5)
                    .map(
                      (team) => `
                    <tr>
                      <td>${team.teamName}</td>
                      <td style="text-transform: capitalize;">${
                        team.specialization
                      }</td>
                      <td>${team.totalDispatches}</td>
                      <td>${team.memberCount}</td>
                      <td>${team.truckCount}</td>
                      <td><span class="status-badge ${
                        team.status === "active" ? "collected" : "pending"
                      }">${team.status}</span></td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            
            <!-- User Engagement -->
            <div class="section">
              <h2 class="section-title">User Engagement & Rewards</h2>
              
              <div class="highlight-box">
                <div class="title">Top Contributor</div>
                <div class="content">
                  ${
                    topUser
                      ? `${
                          topUser.name || topUser.email
                        } - ${topUser.points.toLocaleString()} points earned from ${
                          topUser.reportCount
                        } waste reports`
                      : "No data available"
                  }
                </div>
              </div>
              
              <table class="table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>User</th>
                    <th>Reports</th>
                    <th>Points Earned</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.topUsers
                    .slice(0, 10)
                    .map(
                      (user, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${user.name || user.email}</td>
                      <td>${user.reportCount}</td>
                      <td style="font-weight: 600; color: #10b981;">${user.points.toLocaleString()}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            
            <!-- System Status -->
            <div class="section">
              <h2 class="section-title">System Status Overview</h2>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div>
                  <h3 style="font-size: 14px; color: #666; margin-bottom: 10px;">Waste Status</h3>
                  ${data.wasteStatus
                    .map(
                      (status) => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="font-size: 13px; text-transform: capitalize;">${status.status.replace(
                        /_/g,
                        " "
                      )}</span>
                      <span style="font-weight: 600;">${status.count}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
                
                <div>
                  <h3 style="font-size: 14px; color: #666; margin-bottom: 10px;">Dispatch Status</h3>
                  ${data.dispatchStatus
                    .map(
                      (status) => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="font-size: 13px; text-transform: capitalize;">${status.status.replace(
                        /_/g,
                        " "
                      )}</span>
                      <span style="font-weight: 600;">${status.count}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
                
                <div>
                  <h3 style="font-size: 14px; color: #666; margin-bottom: 10px;">Truck Status</h3>
                  ${data.truckStatus
                    .map(
                      (status) => `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="font-size: 13px; text-transform: capitalize;">${status.status.replace(
                        /_/g,
                        " "
                      )}</span>
                      <span style="font-weight: 600;">${status.count}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            </div>
            
            <!-- Location Hotspots -->
            ${
              data.locationHotspots.length > 0
                ? `
            <div class="section">
              <h2 class="section-title">Location Hotspots</h2>
              <p style="margin-bottom: 15px; color: #666; font-size: 14px;">
                Areas with multiple waste reports requiring attention:
              </p>
              
              <table class="table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Reports</th>
                    <th>Category</th>
                    <th>Last Report</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.locationHotspots
                    .slice(0, 5)
                    .map(
                      (spot) => `
                    <tr>
                      <td>${spot.location}</td>
                      <td style="font-weight: 600; color: #ef4444;">${
                        spot.reportCount
                      }</td>
                      <td style="text-transform: capitalize;">${
                        spot.category || "Mixed"
                      }</td>
                      <td>${new Date(spot.lastReport).toLocaleDateString()}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            `
                : ""
            }
            
            <!-- Recommendations -->
            <div class="section">
              <h2 class="section-title">Recommendations</h2>
              <ul style="padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
                <li>Continue monitoring high-activity locations for proactive waste management</li>
                <li>Maintain current response time standards to ensure efficient collection</li>
                <li>Encourage user participation through the points reward system</li>
                <li>Expand specialized teams for handling specific waste categories (e-waste, hazardous)</li>
                <li>Implement regular maintenance schedules for trucks to maintain availability</li>
              </ul>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p>This report was automatically generated by the Waste Management System</p>
              <p>Generated on ${reportDate} | ${period}</p>
              <p style="margin-top: 10px;">© 2024 Waste Management System. All rights reserved.</p>
            </div>
          </div>
          
          <!-- Print Button (hidden when printing) -->
          <div class="no-print" style="text-align: center; margin: 20px 0;">
            <button 
              onclick="window.print()" 
              style="background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 600;"
            >
              Print / Save as PDF
            </button>
            <button 
              onclick="window.close()" 
              style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: 600; margin-left: 10px;"
            >
              Close
            </button>
          </div>
        </body>
        </html>
      `;

      reportWindow.document.write(htmlContent);
      reportWindow.document.close();
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-eco-primary" />
          Generate System Report
        </CardTitle>
        <CardDescription>
          Create comprehensive PDF reports for waste management analytics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Period</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">
                  Weekly Report (Last 7 Days)
                </SelectItem>
                <SelectItem value="monthly">
                  Monthly Report (Last 30 Days)
                </SelectItem>
                <SelectItem value="quarterly">
                  Quarterly Report (Last 90 Days)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Report Includes:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Executive summary with key metrics</li>
              <li>• Performance indicators and trends</li>
              <li>• Waste analysis and categorization</li>
              <li>• Team performance statistics</li>
              <li>• User engagement and rewards</li>
              <li>• System status overview</li>
              <li>• Location hotspots analysis</li>
            </ul>
          </div>

          <Button
            onClick={generatePDF}
            disabled={isGenerating || isLoading || !data}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate PDF Report
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminReportGenerator;
