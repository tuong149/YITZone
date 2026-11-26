import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
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
import { Switch } from "@/components/ui/switch";
import { subscribeWebPush, useVapidPublicKey } from "@/features/pwa/api";
import { extractApiErrorMessage } from "@/lib/api-client";

const INITIAL_CHANNELS = [
  {
    id: "events",
    title: "Sự kiện & Điểm danh",
    description: "Nhắc giờ check-in, đôn danh sách chờ (Waitlist) và xác nhận cộng quyền lợi.",
    email: true,
    push: true
  },
  {
    id: "office",
    title: "Lịch trực & Ban/Tổ",
    description: "Nhắc ca trực văn phòng trước 30 phút, yêu cầu đổi ca và thông báo nội bộ đơn vị.",
    email: false,
    push: true
  },
  {
    id: "sv5t",
    title: "SV5T & E-Certificate",
    description: "Cập nhật kết quả rà soát hồ sơ SV5T và thông báo khi chứng nhận điện tử được phát hành.",
    email: true,
    push: true
  },
  {
    id: "store",
    title: "Cửa hàng & Gây quỹ",
    description: "Xác nhận thanh toán VietQR, lịch nhận vật phẩm tại bàn trực hoặc phòng học.",
    email: true,
    push: false
  }
];

const INITIAL_QUEUE = [];

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <Switch
      size="sm"
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
    />
  );
}

