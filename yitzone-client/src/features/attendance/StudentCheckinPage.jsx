import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BrowserQRCodeReader } from "@zxing/browser";
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
import { apiClient, extractApiErrorMessage, resolveApiPath } from "@/lib/api-client";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { resolveYitZoneQrPayload } from "@/lib/qr-dispatcher";
import { cn } from "@/lib/utils";
import { createCanonicalDevicePop, getCurrentOfflineBucket } from "@/lib/webcrypto";
import { useAuthStore } from "@/stores/auth-store";
import { useEventStore } from "@/stores/event-store";
import { pushAppToast } from "@/stores/toast-store";

export function StudentCheckinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "ticket" ? "ticket" : "scan";
  const queryEventId = searchParams.get("eventId");

  const userId = useAuthStore((s) => s.userId) ?? "";
  const fullName = useAuthStore((s) => s.fullName) ?? "Sinh viên Khoa CNTT";
  const email = useAuthStore((s) => s.email) ?? "";
  const authorities = useAuthStore((s) => s.authorities);
  const canOperateStaffScanner = hasAnyPermission(authorities, PERMISSIONS.ADMIN_ATTENDANCE);
  const storedEvents = useEventStore((s) => s.events);
  const storedRegistrations = useEventStore((s) => s.registrations);

  const registeredTickets = useMemo(() => {
    const fromStore = [];
    for (const [evId, reg] of Object.entries(storedRegistrations)) {
      if (!reg) continue;
      const ev = storedEvents.find((e) => e.id === evId);
      if (!ev) continue;
      fromStore.push({
        id: `TKT-${ev.id}`,
        eventId: ev.id,
        title: ev.title,
        timeLabel: ev.dateSummary,
        location: ev.location,
        benefits: ev.benefits,
        status: "SAN_SANG"
      });
    }
    return fromStore;
  }, [storedEvents, storedRegistrations]);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedTicketId, setSelectedTicketId] = useState(() => {
    if (queryEventId) return `TKT-${queryEventId}`;
    return "";
  });
  const [bucket, setBucket] = useState(() => getCurrentOfflineBucket());
  const [secondsLeft, setSecondsLeft] = useState(() => 15 - (Math.floor(Date.now() / 1000) % 15));

  // Camera QR scanner state
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Manual code check-in & history
  const [manualCode, setManualCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(null);
  const [checkinError, setCheckinError] = useState(null);
  const [history, setHistory] = useState([]);

  const activeTicket = useMemo(
    () =>
      registeredTickets.find((t) => t.id === selectedTicketId || t.eventId === queryEventId) ??
      registeredTickets[0] ??
      null,
    [registeredTickets, selectedTicketId, queryEventId]
  );

  // Rotating 15s dynamic QR payload (prevents static screenshot sharing)
  const dynamicQrPayload = useMemo(
    () => (activeTicket && userId ? `YITZONE|TKT|${activeTicket.eventId}|${userId}|${bucket}` : ""),
    [activeTicket, userId, bucket]
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

  const readCurrentGps = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return { lat: null, lng: null, accuracy: null, gpsAvailable: false };
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            gpsAvailable: true
          }),
        () => resolve({ lat: null, lng: null, accuracy: null, gpsAvailable: false }),
        { enableHighAccuracy: true, timeout: 4000, maximumAge: 30_000 }
      );
    });
  }, []);

  const submitCheckin = useCallback(
    async (rawCode, method) => {
      const cleaned = rawCode.trim().toUpperCase();
      if (cleaned.length < 4) {
        setCheckinError("Mã điểm danh không hợp lệ. Vui lòng quét lại mã QR trên màn hình LED hoặc nhập đúng mã phiên.");
        return;
      }

      setCheckinError(null);
      setCheckinSuccess(null);
      setSubmitting(true);

      try {
        const matchedTicket = registeredTickets.find(
          (t) => cleaned.includes(t.eventId) || cleaned.includes("CLOUD")
        );
        const eventId = matchedTicket?.eventId ?? activeTicket?.eventId ?? "GENERAL";
        const sessionId = cleaned.split("|")[2] ?? "SESSION-1";
        const relativePath = "/attendance/check-in";

        const [gps, devicePop] = await Promise.all([
          readCurrentGps(),
          createCanonicalDevicePop({
            method: "POST",
            path: resolveApiPath(relativePath),
            userId,
            canonicalActionFields: `${eventId}|${sessionId}|${cleaned}`
          })
        ]);

        const res = await apiClient.post(
          relativePath,
          {
            eventId,
            sessionId,
            signedQrPayload: cleaned,
            devicePop,
            lat: gps.lat,
            lng: gps.lng,
            accuracy: gps.accuracy,
            gpsAvailable: gps.gpsAvailable
          }
        );

        if (!res.data.success) {
          throw new Error(res.data.detail);
        }

        const nowLabel = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
        const matchedEvent =
          res.data.data?.eventTitle ?? matchedTicket?.title ?? "Sự kiện Khoa CNTT HCM-UTE";

        setHistory((prev) => [
          {
            id: `CHK-${crypto.randomUUID()}`,
            eventTitle: matchedEvent,
            code: cleaned.slice(0, 24),
            time: `${nowLabel} · Vừa xong`,
            method,
            statusLabel: "Đã xác nhận"
          },
          ...prev
        ]);
        setCheckinSuccess(`Điểm danh thành công mã "${cleaned.slice(0, 24)}" lúc ${nowLabel}.`);
        setManualCode("");
      } catch (err) {
        setCheckinError(
          extractApiErrorMessage(
            err,
            "Điểm danh thất bại. Hệ thống chưa ghi nhận lượt điểm danh này — vui lòng kiểm tra mạng và thử lại."
          )
        );
      } finally {
        setSubmitting(false);
      }
    },
    [userId, registeredTickets, activeTicket?.eventId, readCurrentGps]
  );

  const handleScannedPayload = useCallback(
    (decoded) => {
      const dispatch = resolveYitZoneQrPayload(decoded);
      if (dispatch.kind === "NAVIGATE") {
        setCheckinError(null);
        pushAppToast({
          variant: "info",
          title: `Đang mở ${dispatch.label}`,
          description: "Đã nhận diện mã QR YITZone."
        });
        void navigate(dispatch.to);
        return;
      }
      if (dispatch.kind === "UNSUPPORTED") {
        setCheckinSuccess(null);
        setCheckinError(dispatch.reason);
        return;
      }
      void submitCheckin(dispatch.code, "CAMERA_QR");
    },
    [navigate, submitCheckin]
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
            handleScannedPayload(decoded);
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

  const handleManualSubmit = (e) => {
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
              Quét QR
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Quét mã QR để điểm danh, vào Minigame, Live Q&amp;A, bình chọn, khảo sát hoặc xác thực E-Certificate — hoặc xuất trình Vé QR cá nhân tại cửa.
            </p>
          </div>

          {canOperateStaffScanner && (
            <Button asChild variant="outline" className="h-10 w-full rounded-full sm:w-auto">
              <Link to="/staff/scanner">
                <ScanLine className="h-4 w-4 text-primary" />
                <span>Chuyển sang Máy Soát vé BTC</span>
              </Link>
            </Button>
          )}
        </div>
      </section>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v)}
        className="space-y-5"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="scan" className="flex-1 gap-1.5 sm:flex-initial">
            <Camera className="h-3.5 w-3.5" />
            <span>Quét QR</span>
          </TabsTrigger>
          <TabsTrigger value="ticket" className="flex-1 gap-1.5 sm:flex-initial">
            <Ticket className="h-3.5 w-3.5" />
            <span>Vé QR Cá nhân</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Unified QR Scanner */}
        <TabsContent value="scan" className="mt-0">
          <div className="grid gap-5 lg:grid-cols-12">
            <Card className="rounded-[20px] lg:col-span-7">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl font-medium">
                  Quét QR
                </CardTitle>
                <CardDescription>
                  Hướng camera vào mã QR trên màn hình LED hoặc tài liệu YITZone — hệ thống sẽ tự nhận diện và mở đúng mục.
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
                          Bấm nút bên dưới để mở camera quét mã QR điểm danh, Minigame, Live Q&amp;A, bình chọn hoặc chứng nhận.
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

                {/* Fallback manual 6-digit PIN entry */}
                <div className="space-y-2 border-t border-border/70 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <KeyRound className="h-3.5 w-3.5 text-primary" />
                    <span>Không quét được camera? Nhập mã PIN 6 số hiển thị trên màn hình LED:</span>
                  </div>
                  <form onSubmit={handleManualSubmit} className="flex flex-col gap-2.5 sm:flex-row">
                    <Input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Nhập 6 chữ số PIN trên màn hình LED (VD: 482910)"
                      className="tabular-mono h-12 flex-1 rounded-xl text-base tracking-widest sm:h-11 sm:text-sm"
                      aria-label="Mã PIN 6 số trên màn hình LED"
                    />
                    <Button
                      type="submit"
                      disabled={submitting || manualCode.replace(/\D/g, "").length !== 6}
                      className="liquid-glass-btn-cobalt h-12 w-full shrink-0 rounded-full px-6 sm:h-11 sm:w-auto"
                    >
                      {submitting ? "Đang gửi..." : "Xác nhận PIN 6 số"}
                    </Button>
                  </form>
                </div>

                {checkinSuccess && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="space-y-2.5 rounded-xl border border-status-success/35 bg-status-success/10 px-4 py-3 text-sm text-status-success"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{checkinSuccess}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-status-success/20 pt-2 text-xs text-foreground">
                      <span>Còn 1 bước sau sự kiện: Làm khảo sát chất lượng để mở khóa E-Certificate.</span>
                      <Button asChild size="sm" variant="outline" className="h-8 rounded-full">
                        <Link to="/surveys">Làm khảo sát ngay</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {checkinError && (
                  <div
                    role="alert"
                    className="flex items-center gap-2.5 rounded-xl border border-status-danger/35 bg-status-danger/10 px-3.5 py-3 text-sm text-status-danger"
                  >
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
                {history.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground">
                    Chưa có lượt điểm danh nào trong phiên này. Quét mã QR trên màn hình LED hoặc nhập mã PIN để bắt đầu.
                  </div>
                ) : (
                  history.map((item) => (
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
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Student Personal Dynamic QR Ticket */}
        <TabsContent value="ticket" className="mt-0">
          {!activeTicket ? (
            <Card className="rounded-[20px]">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Ticket className="h-6 w-6" />
                </div>
                <div className="max-w-md space-y-1">
                  <h2 className="font-display text-lg font-medium text-foreground">
                    Bạn chưa có Vé QR sự kiện nào
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Hãy đăng ký tham dự sự kiện để nhận mã Vé QR cá nhân cho tài khoản{" "}
                    <span className="tabular-mono font-semibold text-foreground">{userId}</span>.
                  </p>
                </div>
                <Button asChild className="liquid-glass-btn-cobalt mt-1 rounded-full px-5">
                  <Link to="/events">Khám phá Sự kiện đang mở</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
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
                  Vé sự kiện đã đăng ký ({registeredTickets.length})
                </CardTitle>
                <CardDescription>
                  Chọn sự kiện để xuất trình mã QR tương ứng tại bàn Lễ tân.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {registeredTickets.map((ticket) => {
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
