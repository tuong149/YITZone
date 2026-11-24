import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export async function fetchPublishedPosts() {
  const res = await apiClient.get("/cms/posts");
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
