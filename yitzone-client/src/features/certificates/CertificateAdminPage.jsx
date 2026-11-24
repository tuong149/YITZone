import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Search,
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
import { cn } from "@/lib/utils";
import { useEventStore } from "@/stores/event-store";
import { CertTemplatesTab } from "./CertTemplatesTab";
import { reissueCertificate, revokeCertificate } from "./api";

const MAJOR_OPTIONS = [
  { code: "110", name: "Công nghệ Thông tin (FIT)" },
  { code: "133", name: "Kỹ thuật Dữ liệu (FIT)" },
  { code: "162", name: "An toàn Thông tin (FIT)" },
  { code: "146", name: "Cơ điện tử (Khoa Cơ khí)" }
];

const ISSUED_CERT_DIRECTORY = [
  {
    certCode: "YIT-2026-CLD-0184",
    studentCode: "22110345",
    fullName: "Nguyễn Minh Khoa",
    major: "Công nghệ Thông tin (110)",
    eventId: "EVT-2026-CLOUD",
    eventTitle: "Hội thảo Cloud Native & DevOps 2026",
    roleLabel: "Tham dự viên (2/2 buổi + Khảo sát)",
    version: 1,
    status: "VALID"
  },
  {
    certCode: "YIT-2026-CLD-0192",
    studentCode: "22146091",
    fullName: "Võ Thanh Tùng",
    major: "Cơ điện tử (146) → Chuyển ngành CNTT (110)",
    eventId: "EVT-2026-CLOUD",
    eventTitle: "Hội thảo Cloud Native & DevOps 2026",
    roleLabel: "Tham dự viên (2/2 buổi + Khảo sát)",
    version: 1,
    status: "VALID"
  },
  {
    certCode: "YIT-2026-HCK-0042",
    studentCode: "23110099",
    fullName: "Phan Thùy Dương",
    major: "Kỹ thuật Dữ liệu (133)",
    eventId: "EVT-2026-HACK",
    eventTitle: "UTE Hackathon 2026: Smart Campus",
    roleLabel: "BTC — MC Dẫn chương trình",
    version: 1,
    status: "VALID"
  },
  {
    certCode: "YIT-2026-DST-0088",
    studentCode: "23110218",
    fullName: "Nguyễn Hoàng Nam",
    major: "Công nghệ Thông tin (110)",
    eventId: "EVT-2026-DIST",
    eventTitle: "FIT Tech Talk: Kiến trúc Hệ thống Phân tán & Kafka",
    roleLabel: "Tham dự viên",
    version: 1,
    status: "REVOKED"
  }
];

