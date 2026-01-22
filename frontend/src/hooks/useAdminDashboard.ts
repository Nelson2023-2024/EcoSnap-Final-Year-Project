import { API_URL } from "@/lib/api-url";
import { useQuery } from "@tanstack/react-query";

// Types
interface OverviewStats {
  totalReports: {
    value: number;
    change: string;
    trend: "up" | "down";
  };
  activeUsers: {
    value: number;
    change: string;
    trend: "up" | "down";
    weeklyActive: number;
  };
  dispatchedTrucks: {
    value: number;
    change: string;
    trend: "up" | "down";
    inUse: number;
  };
  completedCollections: {
    value: number;
    change: string;
    trend: "up" | "down";
  };
  totalTeams: number;
  totalPointsAwarded: number;
  totalOrders: number;
  avgResponseTime: number;
  collectionRate: number;
}

interface WeeklyActivityItem {
  day: string;
  count: number;
}

interface WasteTypeItem {
  name: string;
  value: number;
  color: string;
}

interface WasteCategoryItem {
  category: string;
  count: number;
  totalVolume: number;
}

interface TeamPerformanceItem {
  teamId: string;
  teamName: string;
  specialization: string;
  status: string;
  totalDispatches: number;
  memberCount: number;
  truckCount: number;
}

interface RecentAlert {
  id: string;
  location: string;
  issue: string;
  status: string;
  time: string;
  reporter: string | null;
}

interface LocationHotspot {
  location: string;
  reportCount: number;
  category: string | null;
  lastReport: string;
}

interface StatusItem {
  status: string;
  count: number;
}

interface RecentReport {
  id: string;
  status: string;
  category: string | null;
  location: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string;
}

interface RecentDispatch {
  id: string;
  status: string;
  location: string | null;
  teamName: string;
  truckNumber: string;
  scheduledDate: string;
  createdAt: string;
}

interface TopUser {
  userId: string;
  name: string | null;
  email: string;
  points: number;
  profileImage: string | null;
  reportCount: number;
}

interface PointsDistribution {
  reason: string;
  totalPoints: number;
  count: number;
}

interface OrderStat {
  status: string;
  count: number;
  totalCost: number;
}

interface TimeSeriesItem {
  date: string;
  count: number;
}

export interface AdminDashboardData {
  overview: OverviewStats;
  weeklyActivity: {
    reports: WeeklyActivityItem[];
    collections: WeeklyActivityItem[];
  };
  wasteTypeDistribution: WasteTypeItem[];
  wasteByCategory: WasteCategoryItem[];
  wasteStatus: StatusItem[];
  dispatchStatus: StatusItem[];
  truckStatus: StatusItem[];
  teamPerformance: TeamPerformanceItem[];
  recentAlerts: RecentAlert[];
  locationHotspots: LocationHotspot[];
  recentReports: RecentReport[];
  recentDispatches: RecentDispatch[];
  topUsers: TopUser[];
  pointsDistribution: PointsDistribution[];
  orderStats: OrderStat[];
  reportsTimeSeries: TimeSeriesItem[];
  dispatchesTimeSeries: TimeSeriesItem[];
}

interface AdminDashboardResponse {
  success: boolean;
  data: AdminDashboardData;
}

export function useAdminDashboard() {
  return useQuery<AdminDashboardData, Error>({
    queryKey: ["adminDashboard", "stats"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/admin-dashboard/stats`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch admin dashboard stats");
      }

      const json: AdminDashboardResponse = await res.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refetch every 5 minutes
  });
}