import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventCreateWizard } from "@/features/events/EventCreateWizard";
import { useEventStore } from "@/stores/event-store";

export function EventCreatePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const events = useEventStore((s) => s.events);
  const editingEventId = useEventStore((s) => s.wizardDraft.editingEventId);
  const lastSavedAt = useEventStore((s) => s.wizardDraft.lastSavedAt);
  const loadEventIntoWizard = useEventStore((s) => s.loadEventIntoWizard);
  const resetWizardDraft = useEventStore((s) => s.resetWizardDraft);

  const isEditRoute = Boolean(eventId);
  const editingEvent = eventId ? events.find((e) => e.id === eventId) : undefined;

  useEffect(() => {
    if (eventId) {
      if (editingEventId !== eventId) {
        loadEventIntoWizard(eventId);
      }
    } else if (editingEventId !== null) {
      resetWizardDraft();
    }
  }, [eventId, editingEventId, loadEventIntoWizard, resetWizardDraft]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <Link
            to="/admin/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại Quản trị Sự kiện</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-medium text-foreground">
              {isEditRoute ? "Chỉnh sửa Kế hoạch Sự kiện" : "Khởi tạo Sự kiện Mới"}
            </h1>
            {isEditRoute && editingEvent && (
              <Badge variant="outline" className="tabular-mono">
                {editingEvent.id}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isEditRoute
              ? "Cập nhật thông tin, lịch trình, hoạt động theo buổi hoặc biểu mẫu đăng ký trước khi lưu nháp hoặc gửi thẩm định."
              : "Thiết lập thông tin sự kiện, lịch trình đa buổi, biểu mẫu đăng ký và vị trí tuyển Ban Tổ chức. Mọi thay đổi được tự động lưu nháp trên trình duyệt."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastSavedAt && (
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center gap-1.5 rounded-full border border-status-success/30 bg-status-success/10 px-3 py-1 text-xs font-medium text-status-success"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Đã tự lưu nháp lúc {lastSavedAt}</span>
            </span>
          )}
          {!isEditRoute && lastSavedAt && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={resetWizardDraft}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Làm mới bản nháp</span>
            </Button>
          )}
        </div>
      </div>

      {editingEvent?.revisionNote && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-status-warning/35 bg-status-warning/10 px-4 py-3 text-xs leading-relaxed text-status-warning"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <strong className="font-semibold">Góp ý yêu cầu chỉnh sửa từ Ban Thường vụ:</strong>{" "}
            <span>{editingEvent.revisionNote}</span>
          </div>
        </div>
      )}

      <EventCreateWizard
        onCreated={(created) => {
          navigate("/admin/events", {
            state: { notice: created.summaryNotice }
          });
        }}
      />
    </div>
  );
}
