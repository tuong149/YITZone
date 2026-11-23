import { apiClient, type ApiResponse } from "@/lib/api-client";

export interface OfflineBundleDto {
  eventId: string;
  revision: number;
  sinceRevision: number;
  serverTime: number;
  bucketSeconds: number;
  maxBundleAgeHours: number;
  roster: unknown[];
}

export interface OfflineScanItemPayload {
  ticketId: string;
  studentCode: string;
  adjustedScanAtEpochMs: number;
  localSeq: number;
}

export interface OfflineScanSyncResponseDto {
  eventId: string;
  batchId: string;
  syncedCount: number;
  wipeRecommended: boolean;
}

export interface BarcodeScanResponseDto {
  eventId: string;
  attendeeKey: string;
  studentCode: string;
  hardwareType: string;
  checkinAt: string;
}

export async function fetchOfflineBundle(
  eventId: string,
  sinceRevision = 0,
  ifNoneMatch?: string
): Promise<{ bundle: OfflineBundleDto | null; etag: string | null; notModified: boolean }> {
  const headers: Record<string, string> = {};
  if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;

  const res = await apiClient.get<ApiResponse<OfflineBundleDto>>(
    `/events/${encodeURIComponent(eventId)}/offline-bundle`,
    {
      params: { sinceRevision },
      headers,
      validateStatus: (s) => s === 200 || s === 304
    }
  );
  if (res.status === 304) {
    return { bundle: null, etag: (res.headers.etag as string | undefined) ?? ifNoneMatch ?? null, notModified: true };
  }
  if (!res.data.success) throw new Error(res.data.detail);
  return {
    bundle: res.data.data,
    etag: (res.headers.etag as string | undefined) ?? null,
    notModified: false
  };
}

export async function syncOfflineScans(
  eventId: string,
  payload: {
    batchId: string;
    lastServerSyncAtEpochMs: number;
    clockOffsetMs: number;
    scans: OfflineScanItemPayload[];
  }
): Promise<OfflineScanSyncResponseDto> {
  const res = await apiClient.post<ApiResponse<OfflineScanSyncResponseDto>>(
    `/events/${encodeURIComponent(eventId)}/offline-scans/sync`,
    payload
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function scanPhysicalStudentBarcode(
  eventId: string,
  payload: {
    sessionId: string;
    studentCode: string;
    hardwareType: string;
    physicalCardVerified: boolean;
  }
): Promise<BarcodeScanResponseDto> {
  const res = await apiClient.post<ApiResponse<BarcodeScanResponseDto>>(
    `/events/${encodeURIComponent(eventId)}/attendance/barcode-scan`,
    payload
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}
