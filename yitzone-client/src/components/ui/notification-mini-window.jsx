import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  Inbox,
  ShieldAlert,
  ShoppingBag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/notification-store";
import { cn } from "@/lib/utils";

const CATEGORY_ICON = {
  EVENT: { icon: CalendarDays, colorClass: "bg-primary/12 text-primary" },
  DUTY: { icon: ClipboardCheck, colorClass: "bg-status-info/12 text-status-info" },
  STORE: { icon: ShoppingBag, colorClass: "bg-status-success/12 text-status-success" },
  SECURITY: { icon: ShieldAlert, colorClass: "bg-status-danger/12 text-status-danger" }
};

export function NotificationMiniWindow() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const items = useNotificationStore((s) => s.items);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);
  const visibleItems = useMemo(() => {
    const base = filter === "UNREAD" ? items.filter((i) => !i.read) : items;
    return base.slice(0, 6);
  }, [items, filter]);

  const notifActive = location.pathname.startsWith("/notifications");

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const handleSelectNotification = (item) => {
    markAsRead(item.id);
    setOpen(false);
    void navigate(item.link ?? "/notifications");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : "Thông báo"}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Thông báo"
        className={cn(
          "liquid-glass relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
          notifActive || open ? "text-primary" : "text-foreground/80 hover:text-foreground"
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="tabular-mono absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground ring-2 ring-card"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Cửa sổ thông báo nhanh"
          className="liquid-glass-card yit-popover-enter absolute right-0 top-full z-50 mt-2.5 flex w-[min(92vw,390px)] flex-col overflow-hidden rounded-[22px] border border-border/80 shadow-floating"
        >
          {/* Mini-window Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-foreground">Thông báo</h2>
              {unreadCount > 0 && (
                <Badge variant="default" className="tabular-mono px-2 py-0 text-xs">
                  {unreadCount} mới
                </Badge>
              )}
            </div>

            <button
              type="button"
              disabled={unreadCount === 0}
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-45"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Đọc tất cả</span>
            </button>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/25 px-4 py-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  filter === "ALL"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tất cả ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("UNREAD")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  filter === "UNREAD"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>
          </div>

          {/* Scrollable Notification List */}
          <div className="no-scrollbar max-h-[340px] divide-y divide-border/60 overflow-y-auto overscroll-contain">
            {visibleItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {filter === "UNREAD" ? "Bạn đã đọc hết thông báo!" : "Chưa có thông báo nào"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Thông báo sự kiện, ca trực và đơn hàng sẽ hiển thị ngay tại đây.
                </p>
              </div>
            ) : (
              visibleItems.map((item) => {
                const meta = CATEGORY_ICON[item.category];
                const Icon = meta.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectNotification(item)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/45",
                      !item.read && "bg-primary/[0.04]"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                        meta.colorClass
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "line-clamp-1 text-sm leading-snug",
                            !item.read ? "font-semibold text-foreground" : "font-medium text-foreground/85"
                          )}
                        >
                          {item.title}
                        </span>
                        {!item.read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                      <span className="block pt-0.5 tabular-mono text-xs text-muted-foreground/85">
                        {item.time}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Sticky Footer with Button to Open Full Notifications Page */}
          <div className="border-t border-border/70 bg-muted/25 p-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 w-full rounded-full border-primary/30 bg-card/90 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Link to="/notifications" onClick={() => setOpen(false)}>
                <span>Mở trang Thông báo</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
