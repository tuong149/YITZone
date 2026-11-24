import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export async function fetchMinigameRooms() {
  const res = await apiClient.get("/minigames/rooms");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useMinigameRooms(){
  return useQuery({ queryKey: ["minigames", "rooms"], queryFn: fetchMinigameRooms, retry: false });
}
