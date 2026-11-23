import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileCheck2,
  Gamepad2,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Settings2,
  ShieldAlert,
  Unlock,
  Users,
  Vote
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEventStore, type StoredEventRecord } from "@/stores/event-store";

interface NoShowRow {
  id: string;
  studentCode: string;
  fullName: string;
  noShowCount: number;
  lockedUntil: string;
}

const INITIAL_NOSHOW: NoShowRow[] = [
  {
    id: "ns-1",
    studentCode: "23110512",
    fullName: "Phạm Minh Tuấn",
    noShowCount: 3,
    lockedUntil: "04/12/2026"
  }
];

export function EventAdminPage() {
  const location = useLocation();
  const initialNotice =
    (location.state as { notice?: string } | null)?.notice ?? null;

  const events = useEventStore((s) => s.events);
  const draftLastSavedAt = useEventStore((s) => s.wizardDraft.lastSavedAt);
  const approveEvent = useEventStore((s) => s.approveEvent);
  const requestRevision = useEventStore((s) => s.requestRevision);

  const [activeTab, setActiveTab] = useState<"list" | "noshow">("list");
  const [noShows, setNoShows] = useState<NoShowRow[]>(INITIAL_NOSHOW);
  const [reviewEvent, setReviewEvent] = useState<StoredEventRecord | null>(null);

  const [auditTarget, setAuditTarget] = useState<{
    title: string;
    description: string;
    summary: string;
    code: string;
    destructive: boolean;
    confirmLabel: string;
    onDone: (reason: string) => void;
  } | null>(null);
  const [notice, setNotice] = useState<string | null>(initialNotice);

  const publishedCount = events.filter((e) => e.status === "PUBLISHED").length;
  const pendingCount = events.filter((e) => e.status === "PENDING_BTV").length;

  const eventCols: DataTableColumn<StoredEventRecord>[] = [
    {
      key: "title",
      header: "Tên Sự kiện",
      render: (e) => (
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{e.title}</div>
          <div className="tabular-mono text-[11px] text-muted-foreground">
            {e.capacity === 0 ? "Không giới hạn" : `${e.capacity} ${e.isTeamCompetition ? "đội" : "chỗ"}`} ·{" "}
            {e.btcRoles.length} vị trí BTC
            {e.formMode === "CUSTOM_FORM" && e.formFields.length > 0
              ? ` · Form ${e.formFields.length} câu`
              : " · ĐK 1 chạm"}
          </div>
          {e.revisionNote && (
            <div className="text-[11px] font-medium text-status-warning">
              Yêu cầu chỉnh sửa: {e.revisionNote}
            </div>
          )}
        </div>
      )
    },
    {
      key: "sessions",
      header: "Buổi & Hoạt động",
      render: (e) => {
        const hasLiveQa = e.sessions.some((s) => s.activities.liveQa);
        const hasLiveVoting = e.sessions.some((s) => s.activities.liveVoting);
        const hasMinigame = e.sessions.some((s) => s.activities.minigame);
        const hasQuiz = e.hasExam || e.sessions.some((s) => s.activities.quizExam);

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="tabular-mono text-xs">{e.sessions.length} buổi</span>
            {hasLiveQa && (
              <Link to="/admin/live-qa">
                <Badge variant="info" className="cursor-pointer hover:opacity-85">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  Live Q&amp;A
                </Badge>
              </Link>
            )}
            {hasLiveVoting && (
              <Link to="/admin/voting">
                <Badge variant="default" className="cursor-pointer hover:opacity-85">
                  <Vote className="mr-1 h-3 w-3" />
                  Live Voting
                </Badge>
              </Link>
            )}
            {hasQuiz && (
              <Link to="/admin/exams">
                <Badge variant="calExam" className="cursor-pointer hover:opacity-85">
                  <ClipboardList className="mr-1 h-3 w-3" />
                  Phòng thi
                </Badge>
              </Link>
            )}
            {hasMinigame && (
              <Badge variant="calArts">
                <Gamepad2 className="mr-1 h-3 w-3" />
                Minigame
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: "benefits",
      header: "Quyền lợi",
      render: (e) =>
        e.benefits.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {e.benefits.map((b) => (
              <Badge key={b} variant="default">
                {b}
              </Badge>
            ))}
          </div>
        ) : (
          <Badge variant="calDept">Nội bộ Ban</Badge>
        )
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (e) => (
        <Badge
          variant={
            e.status === "PUBLISHED" ? "success" : e.status === "PENDING_BTV" ? "warning" : "secondary"
          }
        >
          {e.status === "PUBLISHED"
            ? "Đã xuất bản"
            : e.status === "PENDING_BTV"
              ? "Chờ BTV duyệt"
              : "Bản nháp"}
        </Badge>
      )
    },
    {
      key: "action",
      header: "Thao tác",
      align: "right",
      render: (e) => {
        if (e.status === "DRAFT") {
          return (
            <div className="flex justify-end gap-1.5">
              <Button asChild size="sm" variant="default" className="rounded-full">
                <Link to={`/admin/events/${e.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Chỉnh sửa</span>
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setReviewEvent(e)}
              >
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>Xem &amp; Thẩm định</span>
              </Button>
            </div>
          );
        }

        if (e.status === "PENDING_BTV") {
          return (
            <div className="flex justify-end gap-1.5">
              <Button
                size="sm"
                variant="default"
                className="rounded-full"
                onClick={() => setReviewEvent(e)}
              >
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>Xem &amp; Thẩm định</span>
              </Button>
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link to={`/admin/events/${e.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Chỉnh sửa</span>
                </Link>
              </Button>
            </div>
          );
        }

        return (
          <div className="flex justify-end gap-1.5">
            <Button asChild size="sm" variant="default" className="rounded-full">
              <Link to={`/admin/events/${e.id}`}>
                <Settings2 className="h-3.5 w-3.5" />
                <span>Quản lý</span>
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link
                to={`/events/${e.id}`}
                aria-label={`Mở trang công khai sự kiện ${e.title}`}
                title="Mở trang công khai"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        );
      }
    }
  ];

  const noShowCols: DataTableColumn<NoShowRow>[] = [
    { key: "code", header: "MSSV", render: (n) => <span className="tabular-mono font-semibold">{n.studentCode}</span> },
    { key: "name", header: "Họ và tên", render: (n) => <span className="font-medium">{n.fullName}</span> },
    {
      key: "count",
      header: "Số lần vắng không phép",
      render: (n) => <Badge variant="danger">{n.noShowCount} lần (Khóa 14 ngày)</Badge>
    },
    { key: "until", header: "Hạn mở khóa", render: (n) => <span className="tabular-mono text-xs">{n.lockedUntil}</span> },
    {
      key: "unlock",
      header: "Xử lý khiếu nại",
      align: "right",
      render: (n) => (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() =>
            setAuditTarget({
              title: "Mở khóa Đăng ký Sớm",
              description: "Thao tác mở khóa đăng ký sớm trước hạn 14 ngày bắt buộc nhập lý do và ghi vào Audit Log.",
              summary: `${n.fullName} (${n.studentCode}) · Đang khóa đến ${n.lockedUntil}`,
              code: "EVENT_NOSHOW_EARLY_UNLOCK",
              destructive: false,
              confirmLabel: "Xác nhận mở khóa & Ghi Audit Log",
              onDone: () => {
                setNoShows((prev) => prev.filter((x) => x.id !== n.id));
                setNotice(`Đã mở khóa đăng ký sớm cho ${n.fullName} và lưu Audit Log.`);
              }
            })
          }
        >
          <Unlock className="h-3.5 w-3.5" />
          Mở khóa sớm
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Quản trị Tổ chức Sự kiện, Duyệt Xuất bản &amp; No-show
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý sự kiện đa buổi, biểu mẫu đăng ký, quy trình thẩm định BTV và xử lý mở khóa No-show có kiểm toán.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="success" className="rounded-full px-3 py-1 tabular-mono">
            {publishedCount} đã xuất bản
          </Badge>
          <Badge variant="warning" className="rounded-full px-3 py-1 tabular-mono">
            {pendingCount} chờ BTV duyệt
          </Badge>
          <Button asChild size="sm" className="rounded-full px-4">
            <Link to="/admin/events/new">
              <Plus className="h-4 w-4" />
              <span>{draftLastSavedAt ? "Tiếp tục bản nháp" : "Tạo sự kiện mới"}</span>
            </Link>
          </Button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </span>
          <button type="button" onClick={() => setNotice(null)} className="px-1 py-0.5 underline">
            Đóng
          </button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "noshow")} className="w-full">
        <TabsList>
          <TabsTrigger value="list">Danh sách &amp; Phê duyệt ({events.length})</TabsTrigger>
          <TabsTrigger value="noshow">Khóa No-show ({noShows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <DataTable columns={eventCols} data={events} />
        </TabsContent>

        <TabsContent value="noshow" className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>Danh sách sinh viên chạm ngưỡng ≥ 3 lần vắng không phép/học kỳ (tạm khóa đăng ký 14 ngày):</span>
          </div>
          <DataTable
            columns={noShowCols}
            data={noShows}
            emptyTitle="Không có tài khoản nào đang bị khóa No-show"
            emptyDescription="Mọi sinh viên đều đủ điều kiện đăng ký sự kiện ưu tiên."
          />
        </TabsContent>
      </Tabs>

      {/* BTV / Head of Dept Plan Review Sheet */}
      <Dialog
        open={Boolean(reviewEvent)}
        onOpenChange={(open) => {
          if (!open) setReviewEvent(null);
        }}
      >
        {reviewEvent && (
          <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-medium">
                Thẩm định Kế hoạch Sự kiện
              </DialogTitle>
              <DialogDescription>
                Rà soát lịch trình, quyền lợi và biểu mẫu đăng ký trước khi phê duyệt xuất bản hoặc trả về chỉnh sửa.
              </DialogDescription>
            </DialogHeader>

            <div className="divide-y divide-border rounded-xl border border-border text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground">Tên sự kiện</span>
                <span className="font-medium text-foreground">{reviewEvent.title}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground">Phạm vi &amp; Sức chứa</span>
                <span className="tabular-mono text-xs text-foreground">
                  {reviewEvent.scope === "FACULTY" ? "Công khai Toàn Khoa" : "Nội bộ Ban / CTV"} ·{" "}
                  {reviewEvent.capacity === 0
                    ? "Không giới hạn"
                    : `${reviewEvent.capacity} ${reviewEvent.isTeamCompetition ? "đội" : "người"}`}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground">Quyền lợi</span>
                <div className="flex flex-wrap gap-1.5">
                  {reviewEvent.benefits.length > 0 ? (
                    reviewEvent.benefits.map((b) => (
                      <Badge key={b} variant="success">
                        {b}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="calDept">Không gắn quyền lợi</Badge>
                  )}
                </div>
              </div>
              <div className="space-y-2 px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Lịch trình &amp; Hoạt động theo buổi ({reviewEvent.sessions.length} buổi)
                </span>
                <ul className="space-y-2 text-xs">
                  {reviewEvent.sessions.map((s) => (
                    <li key={s.id} className="space-y-1 rounded-lg bg-muted/35 p-2.5 text-foreground">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>
                          <strong>{s.name}</strong> · <span className="tabular-mono">{s.timeRange}</span> · {s.location}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-5">
                        {s.activities.liveQa && <Badge variant="info">Live Q&amp;A</Badge>}
                        {s.activities.liveVoting && (
                          <Badge variant="default">
                            Live Voting{s.activities.liveVotingSecret ? " (Phiếu kín)" : ""}
                          </Badge>
                        )}
                        {s.activities.quizExam && (
                          <Badge variant="calExam">
                            Thi trắc nghiệm ({s.activities.quizMinutes ?? 20}p)
                          </Badge>
                        )}
                        {s.activities.minigame && <Badge variant="calArts">Minigame</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground">Biểu mẫu đăng ký</span>
                <span className="text-xs text-foreground">
                  {reviewEvent.formMode === "CUSTOM_FORM" && reviewEvent.formFields.length > 0
                    ? `Biểu mẫu tùy chỉnh (${reviewEvent.formFields.length} câu hỏi)`
                    : "Đăng ký 1 chạm (tự lấy hồ sơ YITZone)"}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground">Vị trí tuyển BTC</span>
                <span className="text-xs text-foreground">
                  {reviewEvent.btcRoles.join(", ") || "Không tuyển thêm"}
                </span>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="rounded-full text-status-danger hover:text-status-danger"
                onClick={() => {
                  const target = reviewEvent;
                  setReviewEvent(null);
                  setAuditTarget({
                    title: "Trả về Yêu cầu Chỉnh sửa Kế hoạch",
                    description:
                      "Sự kiện sẽ chuyển về trạng thái Bản nháp kèm ghi chú lý do để Ban Tổ chức cập nhật lại.",
                    summary: `${target.title} (${target.id})`,
                    code: "EVENT_REVISION_REQUESTED",
                    destructive: true,
                    confirmLabel: "Trả về & Ghi Audit Log",
                    onDone: (reason) => {
                      requestRevision(target.id, reason);
                      setNotice(`Đã trả về kế hoạch "${target.title}" để BTC chỉnh sửa theo góp ý.`);
                    }
                  });
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Yêu cầu chỉnh sửa</span>
              </Button>

              <Button
                type="button"
                className="rounded-full px-5"
                onClick={() => {
                  const target = reviewEvent;
                  setReviewEvent(null);
                  setAuditTarget({
                    title:
                      target.benefits.length === 0 && target.scope === "DEPT_INTERNAL"
                        ? "Trưởng Ban Phê duyệt Công bố Sự kiện Nội bộ"
                        : "Ban Thường vụ Phê duyệt Xuất bản Sự kiện",
                    description:
                      "Sau khi phê duyệt, sự kiện sẽ hiển thị trên Cổng Sự kiện và mở cổng đăng ký cho sinh viên.",
                    summary: `${target.title} (${target.id})`,
                    code: "EVENT_PUBLISH_APPROVED",
                    destructive: false,
                    confirmLabel: "Phê duyệt xuất bản & Ghi Audit Log",
                    onDone: () => {
                      approveEvent(target.id);
                      setNotice(
                        target.benefits.length === 0 && target.scope === "DEPT_INTERNAL"
                          ? `Trưởng Ban đã phê duyệt công bố sự kiện nội bộ "${target.title}".`
                          : `Ban Thường vụ (BTV) đã phê duyệt xuất bản "${target.title}".`
                      );
                    }
                  });
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Phê duyệt xuất bản</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <AuditActionDialog
        open={Boolean(auditTarget)}
        onOpenChange={(open) => {
          if (!open) setAuditTarget(null);
        }}
        title={auditTarget?.title ?? ""}
        description={
          auditTarget?.description ??
          "Thao tác quản trị sự kiện quan trọng bắt buộc nhập lý do và ghi vào Audit Log."
        }
        targetSummary={auditTarget?.summary ?? ""}
        actionCode={auditTarget?.code ?? "EVENT_AUDIT"}
        destructive={auditTarget?.destructive ?? true}
        confirmLabel={auditTarget?.confirmLabel ?? "Xác nhận & Ghi Audit Log"}
        onConfirm={(reason) => {
          auditTarget?.onDone(reason);
        }}
      />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="h-4 w-4 shrink-0 text-status-warning" />
        <span>
          Chỉ Ban Thường vụ (BTV) mới có quyền phê duyệt sự kiện cấp Khoa hoặc sự kiện gắn quyền lợi ĐRL / CTXH / CĐDN.
        </span>
      </div>
    </div>
  );
}
