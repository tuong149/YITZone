import { apiClient, resolveApiPath } from "@/lib/api-client";
import { createCanonicalDevicePop } from "@/lib/webcrypto";
import { useAuthStore } from "@/stores/auth-store";

/**
 * @typedef {Object} CastBallotResultDto
 * @property {string} campaignId
 * @property {string} receiptCode
 * @property {string} receiptHash
 * @property {string} status
 */

export async function castVotingBallot(
  campaignId,
  selectedCandidateIds,
  resolutionChoice
) {
  const userId = useAuthStore.getState().userId ?? "anonymous";
  const sorted = [...selectedCandidateIds].sort();
  const canonicalActionFields = `${campaignId}|${sorted.join(",")}|${resolutionChoice ?? ""}`;
  const relativePath = `/voting/campaigns/${encodeURIComponent(campaignId)}/cast-ballot`;
  const path = resolveApiPath(relativePath);
  const devicePop = await createCanonicalDevicePop({
    method: "POST",
    path,
    userId,
    canonicalActionFields
  });

  const res = await apiClient.post(relativePath, {
    selectedCandidateIds,
    resolutionChoice: resolutionChoice ?? null,
    devicePop
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function submitJudgeScore(
  campaignId,
  candidateId,
  score,
  note
) {
  const res = await apiClient.post(`/voting/campaigns/${encodeURIComponent(campaignId)}/judge-scores`, {
    candidateId,
    score,
    note
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function verifyBallotReceipt(campaignId, code) {
  const res = await apiClient.get(`/voting/campaigns/${encodeURIComponent(campaignId)}/verify-receipt`, { params: { code } });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}
