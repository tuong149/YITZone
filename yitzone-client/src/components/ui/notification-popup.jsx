import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  ShieldAlert,
  ShoppingBag,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/notification-store";
import { cn } from "@/lib/utils";

const EXIT_ANIMATION_MS = 160;

const CATEGORY_META = {
  EVENT: {
    label: "Sự kiện",
    icon: CalendarDays,
    accentClass: "bg-primary/15 text-primary"
  },
  DUTY: {
    label: "Trực Văn phòng",
    icon: ClipboardCheck,
    accentClass: "bg-status-info/15 text-status-info"
  },
  STORE: {
    label: "Cửa hàng",
    icon: ShoppingBag,
    accentClass: "bg-status-success/15 text-status-success"
  },
  SECURITY: {
    label: "Bảo mật",
    icon: ShieldAlert,
    accentClass: "bg-status-danger/15 text-status-danger"
  }
};

const AUTO_DISMISS_MS = 7000;

export function NotificationPopup() {
  const navigate = useNavigate();
  const activePopup = useNotificationStore((s) => s.activePopup);
  const dismissPopup = useNotificationStore((s) => s.dismissPopup);
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  const [paused, setPaused] = useState(false);
  const [exiting, setExiting] = useState(false);
  const remainingRef = useRef(AUTO_DISMISS_MS);
  const startedAtRef = useRef(0);
  const exitTimerRef = useRef(null);

  const triggerExit = useCallback(() => {
    setExiting((prev) => {
      if (prev) return true;
      exitTimerRef.current = window.setTimeout(() => {
        dismissPopup();
      }, EXIT_ANIMATION_MS);
      return true;
    });
  }, [dismissPopup]);

  useEffect(() => {
    remainingRef.current = AUTO_DISMISS_MS;
    startedAtRef.current = 0;
    setPaused(false);
    setExiting(false);
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, [activePopup?.id]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activePopup || paused || exiting) return;
    if (remainingRef.current <= 0) {
      triggerExit();
      return;
    }
    startedAtRef.current = Date.now();
    const timer = window.setTimeout(() => {
      remainingRef.current = 0;
      triggerExit();
    }, remainingRef.current);
    return () => {
      window.clearTimeout(timer);
      if (startedAtRef.current > 0) {
        const elapsed = Date.now() - startedAtRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
      }
    };
  }, [activePopup, paused, exiting, triggerExit]);

  if (!activePopup) return null;

  const meta = CATEGORY_META[activePopup.category] ?? CATEGORY_META.EVENT;
  const Icon = meta.icon;

  const handleOpen = () => {
    const target = activePopup.link ?? "/notifications";
    markAsRead(activePopup.id);
    dismissPopup();
    void navigate(target);
  };

  return (
    <aside
      key={activePopup.id}
      role="status"
      aria-live="polite"
      aria-label="Thông báo mới"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="fixed right-3 top-[68px] z-[55] w-[min(92vw,390px)] sm:right-6"
    >
      <div
        className={cn(
          "liquid-glass-card overflow-hidden rounded-[22px] border border-primary/30 shadow-floating transition-[border-color,box-shadow]",
          exiting ? "yit-toast-exit" : "yit-toast-motion"
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                meta.accentClass
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge variant="info" className="text-[11px]">
                    Thông báo mới · {meta.label}
                  </Badge>
                  <span className="tabular-mono text-xs text-muted-foreground">
                    {activePopup.time}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={triggerExit}
                  aria-label="Đóng pop-up thông báo"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h3 className="font-display text-sm font-semibold leading-snug text-foreground">
                {activePopup.title}
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {activePopup.body}
              </p>

              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  className="liquid-glass-btn-cobalt h-8 rounded-full px-3.5 text-xs"
                  onClick={handleOpen}
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    markAsRead(activePopup.id);
                    triggerExit();
                  }}
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Đánh dấu đã đọc
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Synchronized countdown progress bar */}
        <div className="h-1 w-full bg-primary/15">
          <div
            className="yit-toast-countdown h-full w-full origin-left bg-primary/70"
            style={{
              animationDuration: `${AUTO_DISMISS_MS}ms`,
              animationPlayState: paused || exiting ? "paused" : "running"
            }}
          />
        </div>
      </div>
    </aside>
  );
}
