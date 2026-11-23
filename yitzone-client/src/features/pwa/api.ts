import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

export async function fetchVapidPublicKey(): Promise<{ publicKey: string }> {
  const res = await apiClient.get<ApiResponse<{ publicKey: string }>>("/pwa/vapid-public-key");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function subscribeWebPush(payload: {
  endpoint: string;
  keys: Record<string, string>;
  deviceName?: string;
}) {
  const res = await apiClient.post<
    ApiResponse<{ userId: string; endpoint: string; active: boolean }>
  >("/pwa/push-subscriptions", payload);
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
