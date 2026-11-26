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

export function normalizeApiEventItem(item) {
  if (!item || typeof item !== "object") return null;
  const startIso = typeof item.startTime === "string" ? item.startTime : "";
  const datePart = startIso ? startIso.slice(0, 10) : "";
  const dateSegments = datePart ? datePart.split("-") : [];
  const day = item.day || dateSegments[2] || "--";
  const month =
    item.month || (dateSegments[1] ? `TH${Number(dateSegments[1])}` : "SK");
  const timeShort =
    item.timeShort ||
    (startIso.includes("T") ? startIso.slice(11, 16) : "Đang cập nhật");
  const rawBenefits = Array.isArray(item.benefits)
    ? item.benefits
    : Array.isArray(item.benefitTypes)
      ? item.benefitTypes
      : [];
  const benefits = rawBenefits.map((b) =>
    b === "DRL"
      ? "Cộng ĐRL"
      : b === "CTXH"
        ? "Cộng CTXH"
        : b === "CDDN"
          ? "Cộng CĐDN"
          : b
  );
  const visibility = item.visibility ?? "PUBLIC_FACULTY";

  return {
    id: String(item.id),
    title: item.title ?? "Sự kiện Khoa CNTT",
    subtitle:
      item.subtitle ??
      item.description ??
      "Chương trình chính thức do Đoàn – Hội Khoa CNTT HCM-UTE tổ chức.",
    coverImage: item.coverImage ?? "",
    day,
    month,
    dateSummary:
      item.dateSummary ??
      (dateSegments.length === 3
        ? `${day}/${dateSegments[1]}/${dateSegments[0]} · ${timeShort}`
        : timeShort),
    timeShort,
    location: item.location ?? "Khoa CNTT HCM-UTE",
    lockNote: item.lockNote ?? "Theo quy định Ban Tổ chức",
    closeAt: item.closeAt ?? item.endTime ?? "",
    scope:
      item.scope ?? (visibility === "INTERNAL_CTV" ? "DEPT_INTERNAL" : "FACULTY"),
    visibility,
    status: item.status ?? "PUBLISHED",
    benefits,
    registeredCount: Number(item.registeredCount ?? 0),
    waitlistCount: Number(item.waitlistCount ?? 0),
    capacity: Number(item.capacity ?? 0),
    highlights:
      Array.isArray(item.highlights) && item.highlights.length > 0
        ? item.highlights
        : item.description
          ? [item.description]
          : ["Hoạt động chính thức dành cho sinh viên Khoa CNTT HCM-UTE."],
    sessions: Array.isArray(item.sessions) ? item.sessions : [],
    btcRoles: Array.isArray(item.btcRoles) ? item.btcRoles : [],
    formMode: item.formMode ?? "ONE_TAP",
    formFields: Array.isArray(item.formFields) ? item.formFields : [],
    hasExam: Boolean(item.hasExam),
    examMinutes: item.examMinutes ?? 20,
    examPassRate: item.examPassRate ?? 70,
    examPath: item.examPath,
    isTeamCompetition: Boolean(item.isTeamCompetition),
    minTeamSize: item.minTeamSize,
    maxTeamSize: item.maxTeamSize
  };
}

export function extractEventList(apiData) {
  const rawList = Array.isArray(apiData)
    ? apiData
    : Array.isArray(apiData?.content)
      ? apiData.content
      : Array.isArray(apiData?.items)
        ? apiData.items
        : [];
  return rawList.map(normalizeApiEventItem).filter(Boolean);
}

export function mergeStoredAndApiEvents(storedEvents, apiData) {
  const fromStore = Array.isArray(storedEvents) ? storedEvents : [];
  const fromApi = extractEventList(apiData);
  if (fromApi.length === 0) return fromStore;
  const seen = new Set(fromStore.map((e) => e.id));
  const merged = [...fromStore];
  for (const item of fromApi) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}

export function useEvents() {
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
