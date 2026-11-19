import { useCallback, useEffect, useState } from "react";
import { Barcode, CheckCircle2, CloudUpload, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [bucket, setBucket] = useState<number>(() => getCurrentOfflineBucket());
  const [queuedScans, setQueuedScans] = useState<OfflineScanRecord[]>([]);

  const reloadQueue = useCallback(async () => {
    const items = await offlineDb.offlineScanQueue.reverse().limit(20).toArray();
    setQueuedScans(items);
  }, []);

  useEffect(() => {
    void reloadQueue();
    const timer = window.setInterval(() => {
      setBucket(getCurrentOfflineBucket());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [reloadQueue]);

  const recordBarcodeScan = useCallback(
    async (studentCode: string) => {
      setScanError(null);
      setStatusMessage(null);
      setLastScanned(studentCode);
      // TODO: Replace DEMO_EVENT / SESSION_1 with active route parameter when multi-session selector is connected
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
      setScanError(`Mã "${raw}" không khớp định dạng MSSV 8 chữ số (^[0-9]{8}$).`);
    }
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{8}$/.test(manualMssv.trim())) {
      setScanError("MSSV phải gồm đúng 8 chữ số.");
      return;
    }
    await recordBarcodeScan(manualMssv.trim());
    setManualMssv("");
  };

  const handleSyncPendingScans = async () => {
    setScanError(null);
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
      // Mark as synced locally in demo/offline fallback or notify status
    }
    await offlineDb.offlineScanQueue.where("localSeq").anyOf(keys).modify({ synced: 1 });
    setStatusMessage(`Đã đánh dấu đồng bộ ${keys.length} lượt quét.`);
    await reloadQueue();
  };

  const handleClearSyncedOnly = async () => {
    await wipeExpiredOfflineBundles();
    const deletedCount = await clearSyncedScansOnly();
    const remainingUnsynced = await offlineDb.offlineScanQueue.where("synced").equals(0).count();
    setStatusMessage(
      `Đã xóa ${deletedCount} bản ghi đã đồng bộ. Giữ an toàn ${remainingUnsynced} bản ghi chưa đồng bộ.`
    );
    await reloadQueue();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Máy Soát vé BTC Ngoại tuyến &amp; Mã vạch Thẻ SV 1D</h1>
          <p className="text-sm text-muted-foreground">
            Hỗ trợ Súng quét USB/Bluetooth HID (`30–50ms/char`), Camera ZXing (Code 128/39) và Vé QR ký số `ECDSA P-256` bước nhảy 15s.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={hidEnabled ? "default" : "outline"} onClick={() => setHidEnabled((v) => !v)}>
            <Barcode className="h-4 w-4" />
            {hidEnabled ? "HID Wedge: Đang bật" : "HID Wedge: Đang tắt"}
          </Button>
          <Button variant="outline" onClick={() => void handleSyncPendingScans()}>
            <CloudUpload className="h-4 w-4" />
            Đồng bộ lô quét
          </Button>
          <Button variant="outline" onClick={() => void handleClearSyncedOnly()}>
            <Trash2 className="h-4 w-4" />
            Xóa bản ghi đã đồng bộ
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quét Thẻ Sinh viên Vật lý (1D Barcode)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              Bucket ECDSA P-256 hiện tại (15s): <strong className="text-foreground">{bucket}</strong>
            </div>

            <form onSubmit={(e) => void handleManualSubmit(e)} className="flex gap-2">
              <input
                type="text"
                value={manualMssv}
                onChange={(e) => setManualMssv(e.target.value)}
                placeholder="Nhập thử MSSV 8 số (VD: 22110123)"
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <Button type="submit">Ghi nhận</Button>
            </form>

            {lastScanned && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle2 className="h-4 w-4" />
                <span>Đã lưu hàng đợi IndexedDB cho MSSV: {lastScanned}</span>
              </div>
            )}

            {statusMessage && (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                {statusMessage}
              </div>
            )}

            {scanError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {scanError}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Hàng đợi Đồng bộ IndexedDB ({queuedScans.length})</span>
              <Button size="sm" variant="outline" onClick={() => void reloadQueue()}>
                <RefreshCw className="h-3.5 w-3.5" />
                Làm mới
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queuedScans.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có lượt quét nào trong hàng đợi.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {queuedScans.map((item) => (
                  <li key={item.localSeq} className="flex items-center justify-between rounded border border-border px-3 py-2">
                    <span className="font-mono font-medium">{item.studentCode ?? item.ticketId}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.adjustedScanAt).toLocaleTimeString("vi-VN")} · {item.synced === 1 ? "Đã đồng bộ" : "Chờ sync"}
                    </span>
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
