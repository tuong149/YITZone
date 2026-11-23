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
  startTime?: string;
  endTime?: string;
  status?: string;
  version?: number;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  visibility?: "PUBLIC_FACULTY" | "INTERNAL_CTV";
  organizerUnitId?: string;
  benefitTypes?: string[];
  startTime?: string;
  endTime?: string;
}

export interface UpdateEventPayload {
  title: string;
  description?: string;
  visibility?: "PUBLIC_FACULTY" | "INTERNAL_CTV";
  benefitTypes?: string[];
  startTime?: string;
  endTime?: string;
  version?: number;
}

export async function fetchEvents(page = 0, size = 20): Promise<EventItem[]> {
  const res = await apiClient.get<ApiResponse<EventItem[]>>("/events", { params: { page, size } });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchEventById(id: string): Promise<EventItem> {
  const res = await apiClient.get<ApiResponse<EventItem>>(`/events/${encodeURIComponent(id)}`);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createEvent(payload: CreateEventPayload): Promise<EventItem> {
  const res = await apiClient.post<ApiResponse<EventItem>>("/events", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function updateEvent(
  id: string,
  payload: UpdateEventPayload,
  ifMatchVersion?: number
): Promise<EventItem> {
  const headers: Record<string, string> = {};
  if (ifMatchVersion !== undefined) {
    headers["If-Match"] = `"${ifMatchVersion}"`;
  }
  const res = await apiClient.put<ApiResponse<EventItem>>(
    `/events/${encodeURIComponent(id)}`,
    payload,
    { headers }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useEvents(){
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ["events", userId ?? "guest", activeScopeId],
    queryFn: () => fetchEvents(),
    retry: false
  });
}

export function useEventDetail(id?: string) {
  return useQuery({
    queryKey: ["events", "detail", id],
    queryFn: () => fetchEventById(id!),
    enabled: Boolean(id),
    retry: false
  });
}
