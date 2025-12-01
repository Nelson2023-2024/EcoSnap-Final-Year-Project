// C:\Users\user\Desktop\Code\EcoSnap-Final-Year-Project\frontend\src\hooks\useUserDashboard.ts

import { API_URL } from "@/lib/api-url";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalReports: {
    value: number;
    subtitle: string;
  };
  ecoPoints: {
    value: number;
    subtitle: string;
  };
  itemsRedeemed: {
    value: number;
    subtitle: string;
  };
}

interface RecentReport {
  id: string;
  date: string;
  status: "Pending" | "In Progress" | "Collected";
  location: string;
  wasteType: string;
}

interface LevelProgress {
  currentLevel: string;
  level: number;
  nextLevel: string;
  progress: number;
  pointsToNextLevel: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentReports: RecentReport[];
  levelProgress: LevelProgress;
}

interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export function useUserDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["user-dashboard"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/user-dashboard/stats`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data: DashboardResponse = await response.json();
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
}