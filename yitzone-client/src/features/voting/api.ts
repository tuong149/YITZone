import { apiClient, type ApiResponse } from "@/lib/api-client";
import { createCanonicalDevicePop } from "@/lib/webcrypto";
import { useAuthStore } from "@/stores/auth-store";

export interface CastBallotResultDto {
  campaignId: string;
  receiptCode: string;
  receiptHash: string;
  status: string;
}

export async function castVotingBallot(
  campaignId: string,
  selectedCandidateIds: string[],
  resolutionChoice?: string
): Promise<CastBallotResultDto> {
  const userId = useAuthStore.getState().userId ?? "anonymous";
  const sorted = [...selectedCandidateIds].sort();
  const canonicalActionFields = `${campaignId}|${sorted.join(",")}|${resolutionChoice ?? ""}`;
  const path = `/api/v1/voting/campaigns/${encodeURIComponent(campaignId)}/cast-ballot`;
  const devicePop = await createCanonicalDevicePop({
    method: "POST",
    path,
    userId,
    canonicalActionFields
  });

  const res = await apiClient.post<ApiResponse<CastBallotResultDto>>(
    `/voting/campaigns/${encodeURIComponent(campaignId)}/cast-ballot`,
    { selectedCandidateIds, resolutionChoice: resolutionChoice ?? null, devicePop }
  );
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function submitJudgeScore(
  campaignId: string,
  candidateId: string,
  score: number,
  note?: string
) {
  const res = await apiClient.post<
    ApiResponse<{ campaignId: string; judgeUserId: string; candidateId: string; score: number }>
  >(`/voting/campaigns/${encodeURIComponent(campaignId)}/judge-scores`, {
    candidateId,
    score,
    note
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function verifyBallotReceipt(campaignId: string, code: string) {
  const res = await apiClient.get<
    ApiResponse<{ campaignId: string; ballotReceiptHash: string; valid: boolean; status: string }>
  >(`/voting/campaigns/${encodeURIComponent(campaignId)}/verify-receipt`, { params: { code } });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}