export function ProfileAppSettingsSection({ accountHealth, onUpdateAccountHealth }) {
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [syncNotice, setSyncNotice] = useState(null);
  const [pushError, setPushError] = useState(null);
  const { data: vapidData } = useVapidPublicKey();

  const pendingCount = queue.filter((q) => q.status === "PENDING").length;

  const toggleChannel = (id, field, value) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, [field]: value } : ch))
    );
  };

  const enablePush = async () => {
    setSyncNotice(null);
    setPushError(null);

    if (typeof window === "undefined" || !("Notification" in window)) {
      setPushError("Trình duyệt hiện tại không hỗ trợ API thông báo đẩy Web Push.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushError("Bạn chưa cấp quyền thông báo trên trình duyệt. Vui lòng cho phép Notification để tiếp tục.");
        return;
      }
    } catch {
      setPushError("Không thể yêu cầu quyền thông báo trên trình duyệt hiện tại.");
      return;
    }

    if (!vapidData?.publicKey) {
      setPushError(
        "Máy chủ chưa cung cấp khóa VAPID công khai để đăng ký Web Push. Vui lòng thử lại khi dịch vụ thông báo sẵn sàng."
      );
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushError("Thiết bị hoặc trình duyệt chưa kích hoạt Service Worker / PushManager.");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      const subscription =
        existingSub ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey)
        }));
      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        setPushError("Không đọc được khóa mã hóa từ đăng ký PushManager của trình duyệt.");
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

      setSyncNotice("Đã đăng ký nhận thông báo đẩy Web Push thành công trên thiết bị này.");
      onUpdateAccountHealth({ pushEnabled: true });
    } catch (err) {
      setPushError(
        extractApiErrorMessage(
          err,
          "Không thể hoàn tất đăng ký Web Push với máy chủ. Vui lòng thử lại sau."
        )
      );
    }
  };

  const syncAllNow = () => {
    setQueue((prev) => prev.map((item) => ({ ...item, status: "SYNCED" })));
    setSyncNotice("Background Sync hoàn tất: đã gửi bù toàn bộ hàng đợi ngoại tuyến lên máy chủ.");
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col justify-between gap-3 rounded-[26px] p-6 sm:flex-row sm:items-center sm:px-7">
        <div>
          <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            Ứng dụng (PWA) &amp; Thông báo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tùy chỉnh kênh nhận thông báo, bật Web Push trên thiết bị và quản lý hàng đợi đồng bộ khi ngoại tuyến.
          </p>
        </div>
        <Badge variant="info" className="shrink-0 self-start whitespace-nowrap rounded-full px-3 py-1 sm:self-center">
          Android Chrome ≥ 110 · iOS Safari ≥ 16.4
        </Badge>
      </section>

      <Card className="overflow-hidden rounded-[22px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-4 w-4 text-primary" />
            <span>Kênh nhận thông báo</span>
          </CardTitle>
          <CardDescription>
            Chọn nhóm thông báo bạn muốn nhận qua Email trường hoặc thông báo đẩy Web Push.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden grid-cols-[minmax(0,1fr)_72px_72px] items-center gap-4 border-t border-border bg-muted/40 px-5 py-2 text-xs font-semibold text-muted-foreground sm:grid">
            <span>Nhóm thông báo</span>
            <span className="text-center">Email</span>
            <span className="text-center">Web Push</span>
          </div>
          <ul className="divide-y divide-border border-t border-border">
            {channels.map((ch) => (
              <li
                key={ch.id}
                className="flex flex-col gap-3 px-5 py-3.5 sm:grid sm:grid-cols-[minmax(0,1fr)_72px_72px] sm:items-center sm:gap-4"
              >
                <div>
                  <div className="text-sm font-medium text-foreground">{ch.title}</div>
                  <p className="text-xs text-muted-foreground">{ch.description}</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:contents">
                  <div className="flex items-center gap-2 sm:justify-center">
                    <span className="text-xs text-muted-foreground sm:hidden">Email</span>
                    <ToggleSwitch
                      checked={ch.email}
                      onChange={(val) => toggleChannel(ch.id, "email", val)}
                      label={`Nhận Email cho ${ch.title}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:justify-center">
                    <span className="text-xs text-muted-foreground sm:hidden">Web Push</span>
                    <ToggleSwitch
                      checked={ch.push}
                      onChange={(val) => toggleChannel(ch.id, "push", val)}
                      label={`Nhận Web Push cho ${ch.title}`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4 text-primary" />
            <span>Cài đặt PWA &amp; Thiết bị nhận Web Push</span>
          </CardTitle>
          <CardDescription>
            Trên iOS (≥ 16.4), hãy bấm Chia sẻ → &ldquo;Thêm vào Màn hình chính&rdquo; trước khi kích hoạt Web Push.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col justify-between gap-3 rounded-md border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-medium text-foreground">Thông báo đẩy Web Push (VAPID)</div>
              <p className="text-xs text-muted-foreground">
                {accountHealth.pushEnabled
                  ? "Thiết bị này đã đăng ký nhận thông báo đẩy lên màn hình khóa."
                  : "Bật để nhận nhắc trực trước 30 phút, đôn Waitlist và phản hồi từ BCH."}
              </p>
            </div>
            <Button
              type="button"
              variant={accountHealth.pushEnabled ? "outline" : "default"}
              onClick={() => void enablePush()}
            >
              <BellRing className="h-4 w-4" />
              <span>{accountHealth.pushEnabled ? "Đã bật Web Push" : "Bật Web Push"}</span>
            </Button>
          </div>

          {pushError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{pushError}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Link
              to="/scanner"
              className="flex flex-col items-center gap-2 rounded-md border border-border bg-card p-3.5 text-center transition-colors hover:border-primary/45 hover:bg-muted/30"
            >
              <QrCode className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Quét QR</span>
            </Link>
            <Link
              to="/profile/calendar"
              className="flex flex-col items-center gap-2 rounded-md border border-border bg-card p-3.5 text-center transition-colors hover:border-primary/45 hover:bg-muted/30"
            >
              <CalendarDays className="h-5 w-5 text-cal-office" />
              <span className="text-xs font-semibold text-foreground">Lịch 6 màu</span>
            </Link>
            <Link
              to="/yitbot"
              className="flex flex-col items-center gap-2 rounded-md border border-border bg-card p-3.5 text-center transition-colors hover:border-primary/45 hover:bg-muted/30"
            >
              <Bot className="h-5 w-5 text-brand-cyan" />
              <span className="text-xs font-semibold text-foreground">YITBot</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <WifiOff className="h-4 w-4 text-status-warning" />
                <span>Hàng đợi đồng bộ ngoại tuyến</span>
              </CardTitle>
              <CardDescription className="mt-0.5">
                Tự động gửi bù qua Service Worker khi thiết bị có mạng trở lại.
              </CardDescription>
            </div>
            <Badge variant={pendingCount > 0 ? "warning" : "success"} className="tabular-mono">
              {pendingCount} đang chờ
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {queue.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/20 p-5 text-center text-xs text-muted-foreground">
              Hàng đợi ngoại tuyến đang trống — mọi thao tác trên thiết bị đã được đồng bộ.
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {queue.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium text-foreground">{item.title}</div>
                    <p className="text-xs text-muted-foreground">{item.policyNote}</p>
                    <span className="tabular-mono text-[11px] text-muted-foreground">{item.queuedAt}</span>
                  </div>
                  <Badge variant={item.status === "SYNCED" ? "success" : "warning"} className="self-start sm:self-center">
                    {item.status === "SYNCED" ? "Đã đồng bộ" : "Chờ mạng"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}

          {syncNotice && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-md border border-status-success/30 bg-status-success/10 px-3 py-2 text-xs text-status-success"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          <Button type="button" onClick={syncAllNow} disabled={pendingCount === 0}>
            <CloudUpload className="h-4 w-4" />
            <span>Đồng bộ ngay ({pendingCount})</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
