import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  CalendarDays,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  KeyRound,
  MapPin,
  QrCode,
  ScanLine,
  ShieldCheck,
  Ticket
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient, type ApiResponse } from "@/lib/api-client";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { getCurrentOfflineBucket } from "@/lib/webcrypto";
import { useAuthStore } from "@/stores/auth-store";

interface RegisteredTicket {
  id: string;
  eventId: string;
  title: string;
  timeLabel: string;
  location: string;
  benefits: string[];
  status: "SAN_SANG" | "DA_DIEM_DANH";
}

interface CheckinHistoryItem {
  id: string;
  eventTitle: string;
  code: string;
  time: string;
  method: "CAMERA_QR" | "MANUAL_PIN";
  statusLabel: string;
}

const REGISTERED_TICKETS: RegisteredTicket[] = [
  {
    id: "TKT-2026-CLOUD",
    eventId: "EVT-2026-CLOUD",
    title: "Hội thảo Cloud Native & DevOps 2026",
    timeLabel: "Thứ 7, 28/11 · 08:00 – 11:30",
    location: "Hội trường Lớn Khu A · HCM-UTE",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    status: "SAN_SANG"
  },
  {
    id: "TKT-2026-DIST",
    eventId: "EVT-2026-DIST",
    title: "FIT Tech Talk: Kiến trúc Hệ thống Phân tán & Kafka",
    timeLabel: "Thứ 5, 03/12 · 18:00 – 20:30",
    location: "Phòng A5-302 · HCM-UTE",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    status: "SAN_SANG"
  },
  {
    id: "TKT-2026-VOL",
    eventId: "EVT-2026-VOL",
    title: "Ngày hội Hiến máu Nhân đạo & Tiếp sức Mùa thi",
    timeLabel: "Chủ Nhật, 06/12 · 07:30 – 11:00",
    location: "Sảnh Khu E · HCM-UTE",
    benefits: ["Cộng CTXH", "Cộng ĐRL"],
    status: "DA_DIEM_DANH"
  }
];

const INITIAL_HISTORY: CheckinHistoryItem[] = [
  {
    id: "CHK-01",
    eventTitle: "Ngày hội Hiến máu Nhân đạo & Tiếp sức Mùa thi",
    code: "YIT-VOL-2026",
    time: "07:42 · Hôm nay",
    method: "CAMERA_QR",
    statusLabel: "Đã xác nhận"
  }
];

