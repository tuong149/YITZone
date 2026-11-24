import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

/**
 * @typedef {Object} PortfolioSummaryDto
 * @property {number} sv5tProgress
 * @property {number} verifiedActivities
 */

/**
 * @typedef {Object} CvExportDto
 * @property {string} status
 * @property {string} presignedPdfUrl
 */

/**
 * @typedef {Object} PortfolioVerifyDto
 * @property {string} verificationToken
 * @property {boolean} valid
 * @property {unknown[]} verifiedCertificates
 */

export async function fetchMyPortfolio() {
  const res = await apiClient.get("/portfolio/me");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function exportVerifiedCvPdf() {
  const res = await apiClient.post("/portfolio/me/export-cv");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function verifyPortfolioToken(token) {
  const res = await apiClient.get(
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

export function useVerifyPortfolioToken(token) {
  return useQuery({
    queryKey: ["portfolio", "verify", token],
    queryFn: () => verifyPortfolioToken(token),
    enabled: Boolean(token),
    retry: false
  });
}
