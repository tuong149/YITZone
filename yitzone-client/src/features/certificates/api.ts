import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

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

function makeIdempotencyKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
: `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function revokeCertificate(id: string, reason: string) {
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
    { headers: { "Idempotency-Key": makeIdempotencyKey() } }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function reissueCertificate(id: string, reason: string) {
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
    { headers: { "Idempotency-Key": makeIdempotencyKey() } }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useMyCertificates(){
  return useQuery({
    queryKey: ["certificates", "me"],
    queryFn: fetchMyCertificates,
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
