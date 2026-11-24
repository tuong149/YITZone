import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

/**
 * @typedef {Object} EventItem
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {"PUBLIC_FACULTY" | "INTERNAL_CTV"} visibility
 * @property {string} [organizerUnitId]
 * @property {string[]} benefitTypes
 * @property {string} [startTime]
 * @property {string} [endTime]
 * @property {string} [status]
 * @property {number} [version]
 */

/**
 * @typedef {Object} CreateEventPayload
 * @property {string} title
 * @property {string} [description]
 * @property {"PUBLIC_FACULTY" | "INTERNAL_CTV"} [visibility]
 * @property {string} [organizerUnitId]
 * @property {string[]} [benefitTypes]
 * @property {string} [startTime]
 * @property {string} [endTime]
 */

/**
 * @typedef {Object} UpdateEventPayload
 * @property {string} title
 * @property {string} [description]
 * @property {"PUBLIC_FACULTY" | "INTERNAL_CTV"} [visibility]
 * @property {string[]} [benefitTypes]
 * @property {string} [startTime]
 * @property {string} [endTime]
 * @property {number} [version]
 */

export async function fetchEvents(page = 0, size = 20) {
  const res = await apiClient.get("/events", { params: { page, size } });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchEventById(id) {
  const res = await apiClient.get(`/events/${encodeURIComponent(id)}`);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createEvent(payload) {
  const res = await apiClient.post("/events", payload);
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function updateEvent(
  id,
  payload,
  ifMatchVersion
) {
  const headers = {};
  if (ifMatchVersion !== undefined) {
    headers["If-Match"] = `"${ifMatchVersion}"`;
  }
  const res = await apiClient.put(
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

export function useEventDetail(id) {
  return useQuery({
    queryKey: ["events", "detail", id],
    queryFn: () => fetchEventById(id),
    enabled: Boolean(id),
    retry: false
  });
}