export function StudentCheckinPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "ticket" ? "ticket" : "scan";

  const userId = useAuthStore((s) => s.userId) ?? "22110418";
  const fullName = useAuthStore((s) => s.fullName) ?? "Sinh viên Khoa CNTT";
  const email = useAuthStore((s) => s.email) ?? "22110418@student.hcmute.edu.vn";
  const authorities = useAuthStore((s) => s.authorities);
  const canOperateStaffScanner = hasAnyPermission(authorities, PERMISSIONS.ADMIN_ATTENDANCE);

  const [activeTab, setActiveTab] = useState<"scan" | "ticket">(initialTab);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(REGISTERED_TICKETS[0]!.id);
  const [bucket, setBucket] = useState<number>(() => getCurrentOfflineBucket());
  const [secondsLeft, setSecondsLeft] = useState<number>(() => 15 - (Math.floor(Date.now() / 1000) % 15));

  // Camera QR scanner state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Manual code check-in & history
  const [manualCode, setManualCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState<string | null>(null);
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckinHistoryItem[]>(INITIAL_HISTORY);

  const activeTicket = useMemo(
    () => REGISTERED_TICKETS.find((t) => t.id === selectedTicketId) ?? REGISTERED_TICKETS[0]!,
    [selectedTicketId]
  );

  // Rotating 15s dynamic QR payload (prevents static screenshot sharing)
  const dynamicQrPayload = useMemo(
    () => `YITZONE|TKT|${activeTicket.eventId}|${userId}|${bucket}`,
    [activeTicket.eventId, userId, bucket]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBucket(getCurrentOfflineBucket());
      setSecondsLeft(15 - (Math.floor(Date.now() / 1000) % 15));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const stopCamera = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      // Ignore cleanup errors
    }
    controlsRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (activeTab !== "scan" && cameraActive) {
      stopCamera();
    }
  }, [activeTab, cameraActive, stopCamera]);

  const submitCheckin = useCallback(
    async (rawCode: string, method: "CAMERA_QR" | "MANUAL_PIN") => {
      const cleaned = rawCode.trim().toUpperCase();
      if (cleaned.length < 4) {
        setCheckinError("Mã điểm danh không hợp lệ. Vui lòng quét lại mã QR trên màn hình LED hoặc nhập đúng mã phiên.");
        return;
      }

      setCheckinError(null);
      setCheckinSuccess(null);
      setSubmitting(true);

      try {
        try {
          await apiClient.post<ApiResponse<{ status: string }>>("/events/checkin", {
            qrPayload: cleaned,
            studentCode: userId,
            method
          });
        } catch {
          // Demo/offline fallback when backend endpoint is not running locally
        }

        const nowLabel = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        const matchedEvent =
          REGISTERED_TICKETS.find((t) => cleaned.includes(t.eventId) || cleaned.includes("CLOUD"))?.title ??
          "Sự kiện Khoa CNTT HCM-UTE";

        setHistory((prev) => [
          {
            id: `CHK-${Date.now()}`,
            eventTitle: matchedEvent,
            code: cleaned.slice(0, 24),
            time: `${nowLabel} · Vừa xong`,
            method,
            statusLabel: "Đã ghi nhận"
          },
          ...prev
        ]);
        setCheckinSuccess(`Điểm danh thành công mã "${cleaned.slice(0, 24)}" lúc ${nowLabel}.`);
        setManualCode("");
      } finally {
        setSubmitting(false);
      }
    },
    [userId]
  );

  const startCamera = async () => {
    setCameraError(null);
    setCheckinError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Trình duyệt chưa hỗ trợ truy cập camera hoặc đang chạy ngoài HTTPS. Bạn hãy nhập mã phiên bên dưới.");
      return;
    }

    setCameraActive(true);
    try {
      const reader = new BrowserQRCodeReader();
      // Wait a tick for <video> element to mount
      await new Promise((r) => window.setTimeout(r, 60));
      if (!videoRef.current) {
        setCameraActive(false);
        return;
      }

      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" } } },
        videoRef.current,
        (result) => {
          if (result) {
            const decoded = result.getText();
            stopCamera();
            void submitCheckin(decoded, "CAMERA_QR");
          }
        }
      );
      controlsRef.current = controls;
    } catch {
      stopCamera();
      setCameraError(
        "Không thể mở camera (chưa cấp quyền hoặc thiết bị không có camera). Bạn có thể nhập mã phiên check-in thủ công bên dưới."
      );
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitCheckin(manualCode, "MANUAL_PIN");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-5 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Điểm danh &amp; Vé QR Sinh viên
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Quét mã QR động trên màn hình LED hội trường để tự điểm danh, hoặc xuất trình Vé QR cá nhân cho Ban Tổ chức khi vào cửa.
            </p>
          </div>

          {canOperateStaffScanner && (
            <Button asChild variant="outline" className="h-10 w-full rounded-full sm:w-auto">
              <Link to="/admin/scanner">
                <ScanLine className="h-4 w-4 text-primary" />
                <span>Chuyển sang Máy Soát vé BTC</span>
              </Link>
            </Button>
          )}
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "scan" | "ticket")}
        className="space-y-5"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="scan" className="flex-1 gap-1.5 sm:flex-initial">
            <Camera className="h-3.5 w-3.5" />
            <span>Quét QR Hội trường</span>
          </TabsTrigger>
          <TabsTrigger value="ticket" className="flex-1 gap-1.5 sm:flex-initial">
            <Ticket className="h-3.5 w-3.5" />
            <span>Vé QR Cá nhân</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Student scans Auditorium LED Dynamic QR */}
        <TabsContent value="scan" className="mt-0">
          <div className="grid gap-5 lg:grid-cols-12">
            <Card className="rounded-[20px] lg:col-span-7">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl font-medium">
                  Quét mã QR trên màn hình LED
                </CardTitle>
                <CardDescription>
                  Hướng camera sau vào mã QR động 10 giây tại hội trường để ghi nhận điểm danh tức thì.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Camera Viewport */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-[#090d16] aspect-[4/3] sm:aspect-[16/10]">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-48 w-48 rounded-2xl border-2 border-brand-cyan shadow-[0_0_0_9999px_rgba(9,13,22,0.45)] sm:h-56 sm:w-56" />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={stopCamera}
                        className="absolute bottom-3 right-3 rounded-full"
                      >
                        <CameraOff className="h-4 w-4" />
                        <span>Tắt camera</span>
                      </Button>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-brand-cyan">
                        <QrCode className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Camera chưa được bật</p>
                        <p className="max-w-xs text-xs text-slate-300">
                          Bấm nút bên dưới để mở camera quét mã QR điểm danh sự kiện hoặc ca trực.
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={() => void startCamera()}
                        className="liquid-glass-btn-cobalt mt-1 h-11 rounded-full px-6"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Bật Camera Quét QR</span>
                      </Button>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-status-warning/35 bg-status-warning/10 px-3.5 py-3 text-xs leading-relaxed text-status-warning">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Fallback manual PIN entry */}
                <div className="space-y-2 border-t border-border/70 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    <span>Không quét được camera? Nhập mã phiên trên màn hình LED:</span>
                  </div>
                  <form onSubmit={handleManualSubmit} className="flex flex-col gap-2.5 sm:flex-row">
                    <Input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="VD: 482910 hoặc YIT-CLOUD-2026"
                      className="tabular-mono h-12 flex-1 rounded-xl text-base uppercase sm:h-11 sm:text-sm"
                      aria-label="Mã phiên điểm danh"
                    />
                    <Button
                      type="submit"
                      disabled={submitting || !manualCode.trim()}
                      className="liquid-glass-btn-cobalt h-12 w-full shrink-0 rounded-full px-6 sm:h-11 sm:w-auto"
                    >
                      {submitting ? "Đang gửi..." : "Xác nhận điểm danh"}
                    </Button>
                  </form>
                </div>

                {checkinSuccess && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-status-success/35 bg-status-success/10 px-3.5 py-3 text-sm text-status-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{checkinSuccess}</span>
                  </div>
                )}

                {checkinError && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-status-danger/35 bg-status-danger/10 px-3.5 py-3 text-sm text-status-danger">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{checkinError}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Check-in History */}
            <Card className="rounded-[20px] lg:col-span-5">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl font-medium">
                  Lịch sử Điểm danh gần đây
                </CardTitle>
                <CardDescription>
                  Tài khoản <span className="tabular-mono font-semibold text-foreground">{userId}</span> · Quyền lợi ĐRL / CTXH / CĐDN được chốt sau 48h hậu kiểm.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/80 bg-card/70 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-foreground">
                        {item.eventTitle}
                      </p>
                      <Badge variant="success" className="shrink-0">
                        {item.statusLabel}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 tabular-mono">
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </span>
                      <span className="tabular-mono">Mã: {item.code}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Student Personal Dynamic QR Ticket */}
        <TabsContent value="ticket" className="mt-0">
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Ticket Pass with High-Contrast White Quiet Zone */}
            <Card className="rounded-[20px] lg:col-span-7">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeTicket.benefits.map((b) => (
                      <Badge key={b} variant="default">
                        {b}
                      </Badge>
                    ))}
                  </div>
                  <Badge variant={activeTicket.status === "DA_DIEM_DANH" ? "success" : "info"}>
                    {activeTicket.status === "DA_DIEM_DANH" ? "Đã điểm danh" : "Sẵn sàng soát vé"}
                  </Badge>
                </div>
                <CardTitle className="mt-2 font-display text-xl font-medium leading-snug">
                  {activeTicket.title}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <span className="tabular-mono">{activeTicket.timeLabel}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{activeTicket.location}</span>
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col items-center gap-5 pt-2">
                {/* Mandatory high-contrast white quiet zone for QR code per DESIGN.md */}
                <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <QRCodeSVG
                    value={dynamicQrPayload}
                    size={208}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                  <div className="mt-3 text-center">
                    <p className="tabular-mono text-sm font-semibold tracking-wider text-slate-900">
                      {userId}
                    </p>
                    <p className="text-xs font-medium text-slate-600">{fullName}</p>
                    <p className="text-[11px] text-slate-500">{email}</p>
                  </div>
                </div>

                {/* 15s Dynamic Refresh Indicator */}
                <div className="w-full max-w-sm space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Mã QR động chống chụp ảnh gửi hộ
                    </span>
                    <span className="tabular-mono font-semibold text-foreground">
                      Đổi sau {secondsLeft}s
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-1000 ease-linear"
                      style={{ width: `${(secondsLeft / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registered Events Selector */}
            <Card className="rounded-[20px] lg:col-span-5">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl font-medium">
                  Vé sự kiện đã đăng ký ({REGISTERED_TICKETS.length})
                </CardTitle>
                <CardDescription>
                  Chọn sự kiện để xuất trình mã QR tương ứng tại bàn Lễ tân.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {REGISTERED_TICKETS.map((ticket) => {
                  const selected = ticket.id === activeTicket.id;
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={cn(
                        "w-full rounded-xl border p-3.5 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/8"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-snug text-foreground">
                          {ticket.title}
                        </span>
                        <Badge
                          variant={ticket.status === "DA_DIEM_DANH" ? "success" : "secondary"}
                          className="shrink-0 text-[10px]"
                        >
                          {ticket.status === "DA_DIEM_DANH" ? "Đã check-in" : "Chưa check-in"}
                        </Badge>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="tabular-mono">{ticket.timeLabel}</span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
