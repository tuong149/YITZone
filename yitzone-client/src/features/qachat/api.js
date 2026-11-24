import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export async function fetchQaConversations() {
  const res = await apiClient.get("/qa/conversations");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useQaConversations(){
  return useQuery({ queryKey: ["qachat", "conversations"], queryFn: fetchQaConversations, retry: false });
}
