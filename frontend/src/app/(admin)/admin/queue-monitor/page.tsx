// src/app/(admin)/admin/queue-monitor/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Activity, TrendingUp, AlertCircle, BarChart3 } from "lucide-react";

export default function QueueMonitorPage() {
  const openBullBoard = () => {
    window.open("http://localhost:8080/admin/queues/", "_blank");
  };

  return (
    <div className="min-h-screen bg-background pt-16">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Queue Monitor</h1>
                <p className="mt-2 text-white/90">
                  Monitor and manage background job queues
                </p>
              </div>
              <Button
                onClick={openBullBoard}
                className="bg-white text-purple-600 hover:bg-white/90"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Bull Board
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Dispatch Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Workers</span>
                    <span className="font-semibold">5 concurrent</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Retry Policy</span>
                    <span className="font-semibold">3 attempts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Notification Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Workers</span>
                    <span className="font-semibold">10 concurrent</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Retry Policy</span>
                    <span className="font-semibold">2 attempts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Redis</span>
                    <Badge variant="default" className="bg-green-500">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="font-semibold">99.9%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Processing</span>
                    <span className="font-semibold">2.3s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bull Board Embed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Queue Dashboard
              </CardTitle>
              <Button variant="outline" size="sm" onClick={openBullBoard}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="relative w-full"
                style={{ height: "calc(100vh - 400px)", minHeight: "600px" }}
              >
                <iframe
                  src="http://localhost:8080/admin/queues/"
                  className="w-full h-full border-0 rounded-b-lg"
                  title="Bull Board Queue Monitor"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </div>
            </CardContent>
          </Card>

          {/* Queue Information */}
          <Card>
            <CardHeader>
              <CardTitle>Queue Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    Dispatch Queue
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Handles automatic and manual dispatch creation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Processes dispatch status updates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Manages dispatch cancellations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>5 concurrent workers, 3 retry attempts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Exponential backoff: 2s → 4s → 8s</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Notification Queue
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Sends notifications to users, admins, and teams</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Batch processes multiple notifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>10 concurrent workers, 2 retry attempts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Fixed backoff: 1s between retries</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 border-t mt-6">
                <h3 className="font-semibold mb-3">Job Retention Policy</h3>
                <ul className="space-y-2 text-sm text-muted-foreground grid md:grid-cols-3 gap-4">
                  <li>
                    <Badge variant="outline" className="mb-1">Completed</Badge>
                    <p>Keep last 100 jobs, retain for 24 hours</p>
                  </li>
                  <li>
                    <Badge variant="outline" className="mb-1">Failed</Badge>
                    <p>Keep last 200 jobs for debugging</p>
                  </li>
                  <li>
                    <Badge variant="outline" className="mb-1">Active</Badge>
                    <p>Monitored in real-time</p>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={openBullBoard}
                >
                  View All Queues
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-red-600"
                  onClick={() => window.open("/admin/queues?status=failed", "_blank")}
                >
                  View Failed Jobs
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-blue-600"
                  onClick={() => window.open("/admin/queues?status=active", "_blank")}
                >
                  View Active Jobs
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-green-600"
                  onClick={() => window.open("/admin/queues?status=completed", "_blank")}
                >
                  View Completed
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Check Failed Jobs Regularly</h4>
                    <p className="text-sm text-muted-foreground">
                      Review failed jobs to identify recurring issues and fix root causes. Failed
                      jobs are kept for 200 entries to help with debugging.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Monitor Queue Length</h4>
                    <p className="text-sm text-muted-foreground">
                      Long queues may indicate system overload or worker issues. Check if workers
                      are processing jobs efficiently.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Clean Old Jobs Periodically</h4>
                    <p className="text-sm text-muted-foreground">
                      Use Bull Board to clean completed jobs and keep Redis memory efficient. Jobs
                      are automatically cleaned based on retention policy.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Review Job Processing Times</h4>
                    <p className="text-sm text-muted-foreground">
                      Track job processing times to optimize performance and identify bottlenecks.
                      Average processing time should be under 5 seconds.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Monitor Redis Health</h4>
                    <p className="text-sm text-muted-foreground">
                      Ensure Redis is running smoothly with sufficient memory. Check Redis logs if
                      jobs start failing unexpectedly.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle>Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 text-red-600">
                    ❌ Jobs Stuck in "Waiting" State
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Workers may not be running or Redis connection is lost.
                  </p>
                  <p className="text-sm">
                    <strong>Solution:</strong> Check server logs, verify Redis is running (
                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                      redis-cli ping
                    </code>
                    ), restart backend server.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 text-orange-600">
                    ⚠️ High Failure Rate
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Multiple jobs failing repeatedly indicates a systemic issue.
                  </p>
                  <p className="text-sm">
                    <strong>Solution:</strong> Check failed job error messages in Bull Board,
                    verify database connections, check for data validation issues.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 text-yellow-600">
                    ⏱️ Slow Processing Times
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Jobs taking longer than expected to complete.
                  </p>
                  <p className="text-sm">
                    <strong>Solution:</strong> Check database query performance, verify external
                    API response times, consider increasing worker concurrency.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}