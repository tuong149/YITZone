import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CalendarClock, CheckCircle2, GitCompareArrows, UserPlus } from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractApiErrorMessage } from "@/lib/api-client";
import {
  appointPersonnelSingle,
  createRestructuringBatch,
  dismissPersonnelSingle,
  fetchUnitMembers,
  previewRestructuringDiff,
  publishRestructuringBatch,
  transferPersonnelSingle
} from "./api";

export function RestructuringPage() {
  const [selectedUnits, setSelectedUnits] = useState(["EMFIT"]);
  const [batchTitle, setBatchTitle] = useState("Kiện toàn Bộ máy Q1/2027");
  const [batchMembers, setBatchMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [previewWarnings, setPreviewWarnings] = useState([]);
  const [effectiveMode, setEffectiveMode] = useState("IMMEDIATE");
  const [effectiveDate, setEffectiveDate] = useState("");

  const [singleMssv, setSingleMssv] = useState("");
  const [singleAction, setSingleAction] = useState("APPOINT");
  const [singleUnitId, setSingleUnitId] = useState("EMFIT");
  const [singleToUnitId, setSingleToUnitId] = useState("OFIT");
  const [singleRoleCode, setSingleRoleCode] = useState("COMMITTEE_HEAD");

  const [dialogMode, setDialogMode] = useState(null); // "batch" | "single" | null
  const [resultBanner, setResultBanner] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);

  useEffect(() => {
    let active = true;
    const loadMembers = async () => {
      if (selectedUnits.length === 0) {
        setBatchMembers([]);
        return;
      }
      setLoadingMembers(true);
      try {
        const lists = await Promise.all(
          selectedUnits.map((u) => fetchUnitMembers(u).catch(() => []))
        );
        if (!active) return;
        const merged = new Map();
        for (const list of lists) {
          for (const m of list) {
            if (!merged.has(m.id)) {
              merged.set(m.id, {
                id: m.id,
                studentCode: m.studentCode || m.email,
                fullName: m.fullName,
                unitId: m.unitId,
                currentRoleCode: m.roleCode || "COLLABORATOR",
                currentRole: `${m.roleCode || "COLLABORATOR"} (${m.unitId})`,
                decision: "KEEP",
                proposedRole: "Giữ nguyên chức vụ",
                warning: (m.unreturnedAssets?.length ?? 0) > 0
                  ? `Còn ${m.unreturnedAssets.length} tài sản VP chưa trả: ${m.unreturnedAssets.join(", ")}`
                  : null
              });
            }
          }
        }
        setBatchMembers(Array.from(merged.values()));
      } finally {
        if (active) setLoadingMembers(false);
      }
    };
    void loadMembers();
    return () => {
      active = false;
    };
  }, [selectedUnits]);

  const toggleUnit = (code) => {
    setSelectedUnits((prev) =>
      prev.includes(code) ? prev.filter((u) => u !== code) : [...prev, code]
    );
  };

  const updateDecision = (id, decision) => {
    setBatchMembers((prev) =>
      prev.map((m) =>
        m.id !== id
          ? m
          : {
              ...m,
              decision,
              proposedRole:
                decision === "KEEP"
                  ? "Giữ nguyên chức vụ"
                  : decision === "DISMISS"
                    ? "Thôi giữ chức (đóng endAt → lưu termHistory)"
                    : "Đổi / Thăng chức nguyên tử"
            }
      )
    );
  };

  const localWarnings = batchMembers.filter((m) => m.decision === "DISMISS" && m.warning);

  const handleConfirmPublish = async (reason) => {
    setErrorBanner(null);
    setResultBanner(null);
    try {
      if (dialogMode === "single") {
        if (singleAction === "APPOINT") {
          await appointPersonnelSingle({
            targetIdentifier: singleMssv.trim(),
            unitId: singleUnitId,
            roleCode: singleRoleCode,
            termYear: "2026-2027",
            reason
          });
        } else if (singleAction === "DISMISS") {
          await dismissPersonnelSingle({
            targetIdentifier: singleMssv.trim(),
            unitId: singleUnitId,
            reason
          });
        } else {
          await transferPersonnelSingle({
            targetIdentifier: singleMssv.trim(),
            fromUnitId: singleUnitId,
            toUnitId: singleToUnitId,
            newRoleCode: singleRoleCode,
            termYear: "2026-2027",
            reason
          });
        }
        setResultBanner(
          `Đã thực thi kiện toàn lẻ (${singleAction}) cho ${singleMssv.trim()}, cập nhật termHistory & thu hồi cache quyền ≤ 5s.`
        );
        setSingleMssv("");
        return;
      }

      const changes = batchMembers.map((m) => ({
        userId: m.id,
        action:
          m.decision === "DISMISS"
            ? "RESIGN_OR_DISMISS"
            : m.decision === "PROMOTE"
              ? "CHANGE_ROLE"
              : "KEEP",
        previousRoleCode: m.currentRoleCode,
        previousPositionTitle: null,
        previousUnitId: m.unitId,
        newRoleCode: m.decision === "PROMOTE" ? "TEAM_LEADER" : null,
        newPositionTitle: null,
        newUnitId: m.decision === "PROMOTE" ? m.unitId : null,
        note: reason
      }));

      const effectiveAtIso =
        effectiveMode === "SCHEDULED" && effectiveDate ? new Date(effectiveDate).toISOString() : null;

      const batch = await createRestructuringBatch({
        title: batchTitle.trim() || `Kiện toàn ${selectedUnits.join(", ")}`,
        termYear: "2026-2027",
        targetUnitIds: selectedUnits,
        changes,
        effectiveAt: effectiveAtIso
      });

      const preview = await previewRestructuringDiff(batch.id);
      setPreviewWarnings(preview.handoverWarnings ?? []);

      const published = await publishRestructuringBatch(batch.id, {
        effectiveAt: effectiveAtIso,
        reason
      });

      setResultBanner(
        `Đã ban hành Đợt kiện toàn "${published.title}" (Trạng thái: ${published.status}). Các đơn vị không được chọn hoàn toàn không bị ảnh hưởng.`
      );
    } catch (err) {
      setErrorBanner(extractApiErrorMessage(err, "Không thể thực thi kiện toàn nhân sự. Vui lòng kiểm tra thẩm quyền và quy chế định biên."));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-foreground">
          Kiện toàn Bộ máy Nhân sự Linh hoạt
        </h1>
        <p className="text-sm text-muted-foreground">
          Hỗ trợ kiện toàn lẻ bất cứ lúc nào hoặc Đợt Kiện toàn theo đúng 1/vài Ban/Tổ (không ảnh hưởng các đơn vị đang ổn định), kèm Diff Preview và thu hồi quyền ≤ 5s.
        </p>
      </div>

      {resultBanner && (
        <div className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{resultBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-xs font-medium text-status-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      <Tabs defaultValue="batch">
        <TabsList>
          <TabsTrigger value="batch">Đợt Kiện toàn Theo Đơn vị (Restructuring Batch)</TabsTrigger>
          <TabsTrigger value="single">Kiện toàn Lẻ (Bổ nhiệm / Miễn nhiệm / Điều chuyển)</TabsTrigger>
        </TabsList>

        <TabsContent value="batch" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Bước 1: Chọn Đơn vị Tham gia Đợt Kiện toàn</CardTitle>
              <CardDescription>
                Các Ban/Tổ không được chọn sẽ giữ nguyên trạng thái ổn định. Riêng BCH Đoàn (BCH_DOAN) chỉ BTV Đoàn bổ nhiệm; BCH Liên Chi hội (BCH_HOI) chỉ Thường trực LCH bổ nhiệm; LCH Trưởng bắt buộc kiêm 1 trong 2 Phó Bí thư Đoàn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-w-md space-y-1.5">
                <Label htmlFor="batch-title">Tên đợt kiện toàn</Label>
                <Input
                  id="batch-title"
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  placeholder="VD: Kiện toàn Ban EMFIT Q1/2027"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["EMFIT", "OFIT", "ARTIT", "SV5T", "BCH_DOAN", "BCH_HOI"].map((code) => {
                  const active = selectedUnits.includes(code);
                  return (
                    <Button
                      key={code}
                      type="button"
                      size="sm"
                      variant={active ? "default" : "outline"}
                      onClick={() => toggleUnit(code)}
                    >
                      {code} {active ? "✓" : ""}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompareArrows className="h-5 w-5 text-primary" />
                Bước 2: Bảng So sánh Trước – Sau (Diff Preview) · Đơn vị: {selectedUnits.join(", ") || "Chưa chọn"}
              </CardTitle>
              <CardDescription>
                Tích nhanh quyết định cho từng nhân sự; mọi chức vụ đóng `endAt` được tự động lưu vào `termHistory`.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingMembers ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  Đang tải danh sách nhân sự của các đơn vị đã chọn...
                </div>
              ) : batchMembers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                  Chưa có nhân sự đang tại nhiệm nào trong các đơn vị đã chọn.
                </div>
              ) : (
                <div className="space-y-3">
                  {batchMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4 lg:flex-row lg:items-center"
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">
                          {m.fullName}{" "}
                          <span className="tabular-mono text-xs text-muted-foreground">({m.studentCode})</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant="outline">Trước: {m.currentRole}</Badge>
                          <span>→</span>
                          <Badge
                            variant={
                              m.decision === "DISMISS"
                                ? "danger"
                                : m.decision === "PROMOTE"
                                  ? "success"
                                  : "secondary"
                            }
                          >
                            Sau: {m.proposedRole}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {["KEEP", "PROMOTE", "DISMISS"].map((dec) => (
                          <Button
                            key={dec}
                            type="button"
                            size="sm"
                            variant={
                              m.decision === dec
                                ? dec === "DISMISS"
                                  ? "destructive"
                                  : "default"
                                : "outline"
                            }
                            onClick={() => updateDecision(m.id, dec)}
                          >
                            {dec === "KEEP"
                              ? "Giữ nguyên"
                              : dec === "PROMOTE"
                                ? "Đổi / Thăng chức"
                                : "Thôi giữ chức"}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(localWarnings.length > 0 || previewWarnings.length > 0) && (
                <div className="space-y-1.5 rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 text-xs text-status-warning">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Cảnh báo Bàn giao trước khi Ban hành ({localWarnings.length + previewWarnings.length})</span>
                  </div>
                  {localWarnings.map((w) => (
                    <p key={w.id}>
                      <strong>{w.fullName}:</strong> {w.warning}
                    </p>
                  ))}
                  {previewWarnings.map((w, idx) => (
                    <p key={`srv-${idx}`}>
                      <strong>[{w.warningType}]:</strong> {w.details}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="eff-mode">Thời điểm hiệu lực</Label>
                    <Select
                      value={effectiveMode}
                      onValueChange={(v) => setEffectiveMode(v)}
                    >
                      <SelectTrigger id="eff-mode" className="w-64 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMMEDIATE">Ban hành ngay lập tức</SelectItem>
                        <SelectItem value="SCHEDULED">Hẹn ngày hiệu lực (SCHEDULED)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {effectiveMode === "SCHEDULED" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="eff-date">Ngày/giờ áp dụng</Label>
                      <Input
                        id="eff-date"
                        type="datetime-local"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  disabled={selectedUnits.length === 0 || batchMembers.length === 0}
                  onClick={() => setDialogMode("batch")}
                >
                  <CalendarClock className="h-4 w-4" />
                  Ban hành Đợt Kiện toàn
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Kiện toàn Lẻ (Bổ nhiệm / Miễn nhiệm / Điều chuyển Nguyên tử)
              </CardTitle>
              <CardDescription>
                Thực hiện ngay cho 01 nhân sự: đóng chức vụ cũ (`endAt`) + mở chức vụ mới (`startAt`) nguyên tử, bảo toàn dữ liệu lịch sử cũ.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="single-mssv">MSSV hoặc Email Nhân sự</Label>
                <Input
                  id="single-mssv"
                  value={singleMssv}
                  onChange={(e) => setSingleMssv(e.target.value)}
                  placeholder="Nhập MSSV 8 chữ số hoặc email..."
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="single-action">Loại thao tác</Label>
                <Select value={singleAction} onValueChange={setSingleAction}>
                  <SelectTrigger id="single-action" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPOINT">Bổ nhiệm chức vụ mới</SelectItem>
                    <SelectItem value="TRANSFER">Điều chuyển / Thăng chức nguyên tử</SelectItem>
                    <SelectItem value="DISMISS">Thôi giữ chức / Miễn nhiệm (thu hồi quyền ≤ 5s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="single-unit">Đơn vị {singleAction === "TRANSFER" ? "nguồn" : "áp dụng"}</Label>
                <Select value={singleUnitId} onValueChange={setSingleUnitId}>
                  <SelectTrigger id="single-unit" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["EMFIT", "OFIT", "ARTIT", "SV5T", "EMFIT_TT", "EMFIT_VH", "EMFIT_TU", "BCH_DOAN", "BCH_HOI"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {singleAction === "TRANSFER" && (
                <div className="space-y-1.5">
                  <Label htmlFor="single-to-unit">Đơn vị đích</Label>
                  <Select value={singleToUnitId} onValueChange={setSingleToUnitId}>
                    <SelectTrigger id="single-to-unit" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["EMFIT", "OFIT", "ARTIT", "SV5T", "EMFIT_TT", "EMFIT_VH", "EMFIT_TU", "BCH_DOAN", "BCH_HOI"].map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {singleAction !== "DISMISS" && (
                <div className="space-y-1.5">
                  <Label htmlFor="single-role">Vai trò bổ nhiệm</Label>
                  <Select value={singleRoleCode} onValueChange={setSingleRoleCode}>
                    <SelectTrigger id="single-role" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COLLABORATOR">Cộng tác viên (CTV)</SelectItem>
                      <SelectItem value="DEPUTY_TEAM_LEADER">Tổ phó</SelectItem>
                      <SelectItem value="TEAM_LEADER">Tổ trưởng</SelectItem>
                      <SelectItem value="VICE_COMMITTEE_HEAD">Phó Ban</SelectItem>
                      <SelectItem value="COMMITTEE_HEAD">Trưởng Ban</SelectItem>
                      <SelectItem value="EXECUTIVE_COMMITTEE">Ủy viên BCH</SelectItem>
                      <SelectItem value="STANDING_COMMITTEE">Ban Thường vụ (BTV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-end">
                <Button
                  type="button"
                  className="w-full"
                  disabled={!singleMssv.trim()}
                  onClick={() => setDialogMode("single")}
                >
                  Thực thi &amp; Ghi Audit Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(dialogMode)}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
        title="Ban hành Quyết định Kiện toàn Nhân sự"
        description="Hệ thống sẽ cập nhật startAt/endAt, lưu termHistory, thu hồi cache quyền cũ trong ≤ 5 giây và ghi đầy đủ vào Audit Log."
        targetSummary={
          dialogMode === "single"
            ? `Nhân sự ${singleMssv.trim()} · Thao tác ${singleAction} (${singleUnitId})`
            : `Đơn vị: ${selectedUnits.join(", ")} · Chế độ: ${
                effectiveMode === "IMMEDIATE" ? "Hiệu lực ngay" : `Hẹn giờ (${effectiveDate || "chưa chọn"})`
              }`
        }
        actionCode="IAM_RESTRUCTURING_PUBLISH"
        destructive={false}
        confirmLabel="Xác nhận Ban hành"
        onConfirm={handleConfirmPublish}
      />
    </div>
  );
}
