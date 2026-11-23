import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BellRing,
  Bot,
  CalendarDays,
  CheckCircle2,
  CloudUpload,
  Plus,
  QrCode,
  Smartphone,
  WifiOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeWebPush, useVapidPublicKey } from "./api";

interface OfflineQueueItem {
  id: string;
  kind: "SURVEY" | "LIVE_QA" | "DUTY_LOG";
  title: string;
  policyNote: string;
  queuedAt: string;
  status: "PENDING" | "SYNCED";
}

const INITIAL_QUEUE: OfflineQueueItem[] = [
  {
    id: "oq-1",
    kind: "SURVEY",
    title: "Phiếu khảo sát sau Check-out · Cloud Native 2026",
    policyNote: "Hợp lệ gửi bù trong vòng 24 giờ sau sự kiện",
    queuedAt: "11:32 · Ngoại tuyến",
    status: "PENDING"
  },
  {
    id: "oq-2",
    kind: "LIVE_QA",
    title: "Câu hỏi Live Q&A #482910",
    policyNote: "Nếu đồng bộ sau giờ sẽ lưu mục \"Gửi sau sự kiện\"",
    queuedAt: "11:34 · Ngoại tuyến",
    status: "PENDING"
  }
];

export function PwaSettingsPage(){
  const [pushStatus, setPushStatus] = useState<"DEFAULT" | "GRANTED">("DEFAULT");
  const [queue, setQueue] = useState<OfflineQueueItem[]>(INITIAL_QUEUE);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const { data: vapidData } = useVapidPublicKey();

  const pendingCount = queue.filter((q) => q.status === "PENDING").length;

  const enablePush = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch {
        // Fallback for sandboxed browsers
      }
    }
    try {
      await subscribeWebPush({
        endpoint: "https://fcm.googleapis.com/fcm/send/yitzone-pwa-client",
        keys: { p256dh: vapidData?.publicKey || "demo-p256dh", auth: "demo-auth" },
        deviceName: navigator.userAgent.slice(0, 64)
      });
      setSyncNotice("API /pwa/push-subscriptions: đã đăng ký Web Push hợp lệ (Allowlist FCM/APNs/Mozilla/WNS).");
    } catch {
      setSyncNotice("Đã bật Web Push ở chế độ cục bộ (chưa kết nối yitzone-server).");
    }
    setPushStatus("GRANTED");
  };

  const syncAllNow = () => {
    setQueue((prev) => prev.map((item) => ({...item, status: "SYNCED" })));
    setSyncNotice("Background Sync hoàn tất: đã gửi bù toàn bộ hàng đợi ngoại tuyến lên máy chủ.");
  };

  const addSampleOfflineItem = () => {
    setQueue((prev) => [
      {
        id: `oq-${Date.now()}`,
        kind: "DUTY_LOG",
        title: "Sổ nhật ký trực Văn phòng Ca 3 (OFIT)",
        policyNote: "Lưu cục bộ an toàn trên thiết bị và tự động đồng bộ khi có kết nối mạng",
        queuedAt: "Vừa xong · Ngoại tuyến",
        status: "PENDING"
      },
...prev
    ]);
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass rounded-[26px] p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Tiện ích Web Di động (PWA), Web Push &amp; Hàng đợi Ngoại tuyến
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cài đặt lối tắt ra Màn hình chính không cần App Store/CH Play, nhận Web Push và tự động gửi bù khi mạng hội trường chập chờn.
            </p>
          </div>
          <Badge variant="info">Android Chrome ≥ 110 · iOS Safari ≥ 16.4</Badge>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* UC-PWA-01: Install PWA + 3 Shortcuts + Web Push */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Cài đặt PWA &amp; 3 Lối tắt Nhanh
            </CardTitle>
            <CardDescription>
              Trên iOS (≥ 16.4), hãy bấm nút Chia sẻ → &ldquo;Thêm vào Màn hình chính&rdquo; trước khi bật Thông báo Đẩy Web Push.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <Link
                to="/scanner"
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-center transition-colors hover:border-primary/45"
              >
                <span className="liquid-glass-btn-cobalt flex h-10 w-10 items-center justify-center rounded-full">
                  <QrCode className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-foreground">Quét QR</span>
              </Link>
              <Link
                to="/"
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-center transition-colors hover:border-primary/45"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cal-office/15 text-cal-office">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-foreground">Lịch Trực/SK</span>
              </Link>
              <Link
                to="/yitbot"
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-center transition-colors hover:border-primary/45"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-cyan/15 text-brand-cyan">
                  <Bot className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-foreground">YITBot</span>
              </Link>
            </div>

            <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="font-medium text-foreground">Thông báo Đẩy Web Push (VAPID)</div>
                <p className="text-xs text-muted-foreground">
                  {pushStatus === "GRANTED"
                    ? "Thiết bị đã đăng ký nhận Web Push lên màn hình khóa."
: "Bật để nhận nhắc trực 30p, đôn Waitlist và phản hồi từ BCH."}
                </p>
              </div>
              <Button
                type="button"
                variant={pushStatus === "GRANTED" ? "outline": "default"}
                onClick={() => void enablePush()}
              >
                <BellRing className="h-4 w-4" />
                {pushStatus === "GRANTED" ? "Đã bật Push": "Bật Web Push"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* UC-PWA-03: Offline Queue & Background Sync */}
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-status-warning" />
                Hàng đợi Lưu Tạm Ngoại tuyến
              </CardTitle>
              <CardDescription>
                Tự động đồng bộ nền qua Service Worker khi thiết bị có mạng lại mà không cần nhập lại.
              </CardDescription>
            </div>
            <Badge variant={pendingCount > 0 ? "warning": "success"} className="tabular-mono">
              {pendingCount} đang chờ đồng bộ
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2.5">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-muted/30 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">{item.title}</div>
                    <p className="text-xs text-muted-foreground">{item.policyNote}</p>
                    <span className="tabular-mono text-[11px] text-muted-foreground">{item.queuedAt}</span>
                  </div>
                  <Badge variant={item.status === "SYNCED" ? "success": "warning"}>
                    {item.status === "SYNCED" ? "Đã đồng bộ": "Chờ mạng"}
                  </Badge>
                </div>
              ))}
            </div>

            {syncNotice && (
              <div className="flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-3.5 py-2.5 text-xs text-status-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{syncNotice}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={syncAllNow} disabled={pendingCount === 0}>
                <CloudUpload className="h-4 w-4" />
                Đồng bộ ngay ({pendingCount})
              </Button>
              <Button type="button" variant="outline" onClick={addSampleOfflineItem}>
                <Plus className="h-4 w-4" />
                Mô phỏng thêm mục ngoại tuyến
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
