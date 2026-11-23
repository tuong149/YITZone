import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

export async function fetchAggregatedCalendar(): Promise<unknown[]> {
  const res = await apiClient.get<ApiResponse<unknown[]>>("/calendar/feed");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useAggregatedCalendar(){
  return useQuery({
    queryKey: ["calendar", "feed"],
    queryFn: fetchAggregatedCalendar,
    retry: false
  });
}
