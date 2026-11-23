import { useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, GitCompareArrows, UserPlus } from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BatchDecision = "KEEP" | "DISMISS" | "PROMOTE";

interface BatchMember {
  id: string;
  studentCode: string;
  fullName: string;
  currentRole: string;
  decision: BatchDecision;
  proposedRole: string;
  warning?: string;
}

const INITIAL_BATCH_MEMBERS: BatchMember[] = [
  {
    id: "bm-1",
    studentCode: "21110201",
    fullName: "Nguyễn Hoàng Phúc",
    currentRole: "Trưởng Ban EMFIT",
    decision: "DISMISS",
    proposedRole: "Thôi giữ chức (lưu termHistory)",
    warning: "Đang phụ trách sự kiện 'UTE Hackathon 2026' chưa kết thúc — cần bàn giao Trưởng BTC."
  },
  {
    id: "bm-2",
    studentCode: "22110345",
    fullName: "Nguyễn Minh Khoa",
    currentRole: "Phó Ban EMFIT",
    decision: "PROMOTE",
    proposedRole: "Trưởng Ban EMFIT"
  },
  {
    id: "bm-3",
    studentCode: "23110402",
    fullName: "Trần Mỹ Linh",
    currentRole: "Tổ trưởng Tổ Truyền thông",
    decision: "KEEP",
    proposedRole: "Giữ nguyên chức vụ"
  }
];

export function RestructuringPage(){
  const [selectedUnits, setSelectedUnits] = useState<string[]>(["EMFIT"]);
  const [batchMembers, setBatchMembers] = useState<BatchMember[]>(INITIAL_BATCH_MEMBERS);
  const [effectiveMode, setEffectiveMode] = useState<"IMMEDIATE" | "SCHEDULED">("IMMEDIATE");
  const [effectiveDate, setEffectiveDate] = useState("2026-12-01T00:00");
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [resultBanner, setResultBanner] = useState<string | null>(null);

  const toggleUnit = (code: string) => {
    setSelectedUnits((prev) =>
      prev.includes(code) ? prev.filter((u) => u !== code): [...prev, code]
    );
  };

  const updateDecision = (id: string, decision: BatchDecision) => {
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
: "Thăng chức / Điều chuyển nguyên tử"
            }
      )
    );
  };

  const warnings = batchMembers.filter((m) => m.decision === "DISMISS" && m.warning);

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

      <Tabs defaultValue="batch">
        <TabsList>
          <TabsTrigger value="batch">Đợt Kiện toàn Theo Đơn vị (Restructuring Batch)</TabsTrigger>
          <TabsTrigger value="single">Kiện toàn Lẻ (Bổ nhiệm / Miễn nhiệm / Điều chuyển)</TabsTrigger>
        </TabsList>

        <TabsContent value="batch" className="space-y-5">
          {/* Step 1: Select exact units */}
          <Card>
            <CardHeader>
              <CardTitle>Bước 1: Chọn Đơn vị Tham gia Đợt Kiện toàn</CardTitle>
              <CardDescription>
                Các Ban/Tổ không được chọn sẽ giữ nguyên trạng thái ổn định. Riêng BCH Đoàn (BCH_DOAN) chỉ BTV Đoàn bổ nhiệm; BCH Liên Chi hội (BCH_HOI) chỉ Thường trực LCH bổ nhiệm; LCH Trưởng bắt buộc kiêm 1 trong 2 Phó Bí thư Đoàn.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {["EMFIT", "OFIT", "ARTIT", "SV5T", "BCH_DOAN", "BCH_HOI"].map((code) => {
                const active = selectedUnits.includes(code);
                return (
                  <Button
                    key={code}
                    type="button"
                    size="sm"
                    variant={active ? "default": "outline"}
                    onClick={() => toggleUnit(code)}
                  >
                    {code} {active ? "✓": ""}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Step 2: Diff Preview Table */}
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
              <div className="space-y-3">
                {batchMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4 lg:flex-row lg:items-center"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">
                        {m.fullName} <span className="tabular-mono text-xs text-muted-foreground">({m.studentCode})</span>
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
                      {(["KEEP", "PROMOTE", "DISMISS"] as BatchDecision[]).map((dec) => (
                        <Button
                          key={dec}
                          type="button"
                          size="sm"
                          variant={m.decision === dec ? (dec === "DISMISS" ? "destructive": "default"): "outline"}
                          onClick={() => updateDecision(m.id, dec)}
                        >
                          {dec === "KEEP" ? "Giữ nguyên": dec === "PROMOTE" ? "Đổi / Thăng chức": "Thôi giữ chức"}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {warnings.length > 0 && (
                <div className="space-y-1.5 rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 text-xs text-status-warning">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Cảnh báo Bàn giao trước khi Ban hành ({warnings.length})</span>
                  </div>
                  {warnings.map((w) => (
                    <p key={w.id}>
                      <strong>{w.fullName}:</strong> {w.warning}
                    </p>
                  ))}
                </div>
              )}

              {/* Step 3: Publish Immediately or Schedule */}
              <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="eff-mode">Thời điểm hiệu lực</Label>
                    <Select
                      value={effectiveMode}
                      onValueChange={(v) => setEffectiveMode(v as "IMMEDIATE" | "SCHEDULED")}
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
                  disabled={selectedUnits.length === 0}
                  onClick={() => setPublishDialogOpen(true)}
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
                <Label htmlFor="single-mssv">MSSV Nhân sự</Label>
                <Input id="single-mssv" defaultValue="22110345" className="tabular-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="single-action">Loại thao tác</Label>
                <Select defaultValue="APPOINT">
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
              <div className="flex items-end">
                <Button className="w-full" onClick={() => setPublishDialogOpen(true)}>
                  Thực thi &amp; Ghi Audit Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        title="Ban hành Quyết định Kiện toàn Nhân sự"
        description="Hệ thống sẽ cập nhật startAt/endAt, lưu termHistory, thu hồi cache quyền cũ trong ≤ 5 giây và ghi đầy đủ vào Audit Log."
        targetSummary={`Đơn vị: ${selectedUnits.join(", ")} · Chế độ: ${
          effectiveMode === "IMMEDIATE" ? "Hiệu lực ngay": `Hẹn giờ (${effectiveDate})`
        }`}
        actionCode="IAM_RESTRUCTURING_PUBLISH"
        destructive={false}
        confirmLabel="Xác nhận Ban hành"
        onConfirm={(reason) =>
          setResultBanner(
            `Đã ban hành kiện toàn (${effectiveMode === "IMMEDIATE" ? "áp dụng ngay & thu hồi cache quyền ≤ 5s": `lên lịch ${effectiveDate}`}). Lý do Audit: ${reason}`
          )
        }
      />
    </div>
  );
}
