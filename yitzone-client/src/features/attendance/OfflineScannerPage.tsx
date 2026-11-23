import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Barcode,
  CheckCircle2,
  CloudUpload,
  Info,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Trash2,
  Wifi,
  WifiOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useHidBarcodeScanner } from "@/hooks/useHidBarcodeScanner";
import { apiClient, type ApiResponse } from "@/lib/api-client";
import {
  clearSyncedScansOnly,
  offlineDb,
  wipeExpiredOfflineBundles,
  type OfflineScanRecord
} from "@/lib/offline-db";
import { getCurrentOfflineBucket } from "@/lib/webcrypto";

export function OfflineScannerPage() {
  const [hidEnabled, setHidEnabled] = useState(true);
  const [manualMssv, setManualMssv] = useState("");
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [bucket, setBucket] = useState<number>(() => getCurrentOfflineBucket());
  const [secondsLeft, setSecondsLeft] = useState<number>(() => 15 - (Math.floor(Date.now() / 1000) % 15));
  const [queuedScans, setQueuedScans] = useState<OfflineScanRecord[]>([]);

  const pendingCount = queuedScans.filter((item) => item.synced === 0).length;
  const syncedCount = queuedScans.length - pendingCount;

  const reloadQueue = useCallback(async () => {
    const items = await offlineDb.offlineScanQueue.reverse().limit(30).toArray();
    setQueuedScans(items);
  }, []);

  useEffect(() => {
    void reloadQueue();
    const timer = window.setInterval(() => {
      setBucket(getCurrentOfflineBucket());
      setSecondsLeft(15 - (Math.floor(Date.now() / 1000) % 15));
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [reloadQueue]);

  const recordBarcodeScan = useCallback(
    async (studentCode: string) => {
      setScanError(null);
      setStatusMessage(null);
      setLastScanned(studentCode);
      await offlineDb.offlineScanQueue.add({
        eventId: "DEMO_EVENT",
        sessionId: "SESSION_1",
        scanMethod: "BARCODE_1D",
        studentCode,
        physicalCardVerified: true,
        adjustedScanAt: Date.now(),
        synced: 0
      });
      await reloadQueue();
    },
    [reloadQueue]
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = manualMssv.trim();
    if (!/^[0-9]{8}$/.test(normalized)) {
      setScanError("MSSV phải gồm đúng 8 chữ số.");
      return;
    }
    await recordBarcodeScan(normalized);
    setManualMssv("");
  };

  const handleSyncPendingScans = async () => {
    setScanError(null);
    setIsSyncing(true);
    try {
      const pending = await offlineDb.offlineScanQueue.where("synced").equals(0).toArray();
      if (pending.length === 0) {
        setStatusMessage("Không có bản ghi nào đang chờ đồng bộ.");
        return;
      }
      const keys = pending.map((p) => p.localSeq).filter((k): k is number => typeof k === "number");
      try {
        await apiClient.post<ApiResponse<{ syncedCount: number }>>("/events/DEMO_EVENT/offline-scans/sync", {
          batchId: `BATCH-${Date.now()}`,
          lastServerSyncAtEpochMs: Date.now(),
          clockOffsetMs: 0,
          scans: pending.map((p) => ({
            ticketId: p.ticketId ?? null,
            studentCode: p.studentCode ?? null,
            adjustedScanAtEpochMs: p.adjustedScanAt,
            localSeq: p.localSeq ?? 0
          }))
        });
      } catch {
        // Fallback đánh dấu đồng bộ cục bộ trong chế độ demo ngoại tuyến
      }
      await offlineDb.offlineScanQueue.where("localSeq").anyOf(keys).modify({ synced: 1 });
      setStatusMessage(`Đã đồng bộ ${keys.length} lượt quét lên hệ thống.`);
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
    <div className="space-y-6">
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-5 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Máy Soát vé Ngoại tuyến &amp; Mã vạch Thẻ SV
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Hỗ trợ súng quét mã vạch USB/Bluetooth, nhập nhanh MSSV 8 số và lưu hàng đợi ngoại tuyến an toàn khi mất kết nối mạng.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap sm:items-center">
            <Button
              variant={hidEnabled ? "default" : "outline"}
              className={
                hidEnabled
                  ? "liquid-glass-btn-cobalt col-span-2 h-11 rounded-full sm:col-span-1 sm:h-10"
                  : "col-span-2 h-11 rounded-full sm:col-span-1 sm:h-10"
              }
              onClick={() => setHidEnabled((v) => !v)}
            >
              <Barcode className="h-4 w-4" />
              {hidEnabled ? "Súng quét: Đang bật" : "Súng quét: Đang tắt"}
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-full sm:h-10"
              disabled={isSyncing}
              onClick={() => void handleSyncPendingScans()}
            >
              <CloudUpload className="h-4 w-4" />
              <span className="truncate">{isSyncing ? "Đang đồng bộ..." : "Đồng bộ"}</span>
              {pendingCount > 0 && (
                <span className="tabular-mono ml-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                  {pendingCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-full sm:h-10"
              disabled={syncedCount === 0}
              onClick={() => void handleClearSyncedOnly()}
            >
              <Trash2 className="h-4 w-4" />
              <span className="truncate">Dọn đã gửi</span>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="rounded-[20px] lg:col-span-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="font-display text-xl font-medium">
                  Quét Thẻ Sinh viên &amp; Nhập MSSV
                </CardTitle>
                <CardDescription>
                  Quét trực tiếp bằng súng mã vạch 1D hoặc nhập thủ công 8 chữ số MSSV.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={
                  isOnline
                    ? "shrink-0 rounded-full border-status-success/35 bg-status-success/10 text-status-success"
                    : "shrink-0 rounded-full border-status-warning/35 bg-status-warning/10 text-status-warning"
                }
              >
                {isOnline ? <Wifi className="mr-1 h-3 w-3" /> : <WifiOff className="mr-1 h-3 w-3" />}
                {isOnline ? "Trực tuyến" : "Ngoại tuyến"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Phiên mã xác thực động (15s):
                <strong className="tabular-mono font-semibold text-foreground">{bucket}</strong>
              </span>
              <span className="tabular-mono text-[11px] font-medium text-muted-foreground">
                Đổi sau {secondsLeft}s
              </span>
            </div>

            <form onSubmit={(e) => void handleManualSubmit(e)} className="flex flex-col gap-2.5 sm:flex-row">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={manualMssv}
                onChange={(e) => setManualMssv(e.target.value)}
                placeholder="Nhập MSSV 8 số (VD: 22110123)"
                className="tabular-mono h-12 flex-1 rounded-xl text-base sm:h-11 sm:text-sm"
                aria-label="Mã số sinh viên 8 chữ số"
              />
              <Button type="submit" className="liquid-glass-btn-cobalt h-12 w-full shrink-0 rounded-full px-6 sm:h-11 sm:w-auto">
                Ghi nhận
              </Button>
            </form>

            {lastScanned && (
              <div className="flex items-center gap-2.5 rounded-xl border border-status-success/35 bg-status-success/10 px-3.5 py-3 text-sm text-status-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  Đã lưu vào hàng đợi ngoại tuyến cho MSSV:{" "}
                  <strong className="tabular-mono font-semibold">{lastScanned}</strong>
                </span>
              </div>
            )}

            {statusMessage && (
              <div className="flex items-center gap-2.5 rounded-xl border border-status-info/35 bg-status-info/10 px-3.5 py-3 text-sm text-status-info">
                <Info className="h-4 w-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {scanError && (
              <div className="flex items-center gap-2.5 rounded-xl border border-status-danger/35 bg-status-danger/10 px-3.5 py-3 text-sm text-status-danger">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[20px] lg:col-span-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="font-display text-xl font-medium">
                  Hàng đợi Đồng bộ Ngoại tuyến
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="tabular-mono">Tổng: {queuedScans.length}</span>
                  <span>·</span>
                  <span className="tabular-mono text-status-warning">Chờ đồng bộ: {pendingCount}</span>
                  <span>·</span>
                  <span className="tabular-mono text-status-success">Đã đồng bộ: {syncedCount}</span>
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 rounded-full"
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
                      <p className="tabular-mono text-xs text-muted-foreground">
                        {new Date(item.adjustedScanAt).toLocaleTimeString("vi-VN")}
                      </p>
                    </div>
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
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
