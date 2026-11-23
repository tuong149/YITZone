import { useQuery } from "@tanstack/react-query";
import { apiClient, type ApiResponse } from "@/lib/api-client";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";

export interface AuditLogItemDto {
  id?: string;
  sequenceNumber?: number;
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
  entryHash?: string;
  previousHash?: string;
  createdAt?: string;
}

export interface AuditLogPageDto {
  hashChainVerified: boolean;
  beforeSeq: number;
  limit: number;
  items: AuditLogItemDto[];
}

export interface AuditChainVerifyDto {
  chainId: string;
  integrityValid: boolean;
  verifiedEntriesCount: number;
}

export async function fetchAuditLogs(beforeSeq?: number, limit = 50): Promise<AuditLogPageDto> {
  const res = await apiClient.get<ApiResponse<AuditLogPageDto>>("/audit/logs", {
    params: { beforeSeq, limit }
  });
  if (!res.data.success) throw new Error(res.data.detail);
  return res.data.data;
}

export async function verifyAuditChain(): Promise<AuditChainVerifyDto> {
  const res = await apiClient.get<ApiResponse<AuditChainVerifyDto>>("/audit/verify-chain");
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
