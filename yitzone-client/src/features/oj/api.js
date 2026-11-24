import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export async function fetchOjProblems() {
  const res = await apiClient.get("/oj/problems");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useOjProblems(){
  return useQuery({ queryKey: ["oj", "problems"], queryFn: fetchOjProblems, retry: false });
}
