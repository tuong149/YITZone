import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  visibility: "PUBLIC_FACULTY" | "INTERNAL_CTV";
  organizerUnitId?: string;
  benefitTypes: string[];
  status?: string;
  version?: number;
}

export async function fetchEvents(): Promise<EventItem[]> {
  const res = await apiClient.get<ApiResponse<EventItem[]>>("/events");
  if (!res.data.success) {
    throw new Error(res.data.detail);
  }
  return res.data.data;
}

export function useEvents() {
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ["events", userId ?? "guest", activeScopeId],
    queryFn: fetchEvents,
    retry: false
  });
}
