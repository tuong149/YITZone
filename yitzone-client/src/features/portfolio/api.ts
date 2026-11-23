import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export interface PortfolioSummaryDto {
  sv5tProgress: number;
  verifiedActivities: number;
}

export interface CvExportDto {
  status: string;
  presignedPdfUrl: string;
}

export interface PortfolioVerifyDto {
  verificationToken: string;
  valid: boolean;
  verifiedCertificates: unknown[];
}

export async function fetchMyPortfolio(): Promise<PortfolioSummaryDto> {
  const res = await apiClient.get<ApiResponse<PortfolioSummaryDto>>("/portfolio/me");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function exportVerifiedCvPdf(): Promise<CvExportDto> {
  const res = await apiClient.post<ApiResponse<CvExportDto>>("/portfolio/me/export-cv");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function verifyPortfolioToken(token: string): Promise<PortfolioVerifyDto> {
  const res = await apiClient.get<ApiResponse<PortfolioVerifyDto>>(
    `/portfolio/verify/${encodeURIComponent(token)}`
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useMyPortfolio() {
  const userId = useAuthStore((s) => s.userId);
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  return useQuery({
    queryKey: qk.private(userId, activeScopeId, "portfolio", "me"),
    queryFn: fetchMyPortfolio,
    enabled: Boolean(userId),
    retry: false
  });
}

export function useVerifyPortfolioToken(token: string) {
  return useQuery({
    queryKey: ["portfolio", "verify", token],
    queryFn: () => verifyPortfolioToken(token),
    enabled: Boolean(token),
    retry: false
  });
}
