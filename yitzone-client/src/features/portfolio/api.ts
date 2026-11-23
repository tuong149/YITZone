import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";

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

export function useMyPortfolio(){
  return useQuery({ queryKey: ["portfolio", "me"], queryFn: fetchMyPortfolio, retry: false });
}

export function useVerifyPortfolioToken(token: string) {
  return useQuery({
    queryKey: ["portfolio", "verify", token],
    queryFn: () => verifyPortfolioToken(token),
    enabled: Boolean(token),
    retry: false
  });
}
