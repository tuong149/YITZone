import { apiClient } from "@/lib/api-client";

/**
 * @typedef {Object} OfflineBundleDto
 * @property {string} eventId
 * @property {number} revision
 * @property {number} sinceRevision
 * @property {number} serverTime
 * @property {number} bucketSeconds
 * @property {number} maxBundleAgeHours
 * @property {unknown[]} roster
 */

/**
 * @typedef {Object} OfflineScanItemPayload
 * @property {string} ticketId
 * @property {string} studentCode
 * @property {number} adjustedScanAtEpochMs
 * @property {number} localSeq
 */

/**
 * @typedef {Object} OfflineScanSyncResponseDto
 * @property {string} eventId
 * @property {string} batchId
 * @property {number} syncedCount
 * @property {boolean} wipeRecommended
 */

/**
 * @typedef {Object} BarcodeScanResponseDto
 * @property {string} eventId
 * @property {string} attendeeKey
 * @property {string} studentCode
 * @property {string} hardwareType
 * @property {string} checkinAt
 */

export async function fetchOfflineBundle(
  eventId,
  sinceRevision = 0,
  ifNoneMatch
) {
  const headers = {};
  if (ifNoneMatch) headers["If-None-Match"] = ifNoneMatch;

  const res = await apiClient.get(
    `/events/${encodeURIComponent(eventId)}/offline-bundle`,
    {
      params: { sinceRevision },
      headers,
      validateStatus: (s) => s === 200 || s === 304
    }
  );
  if (res.status === 304) {
    return { bundle: null, etag: (res.headers.etag) ?? ifNoneMatch ?? null, notModified: true };
  }
  if (!res.data.success) throw new Error(res.data.detail);
  return {
    bundle: res.data.data,
    etag: (res.headers.etag) ?? null,
    notModified: false
  };
}

export async function syncOfflineScans(
  eventId,
  payload
) {
  const res = await apiClient.post(
    `/events/${encodeURIComponent(eventId)}/offline-scans/sync`,
    payload
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function scanPhysicalStudentBarcode(
  eventId,
  payload
) {
  const res = await apiClient.post(
    `/events/${encodeURIComponent(eventId)}/attendance/barcode-scan`,
    payload
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}
