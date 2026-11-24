import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

/**
 * @typedef {Object} CertificateSummaryDto
 * @property {string} certificateId
 * @property {string} certificateCode
 * @property {string} status
 */

/**
 * @typedef {Object} CertificateVerifyDto
 * @property {string} certificateCode
 * @property {boolean} valid
 */

/**
 * @typedef {Object} CertificatePdfUrlDto
 * @property {string} certificateId
 * @property {string} presignedPdfUrl
 * @property {number} expiresInSeconds
 */

export async function fetchMyCertificates() {
  const res = await apiClient.get("/certificates/me");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchCertificatePdfUrl(id) {
  const res = await apiClient.get(
    `/certificates/${encodeURIComponent(id)}/pdf`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function verifyCertificateCode(code) {
  const res = await apiClient.get(
    `/certificates/verify/${encodeURIComponent(code)}`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function revokeCertificate(
  id,
  reason,
  idempotencyKey = crypto.randomUUID()
) {
  const res = await apiClient.post(
    `/certificates/${encodeURIComponent(id)}/revoke`,
    { reason },
    { headers: { "Idempotency-Key": idempotencyKey } }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function reissueCertificate(
  id,
  reason,
  idempotencyKey = crypto.randomUUID()
) {
  const res = await apiClient.post(
    `/certificates/${encodeURIComponent(id)}/reissue`,
    { reason },
    { headers: { "Idempotency-Key": idempotencyKey } }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useMyCertificates() {
  const userId = useAuthStore((s) => s.userId);
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  return useQuery({
    queryKey: qk.private(userId, activeScopeId, "certificates", "me"),
    queryFn: fetchMyCertificates,
    enabled: Boolean(userId),
    retry: false
  });
}

export function useCertificateVerify(code) {
  return useQuery({
    queryKey: ["certificates", "verify", code],
    queryFn: () => verifyCertificateCode(code),
    enabled: Boolean(code),
    retry: false
  });
}
