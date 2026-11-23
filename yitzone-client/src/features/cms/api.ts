import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

export async function fetchPublishedPosts(): Promise<unknown[]> {
  const res = await apiClient.get<ApiResponse<unknown[]>>("/cms/posts");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function usePublishedPosts(){
  return useQuery({
    queryKey: ["cms", "posts"],
    queryFn: fetchPublishedPosts,
    retry: false
  });
}
