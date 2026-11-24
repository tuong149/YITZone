import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function InternalBchNote({
  author,
  timestamp,
  children,
  className
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-internalNote-border bg-internalNote-bg px-3.5 py-2.5 text-sm text-internalNote-ink",
        className
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          Ghi chú nội bộ BCH (ẩn với SV) · {author}
        </span>
        <span className="tabular-mono opacity-80">{timestamp}</span>
      </div>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
