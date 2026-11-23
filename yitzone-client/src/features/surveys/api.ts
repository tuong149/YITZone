import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

export async function fetchSurveys(): Promise<unknown[]> {
  const res = await apiClient.get<ApiResponse<unknown[]>>("/surveys");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useSurveys(){
  return useQuery({
    queryKey: ["surveys", "list"],
    queryFn: fetchSurveys,
    retry: false
  });
}
