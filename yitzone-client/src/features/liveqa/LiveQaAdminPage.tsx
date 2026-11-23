import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  GitMerge,
  MonitorOff,
  MonitorPlay,
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasAnyPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useEventStore } from "@/stores/event-store";

type QuestionStatus = "PENDING" | "APPROVED" | "ANSWERED" | "REJECTED";

interface ModQuestion {
  id: string;
  sessionId: string;
  content: string;
  anonymous: boolean;
  realIdentity: string;
  upvoterIds: string[];
  status: QuestionStatus;
  onStage: boolean;
  unmasked?: boolean;
}

interface ProfanityTerm {
  id: string;
  word: string;
  scope: "Live Q&A & Minigame";
  active: boolean;
}

interface QaSessionOption {
  id: string;
  label: string;
  pin: string;
}

const DEFAULT_SESSION: QaSessionOption = {
  id: "qa-cloud-2026",
  label: "Hội thảo Cloud Native & DevOps 2026 · Phiên Hỏi đáp",
  pin: "482910"
};

const INITIAL_MOD_QUESTIONS: ModQuestion[] = [
  {
    id: "mq-1",
    sessionId: DEFAULT_SESSION.id,
    content: "Sinh viên chuyển ngành vào Khoa CNTT nhưng giữ MSSV cũ có được ghi nhận chuẩn CĐDN không?",
    anonymous: true,
    realIdentity: "22146091 · Võ Thanh Tùng",
    upvoterIds: ["sv1", "sv2", "sv3", "sv4"],
    status: "APPROVED",
    onStage: true
  },
  {
    id: "mq-2",
    sessionId: DEFAULT_SESSION.id,
    content: "Cho em hỏi chuyển ngành sang CNTT giữ mã số cũ thì có tính CĐDN không ạ?",
    anonymous: true,
    realIdentity: "23110218 · Nguyễn Hoàng Nam",
    upvoterIds: ["sv2", "sv5"],
    status: "APPROVED",
    onStage: false
  },
  {
    id: "mq-3",
    sessionId: DEFAULT_SESSION.id,
    content: "Bình luận công kích cá nhân vi phạm nội quy hội trường",
    anonymous: true,
    realIdentity: "23110999 · Trần Văn X",
    upvoterIds: [],
    status: "PENDING",
    onStage: false
  }
];

const INITIAL_PROFANITY: ProfanityTerm[] = [
  { id: "pf-1", word: "lừa đảo", scope: "Live Q&A & Minigame", active: true },
  { id: "pf-2", word: "vô học", scope: "Live Q&A & Minigame", active: true },
  { id: "pf-3", word: "spam", scope: "Live Q&A & Minigame", active: true }
];

const UNMASK_PERMISSIONS = ["MOD_LIVEQA_UNMASK", "liveqa:unmask"] as const;

function statusMeta(q: ModQuestion): {
  label: string;
  variant: "default" | "success" | "warning" | "secondary" | "danger";
} {
  if (q.onStage) return { label: "Đang chiếu LED", variant: "default" };
  if (q.status === "PENDING") return { label: "Chờ duyệt", variant: "warning" };
  if (q.status === "APPROVED") return { label: "Đã duyệt", variant: "secondary" };
  if (q.status === "ANSWERED") return { label: "Đã giải đáp", variant: "success" };
  return { label: "Đã ẩn", variant: "danger" };
}

