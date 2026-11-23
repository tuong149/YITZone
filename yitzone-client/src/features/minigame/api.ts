import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

export async function fetchMinigameRooms(): Promise<unknown[]> {
  const res = await apiClient.get<ApiResponse<unknown[]>>("/minigames/rooms");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useMinigameRooms(){
  return useQuery({ queryKey: ["minigames", "rooms"], queryFn: fetchMinigameRooms, retry: false });
}
