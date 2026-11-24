import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/**
 * @typedef {Object} ArtsExportJobCreatedDto
 * @property {string} jobId
 * @property {string} eventId
 * @property {string} status
 * @property {string} statusUrl
 */

/**
 * @typedef {Object} ArtsExportJobStatusDto
 * @property {string} jobId
 * @property {string} eventId
 * @property {string} status
 * @property {boolean} supportsHttpRangeResume
 * @property {string} presignedDownloadUrl
 * @property {string} expiresAt
 */

export async function fetchPerformances() {
  const res = await apiClient.get("/arts/performances");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createArtsExportJob(eventId) {
  const res = await apiClient.post(
    `/arts/events/${encodeURIComponent(eventId)}/export-jobs`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function getArtsExportJobStatus(
  eventId,
  jobId
) {
  const res = await apiClient.get(
    `/arts/events/${encodeURIComponent(eventId)}/export-jobs/${encodeURIComponent(jobId)}`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function usePerformances(){
  return useQuery({ queryKey: ["arts", "performances"], queryFn: fetchPerformances, retry: false });
}
