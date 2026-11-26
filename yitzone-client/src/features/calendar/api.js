import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export async function fetchAggregatedCalendar() {
  const res = await apiClient.get("/calendar/feed");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useAggregatedCalendar() {
  return useQuery({
    queryKey: ["calendar", "feed"],
    queryFn: fetchAggregatedCalendar,
    retry: false
  });
}

export const useCalendarEvents = useAggregatedCalendar;
