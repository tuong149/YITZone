import { useState } from "react";
import { Bell, CheckCheck, Mail, ShieldAlert, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NotificationItem {
  id: string;
  category: "EVENT" | "DUTY" | "STORE" | "SECURITY";
  title: string;
  body: string;
  channels: ("In-App" | "Web Push" | "Email SMTP")[];
  time: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n-1",
    category: "EVENT",
    title: "Giữ chỗ Waitlist khẩn (còn 30 phút)",
    body: "Hội thảo Cloud Native & DevOps 2026 vừa có 1 chỗ trống. Bấm xác nhận trước 08:30 để giữ suất chính thức.",
    channels: ["In-App", "Web Push", "Email SMTP"],
    time: "5 phút trước",
    read: false
  },
  {
    id: "n-2",
    category: "DUTY",
    title: "Nhắc lịch Trực Văn phòng Ca 3 (trước 30 phút)",
    body: "Ca trực tại Phòng A1-403 bắt đầu lúc 13:30. Check-in hợp lệ sẽ tự động mở tạm quyền phát vật phẩm tại bàn trực.",
    channels: ["In-App", "Web Push"],
    time: "32 phút trước",
    read: false
  },
  {
    id: "n-3",
    category: "STORE",
    title: "Đã gạch nợ VietQR đơn #STR-2026-089",
    body: "Đơn hàng FIT Navy Hoodie (Size L) đã thanh toán thành công. Xuất trình mã QR nhận hàng tại Văn phòng.",
    channels: ["In-App", "Email SMTP"],
    time: "2 giờ trước",
    read: true
  },
  {
    id: "n-4",
    category: "SECURITY",
    title: "Cảnh báo bảo mật: Thu hồi phiên cũ sau khi đổi mật khẩu",
    body: "Toàn bộ Refresh Token của các phiên đăng nhập trước đã được thu hồi tự động.",
    channels: ["In-App", "Email SMTP"],
    time: "Hôm qua · 21:14",
    read: true
  }
];

interface PrefItem {
  id: string;
  label: string;
  desc: string;
  enabled: boolean;
  locked?: boolean;
}

const INITIAL_PREFS: PrefItem[] = [
  { id: "p-1", label: "Nhắc ca trực Văn phòng trước 30 phút", desc: "Web Push + In-App cho CTV Ban OFIT & toàn Khoa", enabled: true },
  { id: "p-2", label: "Nhắc sự kiện đã đăng ký trước 2 giờ", desc: "Đồng bộ từ Lịch của tôi", enabled: true },
  { id: "p-3", label: "Thông báo đôn danh sách chờ (Waitlist)", desc: "Web Push + Email SMTP khẩn (giữ chỗ 30p / 10p)", enabled: true },
  { id: "p-4", label: "Phản hồi từ Hộp thư Ban Chấp hành", desc: "Web Push khi BCH trả lời Q&A Messenger", enabled: true },
  { id: "p-5", label: "Cảnh báo bảo mật, Đổi giờ/Hủy SK & Thu hồi quyền", desc: "Bắt buộc nhận theo quy chế vận hành — không thể tắt", enabled: true, locked: true }
];

export function NotificationsPage(){
  const [items, setItems] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [prefs, setPrefs] = useState<PrefItem[]>(INITIAL_PREFS);

  const unreadCount = items.filter((i) => !i.read).length;
  const filtered = categoryFilter === "ALL" ? items: items.filter((i) => i.category === categoryFilter);

  const markAllRead = () => {
    setItems((prev) => prev.map((i) => ({...i, read: true })));
  };

  const toggleRead = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? {...i, read: true }: i)));
  };

  const togglePref = (id: string) => {
    setPrefs((prev) =>
      prev.map((p) => (p.id === id && !p.locked ? {...p, enabled: !p.enabled }: p))
    );
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col gap-4 rounded-[26px] p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Trung tâm Thông báo Đa kênh
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đồng bộ thời gian thực qua In-App, Web Push (VAPID) và Email SMTP cho các sự kiện nghiệp vụ quan trọng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={unreadCount > 0 ? "default": "secondary"} className="tabular-mono">
            {unreadCount} chưa đọc
          </Badge>
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </section>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList>
          <TabsTrigger value="inbox">Danh sách Thông báo</TabsTrigger>
          <TabsTrigger value="preferences">Tùy chỉnh Kênh nhận</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:w-60">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger aria-label="Lọc nhóm thông báo" className="rounded-full px-4">
                  <SelectValue placeholder="Lọc theo nhóm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả nhóm thông báo</SelectItem>
                  <SelectItem value="EVENT">Sự kiện &amp; Waitlist</SelectItem>
                  <SelectItem value="DUTY">Trực Văn phòng (OFIT)</SelectItem>
                  <SelectItem value="STORE">Cửa hàng &amp; Thanh toán</SelectItem>
                  <SelectItem value="SECURITY">Bảo mật &amp; Quyền RBAC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleRead(item.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  item.read
                    ? "border-border bg-card hover:border-primary/35"
: "border-primary/35 bg-primary/5 hover:border-primary/55"
                }`}
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!item.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      <span className="font-display text-base font-medium text-foreground">{item.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.body}</p>
                  </div>
                  <span className="shrink-0 tabular-mono text-xs text-muted-foreground">{item.time}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {item.channels.map((ch) => (
                    <Badge key={ch} variant="secondary" className="text-[11px]">
                      {ch === "Email SMTP" ? (
                        <Mail className="h-3 w-3" />
                      ): ch === "Web Push" ? (
                        <Smartphone className="h-3 w-3" />
                      ): (
                        <Bell className="h-3 w-3" />
                      )}
                      {ch}
                    </Badge>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Tùy chọn nhận Thông báo theo Nhóm</CardTitle>
              <CardDescription>
                Bật/tắt từng nhóm thông báo; các cảnh báo bảo mật và hủy/đổi giờ sự kiện luôn được gửi bắt buộc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {prefs.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <span>{p.label}</span>
                      {p.locked && (
                        <Badge variant="warning">
                          <ShieldAlert className="h-3 w-3" />
                          Bắt buộc
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={p.enabled ? "default": "outline"}
                    disabled={p.locked}
                    onClick={() => togglePref(p.id)}
                  >
                    {p.enabled ? "Đang bật": "Đã tắt"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