export function LiveQaAdminPage() {
  const authorities = useAuthStore((s) => s.authorities);
  const storedEvents = useEventStore((s) => s.events);
  const canUnmask = hasAnyPermission(authorities, UNMASK_PERMISSIONS);

  const sessionOptions = useMemo<QaSessionOption[]>(() => {
    const derived: QaSessionOption[] = [DEFAULT_SESSION];
    for (const evt of storedEvents) {
      for (const ses of evt.sessions) {
        if (!ses.activities.liveQa) continue;
        const id = `qa-${evt.id}-${ses.id}`;
        if (derived.some((s) => s.id === id)) continue;
        derived.push({
          id,
          label: `${evt.title} · ${ses.name}`,
          pin: String(400000 + ((evt.id.length * 7919 + ses.id.length * 104729) % 599999))
        });
      }
    }
    return derived;
  }, [storedEvents]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>(DEFAULT_SESSION.id);
  const [statusFilter, setStatusFilter] = useState<"ALL" | QuestionStatus>("ALL");
  const [questions, setQuestions] = useState<ModQuestion[]>(INITIAL_MOD_QUESTIONS);
  const [terms, setTerms] = useState<ProfanityTerm[]>(INITIAL_PROFANITY);
  const [newWord, setNewWord] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [unmaskTarget, setUnmaskTarget] = useState<ModQuestion | null>(null);
  const [deleteWordTarget, setDeleteWordTarget] = useState<ProfanityTerm | null>(null);

  const activeSession =
    sessionOptions.find((s) => s.id === selectedSessionId) ?? DEFAULT_SESSION;

  const sessionQuestions = useMemo(
    () => questions.filter((q) => q.sessionId === activeSession.id),
    [questions, activeSession.id]
  );

  const filteredQuestions = useMemo(() => {
    const list =
      statusFilter === "ALL"
        ? sessionQuestions
        : sessionQuestions.filter((q) => q.status === statusFilter);
    return [...list].sort((a, b) => {
      if (a.onStage !== b.onStage) return a.onStage ? -1 : 1;
      if (a.status === "PENDING" && b.status !== "PENDING") return -1;
      if (b.status === "PENDING" && a.status !== "PENDING") return 1;
      return b.upvoterIds.length - a.upvoterIds.length;
    });
  }, [sessionQuestions, statusFilter]);

  const counts = useMemo(
    () => ({
      all: sessionQuestions.length,
      pending: sessionQuestions.filter((q) => q.status === "PENDING").length,
      approved: sessionQuestions.filter((q) => q.status === "APPROVED").length,
      answered: sessionQuestions.filter((q) => q.status === "ANSWERED").length,
      rejected: sessionQuestions.filter((q) => q.status === "REJECTED").length
    }),
    [sessionQuestions]
  );

  const primaryStageOrTopApproved = useMemo(
    () =>
      sessionQuestions.find((q) => q.onStage) ??
      sessionQuestions.find((q) => q.status === "APPROVED") ??
      null,
    [sessionQuestions]
  );

  const handleSetStatus = (questionId: string, nextStatus: QuestionStatus, message: string) => {
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

  const handlePinToStage = (questionId: string) => {
    setQuestions((prev) =>
      prev.map((item) =>
        item.sessionId === activeSession.id
          ? {
              ...item,
              onStage: item.id === questionId
            }
          : item
      )
    );
    setNotice("Đã đẩy câu hỏi lên Màn hình LED Sân khấu (/stage/qa).");
  };

  const handleClearStage = (questionId: string, markAnswered: boolean) => {
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
        : "Đã gỡ câu hỏi khỏi màn hình LED."
    );
  };

  const handleMergeDuplicate = (sourceId: string, targetId: string) => {
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
      `Đã gộp câu hỏi trùng (hợp lượt ủng hộ không trùng người: ${dst.upvoterIds.length} ∪ ${src.upvoterIds.length} = ${unionUpvoters.length} lượt).`
    );
  };

  const handleAddTerm = (e: React.FormEvent) => {
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-medium text-foreground">
            Điều phối Live Q&amp;A &amp; Bộ lọc Từ ngữ
          </h1>
          <p className="text-sm text-muted-foreground">
            Kiểm duyệt câu hỏi hội trường, ghim câu hỏi lên LED 16:9, gộp câu trùng và quản lý bộ lọc từ ngữ nhạy cảm.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to={`/live-qa/${activeSession.pin}`}>Tường Khán giả</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/stage/qa">
              <MonitorPlay className="h-4 w-4" />
              <span>Chiếu LED 16:9</span>
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() =>
              setNotice(
                `Đã xuất tổng kết Live Q&A (${activeSession.label}) kèm trạng thái giải đáp và lượt ủng hộ.`
              )
            }
          >
            <Download className="h-4 w-4" />
            <span>Xuất Tổng kết</span>
          </Button>
        </div>
      </div>

      {/* Session Context Strip */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Radio className="h-3.5 w-3.5 text-brand-cyan" />
            Phiên Q&amp;A:
          </span>
          <Select value={activeSession.id} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="h-9 max-w-md rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sessionOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">Mã PIN phòng:</span>
          <Badge variant="outline" className="tabular-mono font-semibold text-foreground">
            {activeSession.pin.slice(0, 3)} {activeSession.pin.slice(3)}
          </Badge>
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
            Bảng Điều phối MC ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="profanity">
            Từ điển Lọc Từ ngữ ({terms.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: MC Moderation Queue */}
        <TabsContent value="moderate" className="mt-4 space-y-4">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "ALL", label: `Tất cả (${counts.all})` },
                { id: "PENDING", label: `Chờ duyệt (${counts.pending})` },
                { id: "APPROVED", label: `Đã duyệt (${counts.approved})` },
                { id: "ANSWERED", label: `Đã giải đáp (${counts.answered})` },
                { id: "REJECTED", label: `Đã ẩn (${counts.rejected})` }
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusFilter(pill.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === pill.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm font-medium text-foreground">
                  Chưa có câu hỏi nào trong mục này
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chia sẻ mã PIN <span className="tabular-mono font-semibold">{activeSession.pin}</span> hoặc mở màn hình LED để khán giả gửi câu hỏi.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => {
                const meta = statusMeta(q);
                const canMergeIntoPrimary =
                  q.status === "APPROVED" &&
                  !q.onStage &&
                  primaryStageOrTopApproved !== null &&
                  primaryStageOrTopApproved.id !== q.id;

                return (
                  <Card
                    key={q.id}
                    className={cn(
                      q.onStage && "border-primary/60",
                      q.status === "REJECTED" && "opacity-75"
                    )}
                  >
                    <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          <span className="tabular-mono inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            <ThumbsUp className="h-3 w-3" />
                            {q.upvoterIds.length} lượt ủng hộ
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {q.unmasked ? (
                              <strong className="text-status-danger">
                                Danh tính gốc: {q.realIdentity}
                              </strong>
                            ) : q.anonymous ? (
                              "Sinh viên Khoa CNTT (Ẩn danh)"
                            ) : (
                              q.realIdentity
                            )}
                          </span>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-foreground">
                          {q.content}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        {/* PENDING: Must approve or reject BEFORE it can ever go on LED */}
                        {q.status === "PENDING" && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                handleSetStatus(
                                  q.id,
                                  "APPROVED",
                                  "Đã duyệt câu hỏi vào hàng chờ chiếu LED."
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
                                handleSetStatus(
                                  q.id,
                                  "REJECTED",
                                  "Đã ẩn câu hỏi vi phạm khỏi tường khán giả."
                                )
                              }
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Từ chối</span>
                            </Button>
                          </>
                        )}

                        {/* APPROVED & NOT ON STAGE */}
                        {q.status === "APPROVED" && !q.onStage && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handlePinToStage(q.id)}
                            >
                              <MonitorPlay className="h-3.5 w-3.5" />
                              <span>Chiếu LED</span>
                            </Button>
                            {canMergeIntoPrimary && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleMergeDuplicate(q.id, primaryStageOrTopApproved.id)
                                }
                              >
                                <GitMerge className="h-3.5 w-3.5" />
                                <span>Gộp trùng</span>
                              </Button>
                            )}
                          </>
                        )}

                        {/* CURRENTLY ON STAGE */}
                        {q.onStage && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleClearStage(q.id, true)}
                            >
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
                              <span>Gỡ LED</span>
                            </Button>
                          </>
                        )}

                        {/* REJECTED: Allow restore */}
                        {q.status === "REJECTED" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleSetStatus(q.id, "PENDING", "Đã khôi phục câu hỏi về hàng Chờ duyệt.")
                            }
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Khôi phục</span>
                          </Button>
                        )}

                        {/* Unmask action: permission-gated & restrained styling to prevent misclicks */}
                        {canUnmask && q.anonymous && !q.unmasked && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:bg-brand-crimson/10 hover:text-brand-crimson"
                            onClick={() => setUnmaskTarget(q)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Tra danh tính</span>
                          </Button>
                        )}

                        {q.status === "APPROVED" && !q.onStage && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            aria-label="Ẩn câu hỏi"
                            className="text-muted-foreground hover:text-status-danger"
                            onClick={() =>
                              handleSetStatus(q.id, "REJECTED", "Đã ẩn câu hỏi khỏi danh sách.")
                            }
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Shared Profanity Dictionary */}
        <TabsContent value="profanity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Bộ Từ điển Lọc Từ ngữ Nhạy cảm Dùng chung</span>
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
