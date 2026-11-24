import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef(
  ({ className, error,...props }, ref) => (
    <div className="w-full space-y-1">
      <textarea
        ref={ref}
        aria-invalid={Boolean(error) || undefined}
        className={cn(
          "flex min-h-[88px] w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-status-danger focus-visible:border-status-danger focus-visible:ring-status-danger/20",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs font-medium text-status-danger">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";
