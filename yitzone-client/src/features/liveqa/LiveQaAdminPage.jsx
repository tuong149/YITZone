import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  GitMerge,
  MonitorOff,
  MonitorPlay,
  MoreHorizontal,
  Plus,
  Radio,
  RotateCcw,
  ShieldCheck,
  ThumbsUp,
  Trash2,
  X
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasAnyPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEventStore } from "@/stores/event-store";
import { DEFAULT_QA_SESSION, useLiveQaStore } from "@/stores/liveqa-store";

const UNMASK_PERMISSIONS = ["MOD_LIVEQA_UNMASK", "liveqa:unmask"];

function statusMeta(q) {
  if (q.onStage) return { label: "Đang chiếu LED", variant: "default" };
  if (q.status === "PENDING") return { label: "Chờ duyệt", variant: "warning" };
  if (q.status === "APPROVED") return { label: "Đã duyệt", variant: "secondary" };
  if (q.status === "ANSWERED") return { label: "Đã giải đáp", variant: "success" };
  return { label: "Đã ẩn", variant: "danger" };
}

export function LiveQaAdminPage({ embeddedEventId } = {}) {
  const [searchParams] = useSearchParams();
  const filterEventId = embeddedEventId ?? searchParams.get("eventId") ?? undefined;

  const authorities = useAuthStore((s) => s.authorities);
  const storedEvents = useEventStore((s) => s.events);
  const canUnmask = hasAnyPermission(authorities, UNMASK_PERMISSIONS);

  const questions = useLiveQaStore((s) => s.questions);
  const terms = useLiveQaStore((s) => s.terms);
  const selectedSessionId = useLiveQaStore((s) => s.activeSessionId);
  const setSelectedSessionId = useLiveQaStore((s) => s.setActiveSessionId);
  const setQuestions = useLiveQaStore((s) => s.setQuestions);
  const setTerms = useLiveQaStore((s) => s.setTerms);

  const sessionOptions = useMemo(() => {
    const derived = DEFAULT_QA_SESSION.id ? [DEFAULT_QA_SESSION] : [];
    for (const evt of storedEvents) {
      for (const ses of evt.sessions ?? []) {
        if (!ses.activities?.liveQa) continue;
        const id = `qa-${evt.id}-${ses.id}`;
        if (derived.some((s) => s.id === id)) continue;
        derived.push({
          id,
          eventId: evt.id,
          label: `${evt.title} · ${ses.name}`,
          pin: String(400000 + ((evt.id.length * 7919 + ses.id.length * 104729) % 599999))
        });
      }
    }
    return derived;
  }, [storedEvents]);

  useEffect(() => {
    if (!filterEventId) return;
    const match = sessionOptions.find((s) => s.eventId === filterEventId);
    if (match) {
      setSelectedSessionId(match.id);
    }
  }, [filterEventId, sessionOptions, setSelectedSessionId]);

  const [showHidden, setShowHidden] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [notice, setNotice] = useState(null);
  const [unmaskTarget, setUnmaskTarget] = useState(null);
  const [deleteWordTarget, setDeleteWordTarget] = useState(null);

  const activeSession =
    sessionOptions.find((s) => s.id === selectedSessionId) ??
    sessionOptions[0] ??
    DEFAULT_QA_SESSION;
  const activePinDigits = (activeSession?.pin ?? "").replace(/\D/g, "");
  const formattedActivePin =
    activePinDigits.length >= 6
      ? `${activePinDigits.slice(0, 3)} ${activePinDigits.slice(3, 6)}`
      : "Chưa cấp PIN";

  const sessionQuestions = useMemo(
    () =>
      activeSession?.id ? questions.filter((q) => q.sessionId === activeSession.id) : questions,
    [questions, activeSession?.id]
  );

  // 3-Column Moderation Queues (B3: Chờ duyệt -> Đã duyệt -> Đang chiếu / Đã giải đáp)
  const pendingCol = useMemo(
    () =>
      sessionQuestions
        .filter((q) => q.status === "PENDING")
        .sort((a, b) => b.upvoterIds.length - a.upvoterIds.length),
    [sessionQuestions]
  );

  const approvedCol = useMemo(
    () =>
      sessionQuestions
        .filter((q) => q.status === "APPROVED" && !q.onStage)
        .sort((a, b) => b.upvoterIds.length - a.upvoterIds.length),
    [sessionQuestions]
  );

  const stageAndAnsweredCol = useMemo(
    () =>
      sessionQuestions
        .filter((q) => q.onStage || q.status === "ANSWERED")
        .sort((a, b) => (a.onStage === b.onStage ? b.upvoterIds.length - a.upvoterIds.length : a.onStage ? -1 : 1)),
    [sessionQuestions]
  );

  const rejectedCol = useMemo(
    () => sessionQuestions.filter((q) => q.status === "REJECTED"),
    [sessionQuestions]
  );

  const mergeTargets = useMemo(
    () =>
      sessionQuestions.filter(
        (q) => q.onStage || q.status === "APPROVED"
      ),
    [sessionQuestions]
  );

  const handleSetStatus = (questionId, nextStatus, message) => {
    setQuestions((prev) =>
      prev.map((item) =>
        item.id === questionId
          ? {
              ...item,
              status: nextStatus,
              onStage: nextStatus === "APPROVED" ? item.onStage : false
            }
          : item
      )
    );
    setNotice(message);
  };

  const handlePinToStage = (questionId) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.sessionId !== activeSession.id) return item;
        // Strictly only allow APPROVED questions onto stage
        if (item.id === questionId && item.status !== "APPROVED") return item;
        return {
          ...item,
          onStage: item.id === questionId
        };
      })
    );
    setNotice("Đã chiếu câu hỏi lên Màn hình LED Sân khấu (/stage/qa).");
  };

  const handleClearStage = (questionId, markAnswered) => {
    setQuestions((prev) =>
      prev.map((item) =>
        item.id === questionId
          ? {
              ...item,
              onStage: false,
              status: markAnswered ? "ANSWERED" : item.status
            }
          : item
      )
    );
    setNotice(
      markAnswered
        ? "Đã đánh dấu câu hỏi là Đã giải đáp và gỡ khỏi màn hình LED."
        : "Đã gỡ câu hỏi khỏi màn hình LED về cột Đã duyệt."
    );
  };

  const handleMergeDuplicate = (sourceId, targetId) => {
    const src = questions.find((q) => q.id === sourceId);
    const dst = questions.find((q) => q.id === targetId);
    if (!src || !dst || src.id === dst.id) return;
    const unionUpvoters = Array.from(new Set([...dst.upvoterIds, ...src.upvoterIds]));
    setQuestions((prev) =>
      prev
        .filter((q) => q.id !== sourceId)
        .map((q) => (q.id === targetId ? { ...q, upvoterIds: unionUpvoters } : q))
    );
    setNotice(
      `Đã gộp câu trùng vào câu chính (tổng hợp không trùng người: ${unionUpvoters.length} lượt ủng hộ).`
    );
  };

  const handleAddTerm = (e) => {
    e.preventDefault();
    const cleaned = newWord.trim().toLowerCase();
    if (!cleaned) return;
    if (terms.some((t) => t.word === cleaned)) {
      setNotice(`Từ khóa "${cleaned}" đã có trong từ điển lọc.`);
      setNewWord("");
      return;
    }
    setTerms((prev) => [
      { id: `pf-${crypto.randomUUID().slice(0, 8)}`, word: cleaned, scope: "Live Q&A & Minigame", active: true },
      ...prev
    ]);
    setNotice(`Đã thêm từ khóa "${cleaned}" vào bộ lọc tức thì.`);
    setNewWord("");
  };

  const renderOverflowMenu = (q) => {
    const otherMergeTargets = mergeTargets.filter((t) => t.id !== q.id);
    const showMerge = q.status === "APPROVED" && !q.onStage && otherMergeTargets.length > 0;
    const showUnmask = canUnmask && q.anonymous && !q.unmasked;
    const showHideApproved = q.status === "APPROVED" && !q.onStage;

    if (!showMerge && !showUnmask && !showHideApproved) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Tùy chọn bổ sung"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          {showMerge &&
            otherMergeTargets.map((target) => (
              <DropdownMenuItem
                key={target.id}
                onSelect={() => handleMergeDuplicate(q.id, target.id)}
              >
                <GitMerge className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">
                  Gộp vào: &ldquo;{target.content.slice(0, 32)}…&rdquo;
                </span>
              </DropdownMenuItem>
            ))}
          {showHideApproved && (
            <DropdownMenuItem
              onSelect={() =>
                handleSetStatus(q.id, "REJECTED", "Đã chuyển câu hỏi sang mục Đã ẩn.")
              }
            >
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Ẩn câu hỏi này</span>
            </DropdownMenuItem>
          )}
          {showUnmask && (
            <DropdownMenuItem
              onSelect={() => setUnmaskTarget(q)}
              className="text-brand-crimson focus:text-brand-crimson"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Tra danh tính người gửi (Ghi Audit)</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderQuestionCard = (q) => {
    const meta = statusMeta(q);
    const primaryMergeTarget = mergeTargets.find((t) => t.id !== q.id) ?? null;

    return (
      <div
        key={q.id}
        className={cn(
          "space-y-3 rounded-xl border p-3.5 transition-colors",
          q.onStage
            ? "border-primary bg-primary/[0.05]"
            : "border-border bg-card"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <span className="tabular-mono inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <ThumbsUp className="h-3 w-3" />
              {q.upvoterIds.length}
            </span>
          </div>
          {renderOverflowMenu(q)}
        </div>

        <p className="text-sm font-medium leading-relaxed text-foreground">{q.content}</p>

        <div className="text-xs text-muted-foreground">
          {q.unmasked ? (
            <strong className="text-status-danger">Danh tính gốc: {q.realIdentity}</strong>
          ) : q.anonymous ? (
            "Sinh viên Khoa CNTT (Ẩn danh)"
          ) : (
            q.realIdentity
          )}
        </div>

        {/* Strictly context-bound actions per column */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2.5">
          {q.status === "PENDING" && (
            <>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  handleSetStatus(
                    q.id,
                    "APPROVED",
                    "Đã duyệt câu hỏi sang cột Đã duyệt (sẵn sàng chiếu LED)."
                  )
                }
              >
                <Check className="h-3.5 w-3.5" />
                <span>Duyệt</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-muted-foreground hover:text-status-danger"
                onClick={() =>
                  handleSetStatus(q.id, "REJECTED", "Đã ẩn câu hỏi khỏi tường khán giả.")
                }
              >
                <X className="h-3.5 w-3.5" />
                <span>Ẩn</span>
              </Button>
            </>
          )}

          {q.status === "APPROVED" && !q.onStage && (
            <>
              <Button type="button" size="sm" onClick={() => handlePinToStage(q.id)}>
                <MonitorPlay className="h-3.5 w-3.5" />
                <span>Chiếu LED</span>
              </Button>
              {primaryMergeTarget && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleMergeDuplicate(q.id, primaryMergeTarget.id)}
                >
                  <GitMerge className="h-3.5 w-3.5" />
                  <span>Gộp câu trùng</span>
                </Button>
              )}
            </>
          )}

          {q.onStage && (
            <>
              <Button type="button" size="sm" onClick={() => handleClearStage(q.id, true)}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đã giải đáp</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleClearStage(q.id, false)}
              >
                <MonitorOff className="h-3.5 w-3.5" />
                <span>Gỡ khỏi LED</span>
              </Button>
            </>
          )}

          {q.status === "ANSWERED" && !q.onStage && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handlePinToStage(q.id)}
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              <span>Chiếu lại LED</span>
            </Button>
          )}

          {q.status === "REJECTED" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                handleSetStatus(q.id, "PENDING", "Đã khôi phục câu hỏi về cột Chờ duyệt.")
              }
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Khôi phục về Chờ duyệt</span>
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      {!embeddedEventId && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-medium text-foreground">
              Điều phối Live Q&amp;A &amp; Bộ lọc Từ ngữ
            </h1>
            <p className="text-sm text-muted-foreground">
              Luồng kiểm duyệt 3 bước an toàn (Chờ duyệt → Đã duyệt → Đang chiếu / Đã giải đáp), chống chiếu nhầm câu hỏi chưa qua kiểm duyệt.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to={activePinDigits ? `/live-qa/${activePinDigits}` : "/live-qa"}>
                Tường Khán giả
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link
                to={
                  activeSession?.id
                    ? `/stage/qa?sessionId=${encodeURIComponent(activeSession.id)}`
                    : "/stage/qa"
                }
              >
                <MonitorPlay className="h-4 w-4" />
                <span>Chiếu LED 16:9</span>
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              disabled={!activeSession?.id}
              onClick={() =>
                setNotice(
                  `Đã xuất tổng kết Live Q&A (${activeSession.label || "Phiên hiện tại"}) kèm trạng thái giải đáp và lượt ủng hộ.`
                )
              }
            >
              <Download className="h-4 w-4" />
              <span>Xuất Tổng kết</span>
            </Button>
          </div>
        </div>
      )}

      {/* Session Context Strip */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Radio className="h-3.5 w-3.5 text-brand-cyan" />
            Phiên Q&amp;A:
          </span>
          {sessionOptions.length > 0 ? (
            <Select value={activeSession.id} onValueChange={setSelectedSessionId}>
              <SelectTrigger className="h-9 max-w-md rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sessionOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label || "Phiên Live Q&A"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-muted-foreground">
              Chưa có phiên Live Q&amp;A nào được tạo trong sự kiện
            </span>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Mã PIN phòng:</span>
          <Badge variant="outline" className="tabular-mono font-semibold text-foreground">
            {formattedActivePin}
          </Badge>
          {embeddedEventId && (
            <Button asChild variant="outline" size="sm" className="h-7 rounded-full text-xs">
              <Link
                to={
                  activeSession?.id
                    ? `/stage/qa?sessionId=${encodeURIComponent(activeSession.id)}`
                    : "/stage/qa"
                }
              >
                <MonitorPlay className="h-3.5 w-3.5" />
                <span>Mở LED Q&amp;A</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setNotice(null)}
            className="h-7 px-2.5 text-xs text-status-success hover:bg-status-success/15 hover:text-status-success"
          >
            Đóng
          </Button>
        </div>
      )}

      <Tabs defaultValue="moderate" className="min-h-[420px]">
        <TabsList className="justify-start">
          <TabsTrigger value="moderate">
            Bảng Điều phối MC ({sessionQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="profanity">
            Từ điển Lọc Từ ngữ ({terms.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: 3-Column MC Moderation Board */}
        <TabsContent value="moderate" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Column 1: PENDING */}
            <Card className="flex flex-col">
              <CardHeader className="border-b border-border/70 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">1. Chờ duyệt</CardTitle>
                  <Badge variant="warning" className="tabular-mono">
                    {pendingCol.length}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Câu hỏi mới từ khán giả — bắt buộc Duyệt trước khi có thể chiếu LED.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                {pendingCol.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Không có câu hỏi nào đang chờ duyệt.
                  </p>
                ) : (
                  pendingCol.map(renderQuestionCard)
                )}
              </CardContent>
            </Card>

            {/* Column 2: APPROVED */}
            <Card className="flex flex-col">
              <CardHeader className="border-b border-border/70 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">2. Đã duyệt (Sẵn sàng chiếu)</CardTitle>
                  <Badge variant="secondary" className="tabular-mono">
                    {approvedCol.length}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Đã kiểm duyệt nội dung — bấm &ldquo;Chiếu LED&rdquo; hoặc gộp câu trùng.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                {approvedCol.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Chưa có câu hỏi nào trong hàng chờ chiếu LED.
                  </p>
                ) : (
                  approvedCol.map(renderQuestionCard)
                )}
              </CardContent>
            </Card>

            {/* Column 3: ON STAGE / ANSWERED */}
            <Card className="flex flex-col">
              <CardHeader className="border-b border-border/70 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">3. Đang chiếu / Đã giải đáp</CardTitle>
                  <Badge variant="success" className="tabular-mono">
                    {stageAndAnsweredCol.length}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Câu hỏi đang hiển thị trên màn hình LED 16:9 hoặc đã được diễn giả trả lời.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-4">
                {stageAndAnsweredCol.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    Chưa có câu hỏi nào đang chiếu hoặc đã giải đáp.
                  </p>
                ) : (
                  stageAndAnsweredCol.map(renderQuestionCard)
                )}
              </CardContent>
            </Card>
          </div>

          {/* Collapsible Rejected/Hidden Questions */}
          {rejectedCol.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Câu hỏi đã ẩn / từ chối ({rejectedCol.length})
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setShowHidden((v) => !v)}
                >
                  {showHidden ? "Thu gọn" : "Xem danh sách đã ẩn"}
                </Button>
              </div>
              {showHidden && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {rejectedCol.map(renderQuestionCard)}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Shared Profanity Dictionary */}
        <TabsContent value="profanity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Danh mục Từ ngữ Nhạy cảm Dùng chung</span>
              </CardTitle>
              <CardDescription>
                Áp dụng tức thì cho cả Live Q&amp;A Hội trường và chế độ Khách mời Minigame mà không cần khởi động lại hệ thống.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddTerm} className="flex gap-2">
                <Input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Nhập từ khóa cần chặn..."
                  aria-label="Từ khóa cần chặn"
                />
                <Button type="submit" disabled={!newWord.trim()}>
                  <Plus className="h-4 w-4" />
                  <span>Thêm từ khóa</span>
                </Button>
              </form>

              {terms.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/25 px-4 py-8 text-center text-xs text-muted-foreground">
                  Chưa có từ khóa nào trong từ điển lọc từ ngữ nhạy cảm.
                </div>
              ) : (
                <div className="space-y-2">
                  {terms.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="tabular-mono text-sm font-semibold text-foreground">{t.word}</span>
                      <Badge variant={t.active ? "success" : "secondary"}>
                        {t.active ? "Đang chặn" : "Tạm tắt"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setTerms((prev) =>
                            prev.map((item) =>
                              item.id === t.id ? { ...item, active: !item.active } : item
                            )
                          )
                        }
                      >
                        {t.active ? "Tạm tắt" : "Bật lại"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Xóa từ khóa ${t.word}`}
                        className="text-brand-crimson hover:bg-brand-crimson/10"
                        onClick={() => setDeleteWordTarget(t)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MOD_LIVEQA_UNMASK Audit Dialog */}
      <AuditActionDialog
        open={Boolean(unmaskTarget)}
        onOpenChange={(o) => !o && setUnmaskTarget(null)}
        title="Tra cứu Danh tính Câu hỏi Ẩn danh"
        description="Quyền đặc biệt chỉ cấp cho BTV / Trưởng BTC được ủy quyền. Mọi lượt tra cứu bắt buộc ghi lý do và lưu vào Audit Log bất biến."
        targetSummary={unmaskTarget ? `Câu hỏi: "${unmaskTarget.content.slice(0, 65)}..."` : ""}
        actionCode="LIVEQA_UNMASK_AUTHOR"
        confirmLabel="Tra cứu Danh tính & Ghi Audit Log"
        onConfirm={() => {
          if (!unmaskTarget) return;
          setQuestions((prev) =>
            prev.map((q) => (q.id === unmaskTarget.id ? { ...q, unmasked: true } : q))
          );
          setNotice(
            `Đã giải ẩn danh câu hỏi (${unmaskTarget.realIdentity}) và ghi Audit Log + thông báo BTV.`
          );
          setUnmaskTarget(null);
        }}
      />

      <AuditActionDialog
        open={Boolean(deleteWordTarget)}
        onOpenChange={(o) => !o && setDeleteWordTarget(null)}
        title="Xóa Từ khóa khỏi Từ điển Lọc"
        description="Từ khóa sẽ ngừng bị chặn trên Live Q&A và Minigame."
        targetSummary={deleteWordTarget ? `Từ khóa: "${deleteWordTarget.word}"` : ""}
        actionCode="PROFANITY_DICTIONARY_DELETE"
        onConfirm={() => {
          if (!deleteWordTarget) return;
          setTerms((prev) => prev.filter((x) => x.id !== deleteWordTarget.id));
          setNotice(`Đã xóa từ khóa "${deleteWordTarget.word}" khỏi bộ lọc và ghi Audit Log.`);
          setDeleteWordTarget(null);
        }}
      />
    </div>
  );
}
