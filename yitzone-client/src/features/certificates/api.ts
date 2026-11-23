import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export interface CertificateSummaryDto {
  certificateId: string;
  certificateCode: string;
  status: string;
}

export interface CertificateVerifyDto {
  certificateCode: string;
  valid: boolean;
}

export interface CertificatePdfUrlDto {
  certificateId: string;
  presignedPdfUrl: string;
  expiresInSeconds: number;
}

export async function fetchMyCertificates(): Promise<CertificateSummaryDto[]> {
  const res = await apiClient.get<ApiResponse<CertificateSummaryDto[]>>("/certificates/me");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function fetchCertificatePdfUrl(id: string): Promise<CertificatePdfUrlDto> {
  const res = await apiClient.get<ApiResponse<CertificatePdfUrlDto>>(
    `/certificates/${encodeURIComponent(id)}/pdf`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function verifyCertificateCode(code: string): Promise<CertificateVerifyDto> {
  const res = await apiClient.get<ApiResponse<CertificateVerifyDto>>(
    `/certificates/verify/${encodeURIComponent(code)}`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function revokeCertificate(
  id: string,
  reason: string,
  idempotencyKey: string = crypto.randomUUID()
) {
  const res = await apiClient.post<
    ApiResponse<{
      certificateId: string;
      certStatus: string;
      reason: string;
      revokedBy: string;
      revokedAt: string;
      idempotencyKey: string;
    }>
  >(
    `/certificates/${encodeURIComponent(id)}/revoke`,
    { reason },
    { headers: { "Idempotency-Key": idempotencyKey } }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function reissueCertificate(
  id: string,
  reason: string,
  idempotencyKey: string = crypto.randomUUID()
) {
  const res = await apiClient.post<
    ApiResponse<{
      previousCertificateId: string;
      previousStatus: string;
      newCertVersion: number;
      reason: string;
      reissuedBy: string;
      idempotencyKey: string;
    }>
  >(
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

export function useCertificateVerify(code: string) {
  return useQuery({
    queryKey: ["certificates", "verify", code],
    queryFn: () => verifyCertificateCode(code),
    enabled: Boolean(code),
    retry: false
  });
}
