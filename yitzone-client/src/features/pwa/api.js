import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export async function fetchVapidPublicKey() {
  const res = await apiClient.get("/pwa/vapid-public-key");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function subscribeWebPush(payload) {
  const res = await apiClient.post("/pwa/push-subscriptions", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useVapidPublicKey(){
  return useQuery({
    queryKey: ["pwa", "vapid-public-key"],
    queryFn: fetchVapidPublicKey,
    retry: false
  });
}
