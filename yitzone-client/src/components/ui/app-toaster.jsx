import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const EXIT_ANIMATION_MS = 160;

const VARIANT_STYLES = {
  info: {
    border: "border-primary/30",
    icon: Info,
    iconBox: "bg-status-info/15 text-status-info",
    barTrack: "bg-primary/15",
    barFill: "bg-primary/70"
  },
  success: {
    border: "border-status-success/30",
    icon: CheckCircle2,
    iconBox: "bg-status-success/15 text-status-success",
    barTrack: "bg-status-success/15",
    barFill: "bg-status-success/75"
  },
  warning: {
    border: "border-status-warning/35",
    icon: AlertTriangle,
    iconBox: "bg-status-warning/15 text-status-warning",
    barTrack: "bg-status-warning/15",
    barFill: "bg-status-warning/75"
  },
  danger: {
    border: "border-status-danger/35",
    icon: AlertCircle,
    iconBox: "bg-status-danger/15 text-status-danger",
    barTrack: "bg-status-danger/15",
    barFill: "bg-status-danger/75"
  }
};

function ToastCard({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const [exiting, setExiting] = useState(false);
  const remainingRef = useRef(toast.durationMs ?? 0);
  const startedAtRef = useRef(0);
  const exitTimerRef = useRef(null);

  const triggerExit = useCallback(() => {
    setExiting((prev) => {
      if (prev) return true;
      exitTimerRef.current = window.setTimeout(() => {
        onDismiss(toast.id);
      }, EXIT_ANIMATION_MS);
      return true;
    });
  }, [onDismiss, toast.id]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!toast.durationMs || toast.durationMs <= 0 || paused || exiting) return;
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
  }, [toast.durationMs, paused, exiting, triggerExit]);

  const meta = VARIANT_STYLES[toast.variant] ?? VARIANT_STYLES.info;
  const Icon = meta.icon;
  const hasCountdown = Boolean(toast.durationMs && toast.durationMs > 0);

  return (
    <div
      role={toast.variant === "danger" || toast.variant === "warning" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "liquid-glass-card pointer-events-auto overflow-hidden rounded-[22px] border shadow-floating transition-[border-color,box-shadow]",
        exiting ? "yit-toast-exit" : "yit-toast-motion",
        meta.border
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              meta.iconBox
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-sm font-semibold leading-snug text-foreground">
                {toast.title}
              </h3>
              <button
                type="button"
                onClick={triggerExit}
                aria-label="Đóng thông báo"
                className="-mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {toast.description && (
              <p className="text-xs leading-relaxed text-muted-foreground">{toast.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className={cn("h-1 w-full", meta.barTrack)}>
        <div
          className={cn(
            "h-full w-full origin-left",
            hasCountdown && "yit-toast-countdown",
            meta.barFill
          )}
          style={
            hasCountdown
              ? {
                  animationDuration: `${toast.durationMs}ms`,
                  animationPlayState: paused || exiting ? "paused" : "running"
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}

export function AppToaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Thông báo hệ thống"
      className="pointer-events-none fixed right-3 top-[68px] z-[60] flex w-[min(92vw,390px)] flex-col gap-2.5 sm:right-6"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