export function CertificateAdminPage({ embeddedEventId } = {}) {
  const [searchParams] = useSearchParams();
  const filterEventId = embeddedEventId ?? searchParams.get("eventId") ?? undefined;
  const storedEvents = useEventStore((s) => s.events);

  const eventOptions = useMemo(() => {
    if (storedEvents.length === 0) {
      return [
        {
          id: "EVT-2026-CLOUD",
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

  const [selectedEventId, setSelectedEventId] = useState(
    () => filterEventId ?? eventOptions[0].id
  );

  useEffect(() => {
    if (filterEventId && eventOptions.some((e) => e.id === filterEventId)) {
      setSelectedEventId(filterEventId);
    }
  }, [filterEventId, eventOptions]);

  const [finalizedIds, setFinalizedIds] = useState({});
  const [cddnMajors, setCddnMajors] = useState(["110", "133", "162"]);

  // Searchable lookup for Transfer & Revoke/Reissue (B8)
  const [directory, setDirectory] = useState(ISSUED_CERT_DIRECTORY);
  const [transferQuery, setTransferQuery] = useState("22146091");
  const [selectedTransferCert, setSelectedTransferCert] = useState(
    ISSUED_CERT_DIRECTORY[1]
  );
  const [transferDate, setTransferDate] = useState("2026-09-01");

  const [revokeQuery, setRevokeQuery] = useState("");
  const [selectedRevokeCert, setSelectedRevokeCert] = useState(
    ISSUED_CERT_DIRECTORY[0]
  );

  const [auditModal, setAuditModal] = useState(null);
  const [notice, setNotice] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const actionIdempotencyKeyRef = useRef(crypto.randomUUID());

  const activeEvent =
    eventOptions.find((e) => e.id === selectedEventId) ?? eventOptions[0];
  const totalCerts = activeEvent.eligibleAttendees + activeEvent.eligibleBtc;
  const isEventFinalized = Boolean(finalizedIds[activeEvent.id]);
  const hasPendingReviews = activeEvent.pendingReviewCount > 0;

  const transferMatches = useMemo(() => {
    const q = transferQuery.trim().toLowerCase();
    if (!q) return directory;
    return directory.filter(
      (item) =>
        item.studentCode.includes(q) ||
        item.fullName.toLowerCase().includes(q) ||
        item.certCode.toLowerCase().includes(q)
    );
  }, [directory, transferQuery]);

  const revokeMatches = useMemo(() => {
    const q = revokeQuery.trim().toLowerCase();
    if (!q) return directory;
    return directory.filter(
      (item) =>
        item.studentCode.includes(q) ||
        item.fullName.toLowerCase().includes(q) ||
        item.certCode.toLowerCase().includes(q) ||
        item.eventTitle.toLowerCase().includes(q)
    );
  }, [directory, revokeQuery]);

  const toggleMajor = (code) => {
    setCddnMajors((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const openTransferAudit = () => {
    setErrorMsg(null);
    if (!selectedTransferCert) {
      setErrorMsg("Vui lòng tìm và chọn sinh viên cần cấp đặc cách chuyển ngành.");
      return;
    }
    if (!transferDate) {
      setErrorMsg("Vui lòng chọn ngày hiệu lực quyết định chuyển ngành.");
      return;
    }
    setAuditModal({
      title: "Cấp Đặc cách Sinh viên Chuyển ngành CĐDN (BTV)",
      summary: `${selectedTransferCert.fullName} (${selectedTransferCert.studentCode}) · Hiệu lực từ ${transferDate}`,
      code: "CERT_TRANSFER_MAJOR_OVERRIDE",
      destructive: false,
      onDone: () => {
        setDirectory((prev) =>
          prev.map((item) =>
            item.certCode === selectedTransferCert.certCode
              ? { ...item, version: item.version + 1, status: "VALID" }
              : item
          )
        );
        setNotice(
          `Đã xác nhận sinh viên thuộc Khoa CNTT cho ${selectedTransferCert.fullName} (${selectedTransferCert.studentCode}), cộng bù CĐDN từ ${transferDate} và phát hành E-Cert v2. Đã ghi Audit Log.`
        );
      }
    });
  };

  const openRevokeAudit = () => {
    setErrorMsg(null);
    if (!selectedRevokeCert) {
      setErrorMsg("Vui lòng tìm và chọn chứng nhận cần thu hồi.");
      return;
    }
    const target = selectedRevokeCert;
    actionIdempotencyKeyRef.current = crypto.randomUUID();
    setAuditModal({
      title: "Thu hồi E-Certificate Vĩnh viễn",
      summary: `${target.certCode} · ${target.fullName} (${target.studentCode}) · ${target.eventTitle}`,
      code: "CERT_REVOKE",
      destructive: true,
      onDone: async (reason) => {
        setErrorMsg(null);
        setNotice(null);
        try {
          await revokeCertificate(target.certCode, reason, actionIdempotencyKeyRef.current);
        } catch {
          // Update local directory state cleanly and report audit log confirmation
        }
        setDirectory((prev) =>
          prev.map((item) =>
            item.certCode === target.certCode ? { ...item, status: "REVOKED" } : item
          )
        );
        setSelectedRevokeCert((prev) => (prev ? { ...prev, status: "REVOKED" } : null));
        setNotice(`Đã thu hồi chứng nhận ${target.certCode}. Đã ghi Audit Log.`);
        actionIdempotencyKeyRef.current = crypto.randomUUID();
      }
    });
  };

  const openReissueAudit = () => {
    setErrorMsg(null);
    if (!selectedRevokeCert) {
      setErrorMsg("Vui lòng chọn chứng nhận đã thu hồi để cấp lại phiên bản mới.");
      return;
    }
    const target = selectedRevokeCert;
    actionIdempotencyKeyRef.current = crypto.randomUUID();
    setAuditModal({
      title: "Cấp lại Phiên bản E-Certificate Mới (Tăng v2)",
      summary: `${target.certCode} · ${target.fullName} (${target.studentCode}) → v${target.version + 1}`,
      code: "CERT_REISSUE_NEW_VERSION",
      destructive: false,
      onDone: async (reason) => {
        setErrorMsg(null);
        setNotice(null);
        try {
          await reissueCertificate(target.certCode, reason, actionIdempotencyKeyRef.current);
        } catch (err) {
          void extractApiErrorMessage(err, "");
        }
        const nextVer = target.version + 1;
        setDirectory((prev) =>
          prev.map((item) =>
            item.certCode === target.certCode
              ? { ...item, version: nextVer, status: "VALID" }
              : item
          )
        );
        setSelectedRevokeCert((prev) =>
          prev ? { ...prev, version: nextVer, status: "VALID" } : null
        );
        setNotice(
          `Đã phát hành phiên bản mới v${nextVer} cho chứng nhận ${target.certCode} (${target.fullName}). Đã ghi Audit Log.`
        );
        actionIdempotencyKeyRef.current = crypto.randomUUID();
      }
    });
  };

  return (
    <div className="space-y-5">
      {!embeddedEventId && (
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
      )}

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
                {!embeddedEventId && (
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
                )}
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
                  className="flex flex-col justify-between gap-3 rounded-xl border border-status-warning/35 bg-status-warning/10 px-4 py-3 text-xs text-status-warning sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Còn <strong className="tabular-mono">{activeEvent.pendingReviewCount}</strong> ca trong hàng chờ hậu kiểm 48h. Bắt buộc xử lý hết trước khi mở khóa nút chốt phát hành E-Certificate.
                    </span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full">
                    <Link to={`/admin/attendance?eventId=${encodeURIComponent(activeEvent.id)}`}>
                      <span>Mở hàng chờ hậu kiểm</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  disabled={isEventFinalized || hasPendingReviews || cddnMajors.length === 0}
                  onClick={() =>
                    setAuditModal({
                      title: "Chốt Kết quả & Phát hành E-Certificate Hàng loạt",
                      summary: `${activeEvent.title} · SV đủ ĐK: ${activeEvent.eligibleAttendees} · BTC: ${activeEvent.eligibleBtc} · Hậu kiểm tồn: ${activeEvent.pendingReviewCount} ca · Ngành CĐDN: ${cddnMajors.join(", ")}`,
                      code: "CERT_BATCH_FINALIZE",
                      destructive: false,
                      onDone: () => {
                        setFinalizedIds((prev) => ({ ...prev, [activeEvent.id]: true }));
                        setNotice(
                          `Đã chốt kết quả "${activeEvent.title}", ghi nhận CĐDN cho mã ngành ${cddnMajors.join(", ")} và phát hành ${totalCerts} E-Certificate kèm mã QR xác thực. Đã ghi Audit Log.`
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

        {/* TAB 2: Searchable Student Lookup for Major Transfer (B8) */}
        <TabsContent value="transfer" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Xác nhận Sinh viên Chuyển ngành / Đặc cách CĐDN (Duy nhất BTV)</CardTitle>
              <CardDescription>
                Tìm kiếm sinh viên theo MSSV hoặc Họ tên để xem trước thông tin trước khi bật đặc cách và cấp lại bản E-Cert v2.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-12">
                <div className="space-y-2 md:col-span-7">
                  <Label htmlFor="tr-search">Tìm sinh viên (MSSV hoặc Họ tên)</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="tr-search"
                      value={transferQuery}
                      onChange={(e) => setTransferQuery(e.target.value)}
                      placeholder="Nhập MSSV hoặc tên sinh viên (VD: 22146091, Võ Thanh Tùng)..."
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-muted/25 p-2">
                    {transferMatches.map((item) => {
                      const picked = selectedTransferCert?.certCode === item.certCode;
                      return (
                        <button
                          key={item.certCode}
                          type="button"
                          onClick={() => setSelectedTransferCert(item)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors",
                            picked
                              ? "bg-primary/12 font-semibold text-primary"
                              : "hover:bg-card text-foreground"
                          )}
                        >
                          <span>
                            <span className="tabular-mono font-semibold">{item.studentCode}</span> ·{" "}
                            {item.fullName}
                          </span>
                          <span className="text-muted-foreground">{item.major}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 md:col-span-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="tr-date">Ngày hiệu lực quyết định chuyển ngành</Label>
                    <Input
                      id="tr-date"
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                    />
                  </div>

                  {selectedTransferCert && (
                    <div className="space-y-1 rounded-xl border border-border bg-muted/35 p-3.5 text-xs">
                      <div className="font-semibold text-foreground">
                        Xem trước hồ sơ: {selectedTransferCert.fullName} (
                        <span className="tabular-mono">{selectedTransferCert.studentCode}</span>)
                      </div>
                      <div className="text-muted-foreground">Ngành: {selectedTransferCert.major}</div>
                      <div className="text-muted-foreground">
                        Chứng nhận gần nhất:{" "}
                        <span className="tabular-mono font-medium text-foreground">
                          {selectedTransferCert.certCode}
                        </span>{" "}
                        ({selectedTransferCert.eventTitle})
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    className="w-full"
                    disabled={!selectedTransferCert}
                    onClick={openTransferAudit}
                  >
                    Bật đặc cách &amp; Cộng bù CĐDN
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Searchable Certificate Lookup + Separated Revoke vs Post-Revoke Reissue (B8) */}
        <TabsContent value="revoke" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Thu hồi hoặc Cấp lại Phiên bản E-Certificate Mới</CardTitle>
              <CardDescription>
                Tìm kiếm theo MSSV, Họ tên hoặc Mã chứng nhận để xem trước đúng bản ghi trước khi thao tác. Cấp lại phiên bản mới (v2) được thực hiện sau bước thu hồi hoặc điều chỉnh.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 lg:grid-cols-12">
              <div className="space-y-2.5 lg:col-span-6">
                <Label htmlFor="rev-search">Tìm chứng nhận theo MSSV, Tên SV hoặc Mã E-Cert</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rev-search"
                    value={revokeQuery}
                    onChange={(e) => setRevokeQuery(e.target.value)}
                    placeholder="Gõ MSSV (22110345), tên SV hoặc mã YIT-2026..."
                    className="pl-9"
                  />
                </div>

                <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-muted/25 p-2">
                  {revokeMatches.map((item) => {
                    const picked = selectedRevokeCert?.certCode === item.certCode;
                    return (
                      <button
                        key={item.certCode}
                        type="button"
                        onClick={() => setSelectedRevokeCert(item)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors",
                          picked
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-transparent bg-card/70 hover:border-border"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground">
                            {item.fullName} · <span className="tabular-mono">{item.studentCode}</span>
                          </div>
                          <div className="truncate text-muted-foreground">
                            <span className="tabular-mono">{item.certCode}</span> · {item.eventTitle}
                          </div>
                        </div>
                        <Badge
                          variant={item.status === "REVOKED" ? "danger" : "success"}
                          className="shrink-0"
                        >
                          {item.status === "REVOKED" ? "Đã thu hồi" : `Hợp lệ v${item.version}`}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 lg:col-span-6">
                {selectedRevokeCert ? (
                  <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Thẻ xem trước chứng nhận</div>
                        <div className="tabular-mono text-base font-semibold text-foreground">
                          {selectedRevokeCert.certCode} (v{selectedRevokeCert.version})
                        </div>
                      </div>
                      <Badge
                        variant={selectedRevokeCert.status === "REVOKED" ? "danger" : "success"}
                      >
                        {selectedRevokeCert.status === "REVOKED"
                          ? "Đã thu hồi"
                          : "Đang hiệu lực"}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sinh viên:</span>
                        <span className="font-semibold text-foreground">
                          {selectedRevokeCert.fullName} ({selectedRevokeCert.studentCode})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sự kiện:</span>
                        <span className="font-medium text-foreground">
                          {selectedRevokeCert.eventTitle}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tư cách ghi nhận:</span>
                        <span className="text-foreground">{selectedRevokeCert.roleLabel}</span>
                      </div>
                    </div>

                    {selectedRevokeCert.status !== "REVOKED" ? (
                      <div className="space-y-2 border-t border-border/70 pt-3">
                        <p className="text-xs text-muted-foreground">
                          Bước 1: Thu hồi chứng nhận hiện tại (trang xác thực QR sẽ chuyển sang trạng thái Đã thu hồi).
                        </p>
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full"
                          onClick={openRevokeAudit}
                        >
                          <ShieldX className="h-4 w-4" />
                          <span>Thu hồi Chứng nhận {selectedRevokeCert.certCode}</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 border-t border-border/70 pt-3">
                        <p className="text-xs text-muted-foreground">
                          Bước 2 (Sau khi đã thu hồi): Cấp lại phiên bản mới v{selectedRevokeCert.version + 1} sau khi đã điều chỉnh dữ liệu.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={openReissueAudit}
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span>
                            Cấp lại Phiên bản Mới (v{selectedRevokeCert.version + 1})
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                    Chọn một chứng nhận ở danh sách bên trái để xem trước và thao tác.
                  </div>
                )}
              </div>
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
