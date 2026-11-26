import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Lock,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { QueryState } from "@/components/ui/query-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { extractApiErrorMessage } from "@/lib/api-client";
import { useAuditLogs, verifyAuditChain } from "./api";

export function AuditLogAdminPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);
  const [selectedAudit, setSelectedAudit] = useState(null);

  const {
    data: apiAuditPage,
    isLoading,
    isError,
    error,
    refetch
  } = useAuditLogs(50);

  const records = useMemo(() => {
    if (!apiAuditPage?.items?.length) return [];
    return apiAuditPage.items.map((item, idx) => ({
      id: item.id ?? `aud-api-${idx}`,
      seq: item.sequenceNumber ?? idx + 1,
      timestamp: item.createdAt ?? "—",
      actor: item.actorId ?? "SYSTEM",
      action: item.action ?? "AUDIT_EVENT",
      category: item.category ?? "RBAC",
      target: `${item.targetType ?? "ENTITY"} · ${item.targetId ?? "—"}`,
      reason: item.reason ?? "—",
      changedFields: item.changedFields ?? {},
      hash: item.entryHash ?? "—",
      prevHash: item.previousHash ?? "—"
    }));
  }, [apiAuditPage]);

  const filtered = useMemo(
    () =>
      records.filter((item) => {
        const matchCat = category === "ALL" || item.category === category;
        const q = search.trim().toLowerCase();
        const matchText =
          !q ||
          item.actor.toLowerCase().includes(q) ||
          item.action.toLowerCase().includes(q) ||
          item.target.toLowerCase().includes(q) ||
          String(item.seq).includes(q);
        return matchCat && matchText;
      }),
    [records, search, category]
  );

  const headEntry = records[0] ?? null;

  const runIntegrityCheck = async () => {
    setVerifying(true);
    setVerifyResult(null);
    setVerifyError(null);
    try {
      const res = await verifyAuditChain();
      setVerifyResult(
        `Đã kiểm chứng chuỗi băm (${res.chainId}): ${
          res.integrityValid ? "Toàn vẹn 100%" : "Chưa có bản ghi hoặc cần kiểm tra"
        } · ${res.verifiedEntriesCount} mục đã xác minh.`
      );
    } catch (err) {
      setVerifyError(
        extractApiErrorMessage(
          err,
          "Không thể kết nối máy chủ để xác minh chuỗi băm Audit Log."
        )
      );
    } finally {
      setVerifying(false);
    }
  };

  const columns = [
    {
      key: "seq",
      header: "Seq #",
      render: (r) => <span className="tabular-mono font-semibold text-primary">#{r.seq}</span>
    },
    {
      key: "time",
      header: "Thời gian",
      render: (r) => <span className="tabular-mono text-xs text-muted-foreground">{r.timestamp}</span>
    },
    {
      key: "actor",
      header: "Tác nhân (Actor)",
      render: (r) => <span className="font-medium">{r.actor}</span>
    },
    {
      key: "action",
      header: "Hành động",
      render: (r) => (
        <Badge variant="outline" className="tabular-mono">
          {r.action}
        </Badge>
      )
    },
    {
      key: "target",
      header: "Đối tượng",
      render: (r) => <span className="text-xs text-muted-foreground">{r.target}</span>
    },
    {
      key: "hash",
      header: "Hash-chain",
      render: (r) => <span className="tabular-mono text-xs text-foreground">{r.hash}</span>
    },
    {
      key: "diff",
      header: "Chi tiết",
      align: "right",
      render: (r) => (
        <Button size="sm" variant="outline" onClick={() => setSelectedAudit(r)}>
          <Eye className="h-3.5 w-3.5" />
          Xem Diff
        </Button>
      )
    }
  ];

  const changedEntries = selectedAudit ? Object.entries(selectedAudit.changedFields ?? {}) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Nhật ký Kiểm tra Bất biến — Audit Log Hash-chain
          </h1>
          <p className="text-sm text-muted-foreground">
            Nhật ký chỉ đọc, ghi nối tiếp theo thứ tự bất biến, lưu tối thiểu các trường thay đổi (lưu trữ ≥ 5 năm) và đối soát toàn vẹn định kỳ.
          </p>
        </div>
        <VerifiedBadge label="Append-only · Chỉ đọc" />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-status-success" />
              Trạng thái Chuỗi Băm `MAIN_CHAIN`
            </CardTitle>
            <CardDescription className="tabular-mono">
              {headEntry
                ? `Đỉnh hiện tại: seq #${headEntry.seq} · Hash ${headEntry.hash}`
                : "Chưa có bản ghi kiểm toán nào được tải từ máy chủ."}
            </CardDescription>
          </div>
          <Button type="button" onClick={() => void runIntegrityCheck()} disabled={verifying}>
            <RefreshCw className={`h-4 w-4 ${verifying ? "animate-spin" : ""}`} />
            {verifying ? "Đang xác minh chuỗi..." : "Kiểm tra Toàn vẹn Chuỗi"}
          </Button>
        </CardHeader>
        {(verifyResult || verifyError) && (
          <CardContent className="pt-0">
            {verifyResult && (
              <div className="flex items-center gap-2 rounded-xl border border-status-success/35 bg-status-success/10 px-4 py-2.5 text-xs font-medium text-status-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{verifyResult}</span>
              </div>
            )}
            {verifyError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-status-danger/35 bg-status-danger/10 px-4 py-2.5 text-xs font-medium text-status-danger"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-12">
        <div className="relative md:col-span-8">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tra cứu theo Actor, mã Action, MSSV, hoặc số seq..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="md:col-span-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger aria-label="Lọc nhóm kiểm toán">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả nhóm sự kiện</SelectItem>
              <SelectItem value="RBAC">Phân quyền &amp; Nhân sự (RBAC)</SelectItem>
              <SelectItem value="ATTENDANCE">Điểm danh &amp; Hậu kiểm</SelectItem>
              <SelectItem value="CERT">E-Certificate &amp; Đặc cách CĐDN</SelectItem>
              <SelectItem value="PRIVACY">Neo Hash &amp; Quyền riêng tư</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        errorMessage={extractApiErrorMessage(
          error,
          "Không thể tải nhật ký kiểm toán từ máy chủ. Vui lòng thử lại."
        )}
        onRetry={() => void refetch()}
        isEmpty={filtered.length === 0}
        emptyTitle="Chưa có bản ghi kiểm toán nào"
        emptyDescription="Các thao tác quản trị có chữ ký số và liên kết Hash-chain sẽ được ghi nhận bất biến tại đây."
        skeletonCount={3}
      >
        <DataTable columns={columns} data={filtered} />
      </QueryState>

      <Dialog
        open={Boolean(selectedAudit)}
        onOpenChange={(open) => {
          if (!open) setSelectedAudit(null);
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              <span>Bản ghi Kiểm toán #{selectedAudit?.seq}</span>
            </DialogTitle>
            <DialogDescription className="tabular-mono">
              {selectedAudit?.action} · {selectedAudit?.timestamp}
            </DialogDescription>
          </DialogHeader>

          {selectedAudit && (
            <div className="space-y-4 text-sm">
              <div className="space-y-1 rounded-xl border border-border bg-muted/40 p-3.5 text-xs">
                <div>
                  <span className="text-muted-foreground">Actor:</span>{" "}
                  <strong className="text-foreground">{selectedAudit.actor}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Target:</span>{" "}
                  <strong className="text-foreground">{selectedAudit.target}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Lý do bắt buộc:</span>{" "}
                  <span className="text-foreground">{selectedAudit.reason}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">
                  Thay đổi tối thiểu (`changedFields` diff)
                </div>
                {changedEntries.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                    Không có dữ liệu trường thay đổi chi tiết trên bản ghi này.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {changedEntries.map(([field, diff]) => (
                      <div
                        key={field}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-2 tabular-mono text-xs"
                      >
                        <span className="font-semibold text-foreground">{field}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-status-danger line-through">{diff?.before ?? "—"}</span>
                          <span>→</span>
                          <span className="font-semibold text-status-success">{diff?.after ?? "—"}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 tabular-mono text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  prev: {selectedAudit.prevHash}
                </span>
                <span>hash: {selectedAudit.hash}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
