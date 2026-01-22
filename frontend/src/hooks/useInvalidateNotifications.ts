import { QueryClient } from "@tanstack/react-query";

export function invalidateNotifications(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
  queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
  queryClient.invalidateQueries({ queryKey: ["notification-stats"] });
}