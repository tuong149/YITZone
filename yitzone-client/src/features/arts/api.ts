import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

export interface ArtsExportJobCreatedDto {
  jobId: string;
  eventId: string;
  status: string;
  statusUrl: string;
}

export interface ArtsExportJobStatusDto {
  jobId: string;
  eventId: string;
  status: string;
  supportsHttpRangeResume: boolean;
  presignedDownloadUrl: string;
  expiresAt: string;
}

export async function fetchPerformances(): Promise<unknown[]> {
  const res = await apiClient.get<ApiResponse<unknown[]>>("/arts/performances");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function createArtsExportJob(eventId: string): Promise<ArtsExportJobCreatedDto> {
  const res = await apiClient.post<ApiResponse<ArtsExportJobCreatedDto>>(
    `/arts/events/${encodeURIComponent(eventId)}/export-jobs`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function getArtsExportJobStatus(
  eventId: string,
  jobId: string
): Promise<ArtsExportJobStatusDto> {
  const res = await apiClient.get<ApiResponse<ArtsExportJobStatusDto>>(
    `/arts/events/${encodeURIComponent(eventId)}/export-jobs/${encodeURIComponent(jobId)}`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function usePerformances(){
  return useQuery({ queryKey: ["arts", "performances"], queryFn: fetchPerformances, retry: false });
}
