import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-0.5 text-xs font-semibold leading-tight transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/25 bg-primary/10 text-primary",
        secondary: "border-border bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        verified: "rounded-full border-transparent bg-brand-navy text-white px-3 py-1",
        success: "border-status-success/25 bg-status-success/12 text-status-success",
        warning: "border-status-warning/25 bg-status-warning/12 text-status-warning",
        danger: "border-status-danger/25 bg-status-danger/12 text-status-danger",
        info: "border-status-info/25 bg-status-info/12 text-status-info",
        /* SRS-Locked 6 Calendar Categories (Module 4.13) */
        calFaculty: "border-cal-faculty/30 bg-cal-faculty/12 text-cal-faculty",
        calDept: "border-cal-dept/30 bg-cal-dept/12 text-cal-dept",
        calOffice: "border-cal-office/30 bg-cal-office/12 text-cal-office",
        calArts: "border-cal-arts/30 bg-cal-arts/12 text-cal-arts",
        calExam: "border-cal-exam/30 bg-cal-exam/12 text-cal-exam",
        calDeadline: "border-cal-deadline/30 bg-cal-deadline/12 text-cal-deadline"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant,...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function VerifiedBadge({
  label = "Đã xác thực bởi Đoàn - Hội Khoa CNTT",
  className
}: {
  label?: string;
  className?: string;
}) {
  return (
    <Badge variant="verified" className={className}>
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
      <span>{label}</span>
    </Badge>
  );
}

export { badgeVariants };
