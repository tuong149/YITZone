import { useState } from "react";
import { AlertTriangle, CheckCircle2, CornerDownRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  isRegistrationFieldVisible,
  type RegistrationFormField
} from "@/features/events/RegistrationFormBuilder";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import type { StoredEventRecord } from "@/stores/event-store";

export function EventRegistrationDialog({
  event,
  open,
  onOpenChange,
  onSubmitted
}: {
  event: StoredEventRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (answers: Record<string, string | string[] | boolean>) => void;
}) {
  const fullName = useAuthStore((s) => s.fullName) ?? "Sinh viên HCM-UTE";
  const email = useAuthStore((s) => s.email) ?? "student@student.hcmute.edu.vn";

  const [answers, setAnswers] = useState<Record<string, string | string[] | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const visibleFields = event.formFields.filter((field) =>
    isRegistrationFieldVisible(field, event.formFields, answers)
  );

  const clearFieldError = (fieldId: string) => {
    setErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    for (const field of visibleFields) {
      if (!field.required) continue;
      const val = answers[field.id];
      if (field.type === "CHECKBOX_CONSENT") {
        if (val !== true) nextErrors[field.id] = "Vui lòng tích chọn mục cam kết bắt buộc này.";
      } else if (field.type === "MULTI_CHOICE") {
        if (!Array.isArray(val) || val.length === 0) {
          nextErrors[field.id] = "Vui lòng chọn ít nhất một phương án.";
        }
      } else if (typeof val !== "string" || !val.trim()) {
        nextErrors[field.id] = "Vui lòng điền thông tin cho câu hỏi bắt buộc này.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // Only persist answers for currently visible fields
    const visibleAnswers: Record<string, string | string[] | boolean> = {};
    for (const field of visibleFields) {
      if (answers[field.id] !== undefined) {
        visibleAnswers[field.id] = answers[field.id]!;
      }
    }

    onSubmitted(visibleAnswers);
    setAnswers({});
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-medium">
            Biểu mẫu Đăng ký Tham dự
          </DialogTitle>
          <DialogDescription>
            {event.title} · Hoàn tất thông tin bổ sung dưới đây để giữ chỗ và nhận Vé QR.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Auto-filled YITZone profile summary */}
          <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-0.5">
              <div className="font-semibold text-foreground">
                Thông tin tự động điền từ hồ sơ YITZone
              </div>
              <div className="text-muted-foreground">
                {fullName} · <span className="tabular-mono">{email}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {visibleFields.map((field: RegistrationFormField) => {
              const currentVal = answers[field.id];
              const fieldError = errors[field.id];
              const inputId = `reg-field-${field.id}`;

              return (
                <div
                  key={field.id}
                  className={cn(
                    "space-y-1.5 rounded-xl transition-all",
                    field.visibleWhen && "border border-status-info/30 bg-status-info/5 p-3.5"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor={inputId} className="text-sm font-medium text-foreground">
                      {field.label}
                      {field.required && <span className="ml-1 text-status-danger">*</span>}
                    </Label>
                    {field.visibleWhen && (
                      <Badge variant="info">
                        <CornerDownRight className="h-3 w-3" />
                        <span>Câu hỏi mở rộng</span>
                      </Badge>
                    )}
                  </div>

                  {field.type === "SHORT_TEXT" && (
                    <Input
                      id={inputId}
                      value={typeof currentVal === "string" ? currentVal : ""}
                      onChange={(e) => {
                        setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }));
                        clearFieldError(field.id);
                      }}
                      placeholder={field.placeholder || "Nhập câu trả lời..."}
                      aria-invalid={Boolean(fieldError)}
                      className="h-10 rounded-xl bg-card"
                    />
                  )}

                  {field.type === "PARAGRAPH" && (
                    <Textarea
                      id={inputId}
                      rows={3}
                      value={typeof currentVal === "string" ? currentVal : ""}
                      onChange={(e) => {
                        setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }));
                        clearFieldError(field.id);
                      }}
                      placeholder={field.placeholder || "Nhập nội dung chi tiết..."}
                      aria-invalid={Boolean(fieldError)}
                      className="rounded-xl bg-card"
                    />
                  )}

                  {field.type === "LINK_OR_FILE" && (
                    <Input
                      id={inputId}
                      type="url"
                      value={typeof currentVal === "string" ? currentVal : ""}
                      onChange={(e) => {
                        setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }));
                        clearFieldError(field.id);
                      }}
                      placeholder={field.placeholder || "https://..."}
                      aria-invalid={Boolean(fieldError)}
                      className="h-10 rounded-xl bg-card"
                    />
                  )}

                  {field.type === "SINGLE_CHOICE" && (
                    <div className="space-y-1.5 pt-0.5">
                      {field.options.map((opt, idx) => (
                        <label
                          key={idx}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted/50"
                        >
                          <input
                            type="radio"
                            name={`reg-radio-${field.id}`}
                            checked={currentVal === opt}
                            onChange={() => {
                              setAnswers((prev) => ({ ...prev, [field.id]: opt }));
                              clearFieldError(field.id);
                            }}
                            className="h-4 w-4 accent-primary"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === "MULTI_CHOICE" && (
                    <div className="space-y-1.5 pt-0.5">
                      {field.options.map((opt, idx) => {
                        const selectedList = Array.isArray(currentVal) ? currentVal : [];
                        const checked = selectedList.includes(opt);
                        return (
                          <label
                            key={idx}
                            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-foreground hover:bg-muted/50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const nextList = checked
                                  ? selectedList.filter((item) => item !== opt)
                                  : [...selectedList, opt];
                                setAnswers((prev) => ({ ...prev, [field.id]: nextList }));
                                clearFieldError(field.id);
                              }}
                              className="h-4 w-4 accent-primary"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {field.type === "CHECKBOX_CONSENT" && (
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3 text-xs text-foreground">
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={currentVal === true}
                        onChange={(e) => {
                          setAnswers((prev) => ({ ...prev, [field.id]: e.target.checked }));
                          clearFieldError(field.id);
                        }}
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <span>{field.label}</span>
                    </label>
                  )}

                  {fieldError && (
                    <p role="alert" className="text-xs font-medium text-status-danger">
                      {fieldError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="border-t border-border/70 pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Để sau
            </Button>
            <Button type="submit" className="liquid-glass-btn-cobalt rounded-full px-5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Xác nhận đăng ký &amp; Nhận Vé QR</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CancelRegistrationDialog({
  eventTitle,
  lockNote,
  open,
  onOpenChange,
  onConfirm
}: {
  eventTitle: string;
  lockNote?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-medium">
            <AlertTriangle className="h-5 w-5 text-status-warning" />
            <span>Xác nhận hủy đăng ký?</span>
          </DialogTitle>
          <DialogDescription>
            Bạn sắp hủy suất tham dự sự kiện <strong className="text-foreground">{eventTitle}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 px-3.5 py-2.5 text-xs leading-relaxed text-status-warning">
          Suất trống sẽ được nhường ngay cho sinh viên tiếp theo trong danh sách chờ.
          {lockNote ? ` Lưu ý: ${lockNote}.` : ""}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Giữ lại suất
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Xác nhận hủy đăng ký
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
