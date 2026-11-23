import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

export async function fetchAwardCampaigns(): Promise<unknown[]> {
  const res = await apiClient.get<ApiResponse<unknown[]>>("/awards/campaigns");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useAwardCampaigns(){
  return useQuery({
    queryKey: ["awards", "campaigns"],
    queryFn: fetchAwardCampaigns,
    retry: false
  });
}
