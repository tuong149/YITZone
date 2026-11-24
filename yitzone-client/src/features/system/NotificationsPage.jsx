import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Bell, CheckCheck, Mail, ShieldAlert, Smartphone, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotificationStore } from "@/stores/notification-store";

export function NotificationsPage() {
  const navigate = useNavigate();
  const items = useNotificationStore((s) => s.items);
  const prefs = useNotificationStore((s) => s.prefs);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const togglePref = useNotificationStore((s) => s.togglePref);
  const triggerSampleNotification = useNotificationStore((s) => s.triggerSampleNotification);

  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const unreadCount = items.filter((i) => !i.read).length;
  const filtered = categoryFilter === "ALL" ? items : items.filter((i) => i.category === categoryFilter);

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col gap-4 rounded-[26px] p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Trung tâm Thông báo Đa kênh
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Đồng bộ thông báo sự kiện, ca trực, cửa hàng và bảo mật giữa cửa sổ nhanh, pop-up trực tiếp và trung tâm thông báo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={unreadCount > 0 ? "default" : "secondary"} className="tabular-mono">
            {unreadCount} chưa đọc
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => triggerSampleNotification()}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Thử pop-up mới</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4" />
            <span>Đánh dấu tất cả đã đọc</span>
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
                onClick={() => {
                  markAsRead(item.id);
                  if (item.link) void navigate(item.link);
                }}
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

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.channels.map((ch) => (
                      <Badge key={ch} variant="secondary" className="text-xs">
                        {ch === "Email SMTP" ? (
                          <Mail className="h-3 w-3" />
                        ) : ch === "Web Push" ? (
                          <Smartphone className="h-3 w-3" />
                        ) : (
                          <Bell className="h-3 w-3" />
                        )}
                        {ch}
                      </Badge>
                    ))}
                  </div>
                  {item.link && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                      <span>Mở liên kết</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  )}
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
                  <Switch
                    checked={p.enabled}
                    disabled={p.locked}
                    aria-label={`${p.enabled ? "Tắt" : "Bật"} ${p.label}`}
                    onCheckedChange={() => togglePref(p.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
