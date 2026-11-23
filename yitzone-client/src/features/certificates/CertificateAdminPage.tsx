import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
  ShieldX
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractApiErrorMessage } from "@/lib/api-client";
import { useEventStore } from "@/stores/event-store";
import { CertTemplatesTab } from "./CertTemplatesTab";
import { reissueCertificate, revokeCertificate } from "./api";

const MAJOR_OPTIONS = [
  { code: "110", name: "Công nghệ Thông tin (FIT)" },
  { code: "133", name: "Kỹ thuật Dữ liệu (FIT)" },
  { code: "162", name: "An toàn Thông tin (FIT)" },
  { code: "146", name: "Cơ điện tử (Khoa Cơ khí)" }
] as const;

interface FinalizeEventOption {
  id: string;
  title: string;
  eligibleAttendees: number;
  eligibleBtc: number;
  pendingReviewCount: number;
}

export function CertificateAdminPage() {
  const storedEvents = useEventStore((s) => s.events);

  const eventOptions = useMemo<FinalizeEventOption[]>(() => {
    if (storedEvents.length === 0) {
      return [
        {
          id: "evt-cloud-2026",
          title: "Hội thảo Cloud Native & DevOps 2026",
          eligibleAttendees: 176,
          eligibleBtc: 18,
          pendingReviewCount: 0
        }
      ];
    }
    return storedEvents.map((evt, idx) => ({
      id: evt.id,
      title: evt.title,
      eligibleAttendees: Math.max(12, Math.round(evt.registeredCount * 0.85)),
      eligibleBtc: Math.max(6, evt.btcRoles.length * 3),
      pendingReviewCount: idx === 1 ? 2 : 0
    }));
  }, [storedEvents]);

  const [selectedEventId, setSelectedEventId] = useState<string>(() => eventOptions[0]!.id);
  const [finalizedIds, setFinalizedIds] = useState<Record<string, boolean>>({});
  const [cddnMajors, setCddnMajors] = useState<string[]>(["110", "133", "162"]);
  const [transferMssv, setTransferMssv] = useState("22146091");
  const [transferDate, setTransferDate] = useState("2026-09-01");
  const [revokeCode, setRevokeCode] = useState("YIT-2026-CLD-0184");
  const [auditModal, setAuditModal] = useState<{
    title: string;
    summary: string;
    code: string;
    destructive?: boolean;
    onDone: (reason: string) => void | Promise<void>;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Intent-scoped Idempotency-Key for revoke/reissue retries
  const actionIdempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const activeEvent =
    eventOptions.find((e) => e.id === selectedEventId) ?? eventOptions[0]!;
  const totalCerts = activeEvent.eligibleAttendees + activeEvent.eligibleBtc;
  const isEventFinalized = Boolean(finalizedIds[activeEvent.id]);
  const hasPendingReviews = activeEvent.pendingReviewCount > 0;

  const toggleMajor = (code: string) => {
    setCddnMajors((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const openTransferAudit = () => {
    setErrorMsg(null);
    const cleaned = transferMssv.trim();
    if (!/^[0-9]{8}$/.test(cleaned)) {
      setErrorMsg("MSSV sinh viên chuyển ngành phải gồm đúng 8 chữ số.");
      return;
    }
    if (!transferDate) {
      setErrorMsg("Vui lòng chọn ngày hiệu lực quyết định chuyển ngành.");
      return;
    }
    setAuditModal({
      title: "Cấp Đặc cách Sinh viên Chuyển ngành CĐDN (BTV)",
      summary: `MSSV ${cleaned} · Hiệu lực từ ${transferDate}`,
      code: "CERT_TRANSFER_MAJOR_OVERRIDE",
      destructive: false,
      onDone: () => {
        setNotice(
          `Đã bật xác nhận "Sinh viên thuộc Khoa CNTT" cho ${cleaned}, cộng bù CĐDN từ ${transferDate} và phát hành E-Cert phiên bản mới.`
        );
      }
    });
  };

  const openRevokeAudit = () => {
    setErrorMsg(null);
    const cleaned = revokeCode.trim();
    if (!cleaned) {
      setErrorMsg("Vui lòng nhập mã E-Certificate cần thu hồi.");
      return;
    }
    actionIdempotencyKeyRef.current = crypto.randomUUID();
    setAuditModal({
      title: "Thu hồi E-Certificate Vĩnh viễn",
      summary: `Mã chứng nhận: ${cleaned}`,
      code: "CERT_REVOKE",
      destructive: true,
      onDone: async (reason) => {
        setErrorMsg(null);
        setNotice(null);
        try {
          const res = await revokeCertificate(cleaned, reason, actionIdempotencyKeyRef.current);
          setNotice(
            `Đã thu hồi E-Certificate ${res.certificateId} (${res.certStatus}) · Mã khóa chống trùng: ${res.idempotencyKey.slice(0, 8)}…`
          );
          actionIdempotencyKeyRef.current = crypto.randomUUID();
        } catch (err) {
          setErrorMsg(
            extractApiErrorMessage(
              err,
              `Không thể thu hồi chứng nhận ${cleaned}. Trạng thái trên máy chủ CHƯA thay đổi — vui lòng thử lại.`
            )
          );
        }
      }
    });
  };

  const openReissueAudit = () => {
    setErrorMsg(null);
    const cleaned = revokeCode.trim();
    if (!cleaned) {
      setErrorMsg("Vui lòng nhập mã E-Certificate cần cấp lại.");
      return;
    }
    actionIdempotencyKeyRef.current = crypto.randomUUID();
    setAuditModal({
      title: "Cấp lại Phiên bản E-Certificate Mới (Tăng v2)",
      summary: `Mã chứng nhận: ${cleaned}`,
      code: "CERT_REISSUE_NEW_VERSION",
      destructive: false,
      onDone: async (reason) => {
        setErrorMsg(null);
        setNotice(null);
        try {
          const res = await reissueCertificate(cleaned, reason, actionIdempotencyKeyRef.current);
          setNotice(
            `Đã phát hành phiên bản mới v${res.newCertVersion} cho ${res.previousCertificateId} (bản cũ: ${res.previousStatus}).`
          );
          actionIdempotencyKeyRef.current = crypto.randomUUID();
        } catch (err) {
          setErrorMsg(
            extractApiErrorMessage(
              err,
              `Không thể cấp lại chứng nhận ${cleaned}. Phiên bản mới CHƯA được phát hành — vui lòng thử lại.`
            )
          );
        }
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-medium text-foreground">
            Chốt Kết quả, Cấp / Thu hồi E-Certificate &amp; Đặc cách CĐDN
          </h1>
          <p className="text-sm text-muted-foreground">
            Chọn danh sách ngành cộng CĐDN linh hoạt theo sự kiện, xuất Excel đối soát CTSV, xử lý đặc cách chuyển ngành và thu hồi phiên bản.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={() =>
            setNotice(
              `Đã xuất tệp Excel đối soát mẫu Phòng CTSV / Đào tạo cho "${activeEvent.title}" (gồm cột loại quyền lợi, không liệt kê số điểm).`
            )
          }
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Xuất Excel Đối soát CTSV</span>
        </Button>
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setNotice(null)}
            className="h-7 px-2.5 text-xs text-status-success hover:bg-status-success/15 hover:text-status-success"
          >
            Đóng
          </Button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-sm text-status-danger"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setErrorMsg(null)}
            className="h-7 px-2.5 text-xs text-status-danger hover:bg-status-danger/15 hover:text-status-danger"
          >
            Đóng
          </Button>
        </div>
      )}

      <Tabs defaultValue="finalize" className="min-h-[420px] w-full">
        <TabsList className="justify-start">
          <TabsTrigger value="finalize">Chốt Kết quả &amp; Ngành CĐDN</TabsTrigger>
          <TabsTrigger value="transfer">Đặc cách Chuyển ngành (BTV)</TabsTrigger>
          <TabsTrigger value="revoke">Thu hồi &amp; Cấp lại v2 (BTV)</TabsTrigger>
          <TabsTrigger value="templates">Kho Mẫu Phôi E-Cert</TabsTrigger>
        </TabsList>

        <TabsContent value="finalize" className="mt-4">
          <Card>
            <CardHeader className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 shrink-0 text-primary" />
                  <CardTitle className="text-lg">Chốt Kết quả Sự kiện &amp; Phát hành E-Cert</CardTitle>
                </div>
                <div className="w-full sm:w-80">
                  <Select value={activeEvent.id} onValueChange={setSelectedEventId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                Mặc định chọn sẵn 3 ngành Khoa CNTT (
                <span className="tabular-mono font-medium text-foreground">110, 133, 162</span>). Sinh viên ngành ngoài danh sách sẽ được ghi chú không tích lũy chuẩn CĐDN.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Chọn các ngành được ghi nhận quyền lợi CĐDN cho sự kiện này</Label>
                <div className="flex flex-wrap gap-2">
                  {MAJOR_OPTIONS.map((m) => {
                    const active = cddnMajors.includes(m.code);
                    return (
                      <Button
                        key={m.code}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        disabled={isEventFinalized}
                        className="rounded-full"
                        onClick={() => toggleMajor(m.code)}
                      >
                        <span className="tabular-mono">{m.code}</span>
                        <span>{m.name}</span>
                        {active && <Check className="h-3.5 w-3.5" />}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 text-xs sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <div className="text-muted-foreground">Tham dự viên đủ K/N buổi + Khảo sát</div>
                  <div className="tabular-mono mt-1 text-lg font-semibold text-foreground">
                    {activeEvent.eligibleAttendees} SV
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <div className="text-muted-foreground">Thành viên BTC đủ điểm danh (Miễn bài thu hoạch)</div>
                  <div className="tabular-mono mt-1 text-lg font-semibold text-foreground">
                    {activeEvent.eligibleBtc} BTC
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                  <div className="text-muted-foreground">Hàng chờ hậu kiểm 48h còn tồn</div>
                  <div
                    className={
                      hasPendingReviews
                        ? "tabular-mono mt-1 text-lg font-semibold text-status-warning"
                        : "tabular-mono mt-1 text-lg font-semibold text-status-success"
                    }
                  >
                    {activeEvent.pendingReviewCount} ca
                  </div>
                </div>
              </div>

              {hasPendingReviews && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl border border-status-warning/35 bg-status-warning/10 px-3.5 py-2.5 text-xs text-status-warning"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Còn <strong className="tabular-mono">{activeEvent.pendingReviewCount}</strong> ca trong hàng chờ hậu kiểm 48h. Cần xử lý hết tại phân hệ Điểm danh trước khi chốt phát hành E-Certificate.
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  disabled={isEventFinalized || hasPendingReviews || cddnMajors.length === 0}
                  onClick={() =>
                    setAuditModal({
                      title: "Chốt Kết quả & Phát hành E-Certificate",
                      summary: `${activeEvent.title} · ${totalCerts} chứng nhận · CĐDN: ${cddnMajors.join(", ")}`,
                      code: "CERT_BATCH_FINALIZE",
                      destructive: false,
                      onDone: () => {
                        setFinalizedIds((prev) => ({ ...prev, [activeEvent.id]: true }));
                        setNotice(
                          `Đã chốt kết quả "${activeEvent.title}", ghi nhận CĐDN cho mã ngành ${cddnMajors.join(", ")} và phát hành ${totalCerts} E-Certificate kèm mã QR xác thực.`
                        );
                      }
                    })
                  }
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    {isEventFinalized
                      ? `Đã chốt & phát hành ${totalCerts} E-Certificate`
                      : `Chốt Kết quả & Phát hành ${totalCerts} E-Certificate`}
                  </span>
                </Button>
                {isEventFinalized && <Badge variant="success">Đã chốt phát hành</Badge>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Xác nhận Sinh viên Chuyển ngành / Đặc cách CĐDN (Duy nhất BTV)</CardTitle>
              <CardDescription>
                Dành cho sinh viên chuyển vào Khoa CNTT nhưng giữ MSSV mã ngành cũ. Hệ thống tự động rà soát hội thảo CĐDN từ ngày hiệu lực và phát hành bản E-Cert v2.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="tr-mssv">MSSV sinh viên chuyển ngành</Label>
                <Input
                  id="tr-mssv"
                  inputMode="numeric"
                  maxLength={8}
                  value={transferMssv}
                  onChange={(e) => setTransferMssv(e.target.value)}
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tr-date">Ngày hiệu lực quyết định chuyển ngành</Label>
                <Input
                  id="tr-date"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" className="w-full" onClick={openTransferAudit}>
                  Bật đặc cách &amp; Cộng bù CĐDN
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revoke" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Thu hồi hoặc Cấp lại Phiên bản E-Certificate Mới</CardTitle>
              <CardDescription>
                Trang QR công khai lập tức chuyển sang &ldquo;Đã thu hồi&rdquo; hoặc &ldquo;Đã thay thế bởi bản mới&rdquo; và ghi đầy đủ vào Audit Log.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm space-y-1.5">
                <Label htmlFor="rev-code">Mã E-Certificate</Label>
                <Input
                  id="rev-code"
                  value={revokeCode}
                  onChange={(e) => setRevokeCode(e.target.value)}
                  className="tabular-mono"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="destructive" onClick={openRevokeAudit}>
                  <ShieldX className="h-4 w-4" />
                  <span>Thu hồi Chứng nhận</span>
                </Button>

                <Button type="button" variant="outline" onClick={openReissueAudit}>
                  <RefreshCw className="h-4 w-4" />
                  <span>Cấp lại Phiên bản Mới (v2)</span>
                </Button>
              </div>

              <Badge variant="secondary">
                Mọi thao tác thu hồi / cấp lại chỉ dành cho Ban Thường vụ (BTV)
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <CertTemplatesTab onNotify={setNotice} />
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(auditModal)}
        onOpenChange={(open) => {
          if (!open) setAuditModal(null);
        }}
        title={auditModal?.title ?? ""}
        description="Quyết định liên quan đến quyền lợi CĐDN và hiệu lực E-Certificate được lưu bất biến vào Audit Log."
        targetSummary={auditModal?.summary ?? ""}
        actionCode={auditModal?.code ?? "CERT_AUDIT"}
        destructive={auditModal?.destructive ?? false}
        onConfirm={(reason) => {
          const done = auditModal?.onDone;
          setAuditModal(null);
          return done?.(reason);
        }}
      />
    </div>
  );
}
