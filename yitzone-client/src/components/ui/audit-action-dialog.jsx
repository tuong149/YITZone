import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AuditActionDialog({
  open,
  onOpenChange,
  title,
  description,
  targetSummary,
  actionCode,
  confirmLabel = "Xác nhận & Ghi Audit Log",
  destructive = true,
  minReasonLength = 10,
  onConfirm
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < minReasonLength) {
      setError(`Vui lòng nhập lý do rõ ràng (tối thiểu ${minReasonLength} ký tự).`);
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      await onConfirm(trimmed);
      setReason("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert
              className={destructive ? "h-5 w-5 text-brand-crimson": "h-5 w-5 text-primary"}
            />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-md border border-border bg-muted/60 px-3.5 py-2.5 text-sm">
            <div className="text-xs font-semibold text-muted-foreground">Đối tượng tác động</div>
            <div className="mt-0.5 font-medium text-foreground">{targetSummary}</div>
            <div className="mt-1 tabular-mono text-xs text-muted-foreground">
              Mã sự kiện kiểm toán: {actionCode}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="audit-reason-input">Lý do thực hiện (bắt buộc)</Label>
            <Textarea
              id="audit-reason-input"
              placeholder="Nêu rõ căn cứ hoặc minh chứng xử lý để lưu trữ kiểm toán..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(undefined);
              }}
              error={error}
            />
          </div>

          <p className="rounded-md border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-xs font-medium text-status-warning">
            Thao tác này sẽ được ghi nhận vào Audit Log bất biến (Hash-chain) và không thể xóa.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant={destructive ? "destructive": "default"}
            onClick={() => void handleConfirm()}
            disabled={submitting}
          >
            {submitting ? "Đang xử lý...": confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
