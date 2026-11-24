import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export async function fetchLiveQaSessions() {
  const res = await apiClient.get("/live-qa/sessions");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useLiveQaSessions(){
  return useQuery({
    queryKey: ["live-qa", "sessions"],
    queryFn: fetchLiveQaSessions,
    retry: false
  });
}
