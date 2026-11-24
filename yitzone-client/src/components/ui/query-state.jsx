import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QueryState({
  isLoading = false,
  isError = false,
  errorMessage = "Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối và thử lại.",
  onRetry,
  isEmpty = false,
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Hiện chưa có mục nào để hiển thị.",
  emptyAction,
  loadingLabel = "Đang tải dữ liệu...",
  skeletonCount = 3,
  className,
  children
}) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("space-y-3", className)}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <div
              key={idx}
              className="h-40 animate-pulse rounded-card border border-border/60 bg-card/70"
            />
          ))}
        </div>
        <span className="sr-only">{loadingLabel}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-card border border-status-danger/30 bg-status-danger/5 px-6 py-10 text-center",
          className
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-status-danger/15 text-status-danger">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-base font-semibold text-foreground">Tải dữ liệu không thành công</h3>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
        {onRetry && (
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-muted/20 px-6 py-12 text-center",
          className
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="h-5 w-5" />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-base font-semibold text-foreground">{emptyTitle}</h3>
          <p className="text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
        {emptyAction && <div className="pt-1">{emptyAction}</div>}
      </div>
    );
  }

  return <>{children}</>;
}
