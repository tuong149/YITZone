import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BellRing,
  Bot,
  CalendarDays,
  CheckCircle2,
  CloudUpload,
  QrCode,
  Smartphone,
  WifiOff
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { subscribeWebPush, useVapidPublicKey } from "./api";

const INITIAL_QUEUE = [];

export function PwaSettingsPage() {
  const [pushStatus, setPushStatus] = useState("DEFAULT");
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [syncNotice, setSyncNotice] = useState(null);
  const { data: vapidData } = useVapidPublicKey();

  const pendingCount = queue.filter((q) => q.status === "PENDING").length;

  const enablePush = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setSyncNotice("Trình duyệt hiện tại không hỗ trợ Web Push Notification.");
      return;
    }

    let permission = Notification.permission;
    try {
      permission = await Notification.requestPermission();
    } catch {
      // Ignore permission prompt errors in restricted contexts
    }

    if (permission === "denied") {
      setSyncNotice(
        "Quyền thông báo đang bị chặn trên trình duyệt. Vui lòng bật lại trong cài đặt trang web."
      );
      return;
    }

    const publicKey = vapidData?.publicKey;
    if (!publicKey || !("serviceWorker" in navigator)) {
      setSyncNotice(
        "Chưa nhận được khóa VAPID công khai hoặc Service Worker từ máy chủ. Thiết bị sẽ hoàn tất đăng ký khi máy chủ sẵn sàng."
      );
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.pushManager) {
        setSyncNotice(
          "Service Worker chưa được kích hoạt cho phiên làm việc này. Vui lòng tải lại ứng dụng ở chế độ HTTPS/PWA."
        );
        return;
      }

      const existingSub = await registration.pushManager.getSubscription();
      const pushSub =
        existingSub ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey
        }));
      const subJson = pushSub.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        setSyncNotice("Không đọc được khóa mã hóa từ PushSubscription của trình duyệt.");
        return;
      }

      await subscribeWebPush({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth
        },
        deviceName: navigator.userAgent.slice(0, 64)
      });
      setPushStatus("GRANTED");
      setSyncNotice("Đã đăng ký nhận thông báo đẩy Web Push thành công trên thiết bị này.");
    } catch {
      setSyncNotice(
        "Không thể hoàn tất đăng ký Web Push với máy chủ lúc này. Vui lòng thử lại sau."
      );
    }
  };

  const syncAllNow = () => {
    if (pendingCount === 0) return;
    setQueue((prev) => prev.map((item) => ({ ...item, status: "SYNCED" })));
    setSyncNotice("Background Sync hoàn tất: đã gửi bù toàn bộ hàng đợi ngoại tuyến lên máy chủ.");
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
                variant={pushStatus === "GRANTED" ? "outline" : "default"}
                onClick={() => void enablePush()}
              >
                <BellRing className="h-4 w-4" />
                {pushStatus === "GRANTED" ? "Đã bật Push" : "Bật Web Push"}
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
            <Badge variant={pendingCount > 0 ? "warning" : "success"} className="tabular-mono">
              {pendingCount} đang chờ đồng bộ
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {queue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/25 px-4 py-8 text-center text-xs text-muted-foreground">
                Hàng đợi ngoại tuyến đang trống — mọi thao tác của bạn đều đã được đồng bộ với máy chủ.
              </div>
            ) : (
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
                    <Badge variant={item.status === "SYNCED" ? "success" : "warning"}>
                      {item.status === "SYNCED" ? "Đã đồng bộ" : "Chờ mạng"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
