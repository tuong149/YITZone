import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

const VARIANT_STYLES = {
  info: {
    container: "border-status-info/35 bg-card/95 text-foreground",
    icon: Info,
    iconClass: "text-status-info"
  },
  success: {
    container: "border-status-success/35 bg-card/95 text-foreground",
    icon: CheckCircle2,
    iconClass: "text-status-success"
  },
  warning: {
    container: "border-status-warning/40 bg-card/95 text-foreground",
    icon: AlertTriangle,
    iconClass: "text-status-warning"
  },
  danger: {
    container: "border-status-danger/40 bg-card/95 text-foreground",
    icon: AlertCircle,
    iconClass: "text-status-danger"
  }
};

export function AppToaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismissToast = useToastStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Thông báo hệ thống"
      className="pointer-events-none fixed bottom-20 right-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2.5 md:bottom-6 md:right-6"
    >
      {toasts.map((toast) => {
        const meta = VARIANT_STYLES[toast.variant];
        const Icon = meta.icon;
        return (
          <div
            key={toast.id}
            role={toast.variant === "danger" || toast.variant === "warning" ? "alert" : "status"}
            className={cn(
              "yit-toast-motion pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-floating backdrop-blur-md transition-[opacity,border-color,box-shadow] duration-150",
              meta.container
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.iconClass)} />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="text-sm font-semibold leading-snug">{toast.title}</div>
              {toast.description && (
                <p className="text-xs leading-relaxed text-muted-foreground">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Đóng thông báo"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
