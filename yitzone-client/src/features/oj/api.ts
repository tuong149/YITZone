import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

export async function fetchOjProblems(): Promise<unknown[]> {
  const res = await apiClient.get<ApiResponse<unknown[]>>("/oj/problems");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useOjProblems(){
  return useQuery({ queryKey: ["oj", "problems"], queryFn: fetchOjProblems, retry: false });
}
