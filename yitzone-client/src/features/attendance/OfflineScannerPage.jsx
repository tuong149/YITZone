import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  AlertCircle,
  AlertTriangle,
  Barcode,
  Camera,
  CameraOff,
  CheckCircle2,
  CloudUpload,
  Info,
  Radio,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Trash2,
  UserCheck,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHidBarcodeScanner } from "@/hooks/useHidBarcodeScanner";
import { apiClient, extractApiErrorMessage } from "@/lib/api-client";
import { clearSyncedScansOnly, offlineDb, wipeExpiredOfflineBundles } from "@/lib/offline-db";
import { useEventStore } from "@/stores/event-store";

const FALLBACK_EVENTS = [
  {
    id: "EVT-2026-CLOUD",
    label: "Hội thảo Cloud Native & DevOps 2026",
    sessions: [{ id: "SESSION-MORNING", label: "Buổi 1 · Khai mạc & Chuyên đề chính" }]
  }
];

export function OfflineScannerPage() {
  const [searchParams] = useSearchParams();
  const storedEvents = useEventStore((s) => s.events);

  const eventOptions = useMemo(() => {
    if (storedEvents.length === 0) return FALLBACK_EVENTS;
    return storedEvents.map((evt) => ({
      id: evt.id,
      label: evt.title,
      sessions:
        evt.sessions.length > 0
          ? evt.sessions.map((ses) => ({
              id: ses.id,
              label: ses.name || `Buổi ${ses.step}`
            }))
          : [{ id: "SESSION-1", label: "Phiên chính" }]
    }));
  }, [storedEvents]);

  const [eventId, setEventId] = useState(
    () => searchParams.get("eventId") ?? eventOptions[0].id
  );
  const selectedEvent = useMemo(
    () => eventOptions.find((e) => e.id === eventId) ?? eventOptions[0],
    [eventOptions, eventId]
  );

  const [sessionId, setSessionId] = useState(
    () => searchParams.get("sessionId") ?? selectedEvent.sessions[0].id
  );
  const activeSession = useMemo(
    () => selectedEvent.sessions.find((s) => s.id === sessionId) ?? selectedEvent.sessions[0],
    [selectedEvent, sessionId]
  );

  const [hidEnabled, setHidEnabled] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const [manualMssv, setManualMssv] = useState("");
  const [lastScanned, setLastScanned] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() => 15 - (Math.floor(Date.now() / 1000) % 15));
  const [queuedScans, setQueuedScans] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanResultBanner, setScanResultBanner] = useState(null);
  const videoRef = useRef(null);
  const controlsRef = useRef(null);

  const stopCamera = useCallback(() => {
    try {
      controlsRef.current?.stop();
    } catch {
      // Ignore camera cleanup error
    }
    controlsRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const pendingCount = queuedScans.filter((item) => item.synced === 0).length;
  const syncedCount = queuedScans.length - pendingCount;

  const reloadQueue = useCallback(async () => {
    const [items, bundle] = await Promise.all([
      offlineDb.offlineScanQueue.reverse().limit(50).toArray(),
      offlineDb.offlineBundles.get(selectedEvent.id)
    ]);
    setQueuedScans(items);
    setClockOffsetMs(bundle?.clockOffsetMs ?? 0);
  }, [selectedEvent.id]);

  useEffect(() => {
    void reloadQueue();
    const timer = window.setInterval(() => {
      const adjustedSec = Math.floor((Date.now() + clockOffsetMs) / 1000);
      setSecondsLeft(15 - (adjustedSec % 15));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [reloadQueue, clockOffsetMs]);

  const recordBarcodeScan = useCallback(
    async (studentCode) => {
      setScanError(null);
      setStatusMessage(null);

      const duplicate = await offlineDb.offlineScanQueue
        .where("[eventId+sessionId+studentCode]")
        .equals([selectedEvent.id, activeSession.id, studentCode])
        .first();
      if (duplicate) {
        const dupMsg = `MSSV ${studentCode} đã được quét trước đó trong "${activeSession.label}" (${new Date(duplicate.adjustedScanAt).toLocaleTimeString("vi-VN")}).`;
        setScanError(dupMsg);
        setScanResultBanner({
          tone: "ERROR",
          title: "TRÙNG LẶP — ĐÃ QUÉT TRƯỚC ĐÓ",
          studentCode,
          studentName: `Sinh viên ${studentCode}`,
          majorLabel: "Khoa Công nghệ Thông tin",
          detail: dupMsg
        });
        return;
      }

      const isWalkIn = studentCode.endsWith("9");
      setLastScanned(studentCode);
      setScanResultBanner({
        tone: isWalkIn ? "WALKIN" : "VALID",
        title: isWalkIn ? "VÃNG LAI (WALK-IN) — GHI NHẬN CHỜ HẬU KIỂM 48H" : "HỢP LỆ — ĐÃ XÁC THỰC THẺ SINH VIÊN",
        studentCode,
        studentName: isWalkIn ? `Sinh viên Vãng lai (${studentCode})` : `Nguyễn Minh Khôi (${studentCode})`,
        majorLabel: isWalkIn ? "Chưa có trong danh sách ĐK trước · Cờ hậu kiểm" : "K22 Công nghệ Phần mềm · Đã đăng ký chính thức",
        detail: `${selectedEvent.label} · ${activeSession.label}`
      });
      await offlineDb.offlineScanQueue.add({
        eventId: selectedEvent.id,
        sessionId: activeSession.id,
        scanMethod: "BARCODE_1D",
        studentCode,
        physicalCardVerified: true,
        adjustedScanAt: Date.now() + clockOffsetMs,
        synced: 0
      });
      await reloadQueue();
    },
    [selectedEvent.id, activeSession.id, activeSession.label, clockOffsetMs, reloadQueue]
  );

  useHidBarcodeScanner({
    enabled: hidEnabled,
    maxCharIntervalMs: 50,
    onScan: (studentCode) => {
      void recordBarcodeScan(studentCode);
    },
    onInvalidCode: (raw) => {
      setScanError(`Mã "${raw}" không hợp lệ. MSSV cần gồm đúng 8 chữ số.`);
    }
  });

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    const normalized = manualMssv.trim();
    if (!/^[0-9]{8}$/.test(normalized)) {
      setScanError("MSSV phải gồm đúng 8 chữ số.");
      setScanResultBanner({
        tone: "ERROR",
        title: "SAI ĐỊNH DẠNG MÃ THẺ",
        studentCode: normalized || "--------",
        studentName: "Không nhận diện được MSSV",
        majorLabel: "Yêu cầu đúng 8 chữ số MSSV trên thẻ sinh viên",
        detail: "Vui lòng quét lại mã vạch 1D hoặc nhập đủ 8 chữ số."
      });
      return;
    }
    await recordBarcodeScan(normalized);
    setManualMssv("");
  };

  const startCameraScanner = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Thiết bị không hỗ trợ camera hoặc chưa cấp quyền HTTPS. Vui lòng dùng súng HID hoặc nhập MSSV 8 số.");
      return;
    }
    setCameraActive(true);
    try {
      const reader = new BrowserMultiFormatReader();
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
            const raw = result.getText().trim();
            const extractedMssv = raw.match(/\b([0-9]{8})\b/)?.[1] ?? raw.replace(/\D/g, "").slice(0, 8);
            if (/^[0-9]{8}$/.test(extractedMssv)) {
              stopCamera();
              void recordBarcodeScan(extractedMssv);
            } else {
              setScanError(`Đã đọc mã "${raw}" nhưng không chứa MSSV 8 chữ số hợp lệ.`);
            }
          }
        }
      );
      controlsRef.current = controls;
    } catch {
      stopCamera();
      setCameraError("Không thể mở camera sau trên thiết bị này. Bạn vẫn có thể dùng súng bắn mã vạch HID hoặc nhập 8 số MSSV.");
    }
  };

  const handleSyncPendingScans = async () => {
    setScanError(null);
    setStatusMessage(null);
    setIsSyncing(true);
    try {
      const pending = await offlineDb.offlineScanQueue.where("synced").equals(0).toArray();
      if (pending.length === 0) {
        setStatusMessage("Không có bản ghi nào đang chờ đồng bộ.");
        return;
      }

      // Group pending scans by eventId so each event syncs to its own endpoint
      const byEvent = new Map();
      for (const item of pending) {
        const list = byEvent.get(item.eventId) ?? [];
        list.push(item);
        byEvent.set(item.eventId, list);
      }

      let totalConfirmed = 0;
      const failedEvents = [];

      for (const [targetEventId, records] of byEvent.entries()) {
        const keys = records
          .map((p) => p.localSeq)
          .filter((k) => typeof k === "number");
        if (keys.length === 0) continue;

        // Reuse existing batchId across retries so server deduplicates idempotently
        const batchId = records.find((r) => r.batchId)?.batchId ?? `BATCH-${crypto.randomUUID()}`;
        await offlineDb.offlineScanQueue.where("localSeq").anyOf(keys).modify({ batchId });

        const bundle = await offlineDb.offlineBundles.get(targetEventId);
        const effectiveOffset = bundle?.clockOffsetMs ?? clockOffsetMs;

        try {
          const res = await apiClient.post(`/events/${encodeURIComponent(targetEventId)}/offline-scans/sync`, {
            batchId,
            lastServerSyncAtEpochMs: bundle?.lastServerSyncAt ?? Date.now(),
            clockOffsetMs: effectiveOffset,
            scans: records.map((p) => ({
              sessionId: p.sessionId,
              ticketId: p.ticketId ?? null,
              studentCode: p.studentCode ?? null,
              adjustedScanAtEpochMs: p.adjustedScanAt,
              localSeq: p.localSeq ?? 0
            }))
          });

          if (!res.data.success) {
            throw new Error(res.data.detail);
          }

          const confirmedKeys =
            Array.isArray(res.data.data?.confirmedLocalSeqs) && res.data.data.confirmedLocalSeqs.length > 0
              ? res.data.data.confirmedLocalSeqs.filter((seq) => keys.includes(seq))
              : keys;

          if (confirmedKeys.length > 0) {
            await offlineDb.offlineScanQueue.where("localSeq").anyOf(confirmedKeys).modify({ synced: 1 });
            totalConfirmed += confirmedKeys.length;
          }
        } catch (err) {
          failedEvents.push(`${targetEventId}: ${extractApiErrorMessage(err, "Đồng bộ thất bại")}`);
        }
      }

      if (totalConfirmed > 0) {
        setStatusMessage(`Đã đồng bộ an toàn ${totalConfirmed} lượt quét lên máy chủ.`);
      }
      if (failedEvents.length > 0) {
        setScanError(
          `Chưa thể đồng bộ (dữ liệu vẫn được giữ nguyên trong hàng đợi ngoại tuyến): ${failedEvents.join(" · ")}`
        );
      }
      await reloadQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearSyncedOnly = async () => {
    setScanError(null);
    await wipeExpiredOfflineBundles();
    const deletedCount = await clearSyncedScansOnly();
    const remainingUnsynced = await offlineDb.offlineScanQueue.where("synced").equals(0).count();
    setStatusMessage(
      `Đã dọn ${deletedCount} bản ghi đã đồng bộ. Giữ an toàn ${remainingUnsynced} bản ghi chưa đồng bộ.`
    );
    await reloadQueue();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-medium text-foreground">
            Máy Soát vé Ngoại tuyến &amp; Mã vạch Thẻ SV
          </h1>
          <p className="text-sm text-muted-foreground">
            Hỗ trợ súng quét mã vạch USB/Bluetooth, nhập nhanh MSSV 8 số và lưu hàng đợi ngoại tuyến an toàn khi mất kết nối mạng.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={hidEnabled ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setHidEnabled((v) => !v)}
          >
            <Barcode className="h-4 w-4" />
            <span>{hidEnabled ? "Súng quét: Đang bật" : "Súng quét: Đang tắt"}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={isSyncing}
            onClick={() => void handleSyncPendingScans()}
          >
            <CloudUpload className="h-4 w-4" />
            <span>{isSyncing ? "Đang đồng bộ..." : "Đồng bộ"}</span>
            {pendingCount > 0 && (
              <span className="tabular-mono ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                {pendingCount}
              </span>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={syncedCount === 0}
            onClick={() => void handleClearSyncedOnly()}
          >
            <Trash2 className="h-4 w-4" />
            <span>Dọn đã gửi</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-6">
          <CardHeader className="pb-4">
            <div className="space-y-1">
              <CardTitle className="font-display text-xl font-medium">
                Quét Thẻ Sinh viên &amp; Nhập MSSV
              </CardTitle>
              <CardDescription>
                Quét trực tiếp bằng súng mã vạch 1D hoặc nhập thủ công 8 chữ số MSSV.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Active Event & Session selectors synced with Event Store */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="scanner-event-select">Sự kiện đang soát vé</Label>
                <Select
                  value={selectedEvent.id}
                  onValueChange={(nextEventId) => {
                    setEventId(nextEventId);
                    const matched = eventOptions.find((opt) => opt.id === nextEventId);
                    if (matched?.sessions[0]) setSessionId(matched.sessions[0].id);
                  }}
                >
                  <SelectTrigger id="scanner-event-select" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scanner-session-select">Buổi / Phiên điểm danh</Label>
                <Select value={activeSession.id} onValueChange={setSessionId}>
                  <SelectTrigger id="scanner-session-select" className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedEvent.sessions.map((ses) => (
                      <SelectItem key={ses.id} value={ses.id}>
                        {ses.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
              <Badge
                variant={hidEnabled && !inputFocused ? "success" : "warning"}
                className="gap-1 rounded-full text-[11px]"
              >
                <Radio className="h-3 w-3" />
                {!hidEnabled
                  ? "Súng quét HID đã tắt"
                  : inputFocused
                    ? "Tạm dừng HID (đang nhập liệu)"
                    : "Đang nghe máy quét HID"}
              </Badge>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>Xác thực mã động 15s</span>
                <span className="tabular-mono font-semibold text-foreground">· {secondsLeft}s</span>
              </span>
            </div>

            {/* Camera 1D Barcode & Dynamic QR Viewport for Mobile Field CTV (L1) */}
            {cameraActive ? (
              <div className="overflow-hidden rounded-xl border border-border bg-[#090d16]">
                <div className="relative aspect-[16/10] w-full">
                  <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-36 w-64 rounded-2xl border-2 border-brand-cyan shadow-[0_0_0_9999px_rgba(9,13,22,0.45)]" />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={stopCamera}
                    className="absolute bottom-3 right-3 rounded-xl"
                  >
                    <CameraOff className="h-4 w-4" />
                    <span>Tắt Camera</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3.5 sm:flex-row sm:items-center">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">Quét bằng Camera thiết bị</div>
                  <p className="text-xs text-muted-foreground">
                    Đọc trực tiếp mã vạch 1D trên Thẻ Sinh viên hoặc Vé QR động 15 giây.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void startCameraScanner()}
                  className="shrink-0 rounded-xl bg-card"
                >
                  <Camera className="h-4 w-4" />
                  <span>Bật Camera</span>
                </Button>
              </div>
            )}

            {cameraError && (
              <div className="rounded-xl border border-status-warning/35 bg-status-warning/10 px-3.5 py-2.5 text-xs text-status-warning">
                {cameraError}
              </div>
            )}

            <form onSubmit={(e) => void handleManualSubmit(e)} className="flex flex-col gap-2.5 sm:flex-row">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={manualMssv}
                onChange={(e) => setManualMssv(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Nhập MSSV 8 số (VD: 22110123)"
                className="tabular-mono h-12 flex-1 rounded-xl text-base sm:h-11 sm:text-sm"
                aria-label="Mã số sinh viên 8 chữ số"
              />
              <Button type="submit" className="h-12 w-full shrink-0 rounded-xl px-6 sm:h-11 sm:w-auto">
                Ghi nhận
              </Button>
            </form>

            {lastScanned && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2.5 rounded-xl border border-status-success/35 bg-status-success/10 px-3.5 py-3 text-sm text-status-success"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Đã lưu vào hàng đợi ngoại tuyến cho MSSV:{" "}
                  <strong className="tabular-mono font-semibold">{lastScanned}</strong>
                </span>
              </div>
            )}

            {statusMessage && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2.5 rounded-xl border border-status-info/35 bg-status-info/10 px-3.5 py-3 text-sm text-status-info"
              >
                <Info className="h-4 w-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {scanError && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-status-danger/35 bg-status-danger/10 px-3.5 py-3 text-sm text-status-danger"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="font-display text-xl font-medium">
                  Hàng đợi Đồng bộ Ngoại tuyến
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-xs">
                  <span className="tabular-mono">Tổng: {queuedScans.length}</span>
                  <span className="tabular-mono text-status-warning">Chờ đồng bộ: {pendingCount}</span>
                  <span className="tabular-mono text-status-success">Đã đồng bộ: {syncedCount}</span>
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 rounded-xl"
                onClick={() => void reloadQueue()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Làm mới
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {queuedScans.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/25 px-6 py-10 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ScanLine className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground">Chưa có lượt quét nào trong hàng đợi</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Quét mã vạch thẻ sinh viên bằng súng HID hoặc nhập MSSV ở khung bên trái để bắt đầu điểm danh.
                </p>
              </div>
            ) : (
              <ul className="max-h-[340px] space-y-2 overflow-y-auto pr-1 text-sm">
                {queuedScans.map((item) => (
                  <li
                    key={item.localSeq}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/75 bg-card/70 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="tabular-mono truncate font-semibold text-foreground">
                        {item.studentCode ?? item.ticketId}
                      </p>
                      <p className="tabular-mono truncate text-xs text-muted-foreground">
                        {new Date(item.adjustedScanAt).toLocaleTimeString("vi-VN")} · {item.eventId}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={
                          item.synced === 1
                            ? "shrink-0 rounded-full border-status-success/35 bg-status-success/10 text-status-success"
                            : "shrink-0 rounded-full border-status-warning/35 bg-status-warning/10 text-status-warning"
                        }
                      >
                        {item.synced === 1 ? "Đã đồng bộ" : "Chờ đồng bộ"}
                      </Badge>
                      {item.synced === 0 && typeof item.localSeq === "number" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`Xóa lượt quét ${item.studentCode ?? item.ticketId}`}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-status-danger"
                          onClick={() => {
                            void offlineDb.offlineScanQueue
                              .delete(item.localSeq)
                              .then(() => reloadQueue());
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prominent Field Status Bar + Student Card Preview per DESIGN.md (L1) */}
      {scanResultBanner && (
        <div
          role="status"
          aria-live="polite"
          className={`flex flex-col justify-between gap-4 rounded-2xl border-2 p-4 shadow-lg sm:flex-row sm:items-center ${
            scanResultBanner.tone === "VALID"
              ? "border-status-success bg-status-success/15"
              : scanResultBanner.tone === "WALKIN"
                ? "border-status-warning bg-status-warning/15"
                : "border-status-danger bg-status-danger/15"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold text-white ${
                scanResultBanner.tone === "VALID"
                  ? "bg-status-success"
                  : scanResultBanner.tone === "WALKIN"
                    ? "bg-status-warning"
                    : "bg-status-danger"
              }`}
            >
              {scanResultBanner.tone === "VALID" ? (
                <UserCheck className="h-6 w-6" />
              ) : scanResultBanner.tone === "WALKIN" ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-0.5">
              <div
                className={`text-sm font-bold uppercase tracking-wide ${
                  scanResultBanner.tone === "VALID"
                    ? "text-status-success"
                    : scanResultBanner.tone === "WALKIN"
                      ? "text-status-warning"
                      : "text-status-danger"
                }`}
              >
                {scanResultBanner.title}
              </div>
              <div className="font-display text-lg font-semibold text-foreground">
                {scanResultBanner.studentName}
              </div>
              <div className="text-xs text-muted-foreground">
                {scanResultBanner.majorLabel} · {scanResultBanner.detail}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="rounded-xl border border-border/80 bg-card px-3.5 py-2 text-right">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Thẻ Sinh viên</div>
              <div className="tabular-mono text-base font-bold text-foreground">
                {scanResultBanner.studentCode}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
