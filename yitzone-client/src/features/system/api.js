import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

/**
 * @typedef {Object} AuditLogItemDto
 * @property {string} [id]
 * @property {number} [sequenceNumber]
 * @property {string} [actorId]
 * @property {string} [action]
 * @property {string} [targetType]
 * @property {string} [targetId]
 * @property {string} [reason]
 * @property {string} [entryHash]
 * @property {string} [previousHash]
 * @property {string} [createdAt]
 */

/**
 * @typedef {Object} AuditLogPageDto
 * @property {boolean} hashChainVerified
 * @property {number} beforeSeq
 * @property {number} limit
 * @property {AuditLogItemDto[]} items
 */

/**
 * @typedef {Object} AuditChainVerifyDto
 * @property {string} chainId
 * @property {boolean} integrityValid
 * @property {number} verifiedEntriesCount
 */

export async function fetchAuditLogs(beforeSeq, limit = 50) {
  const res = await apiClient.get("/audit/logs", {
    params: { beforeSeq, limit }
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function verifyAuditChain() {
  const res = await apiClient.get("/audit/verify-chain");
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export function useAuditLogs(limit = 50) {
  const userId = useAuthStore((s) => s.userId);
  const activeScopeId = useAuthStore((s) => s.activeScopeId);
  return useQuery({
    queryKey: qk.private(userId, activeScopeId, "audit", "logs", limit),
    queryFn: () => fetchAuditLogs(undefined, limit),
    enabled: Boolean(userId),
    retry: false
  });
}
