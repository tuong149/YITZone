import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  EyeOff,
  MessageSquarePlus,
  MonitorPlay,
  Send,
  ShieldAlert,
  ThumbsUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { hasAnyPermission, PERMISSIONS } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { useEventStore } from "@/stores/event-store";
import { DEFAULT_QA_SESSION, useLiveQaStore } from "@/stores/liveqa-store";

export function LiveQaAudiencePage() {
  const { pin } = useParams();
  const authorities = useAuthStore((s) => s.authorities);
  const fullName = useAuthStore((s) => s.fullName) ?? "";
  const userId = useAuthStore((s) => s.userId) ?? "";
  const canControlStage = hasAnyPermission(authorities, PERMISSIONS.STAGE_CONTROL);

  const questions = useLiveQaStore((s) => s.questions);
  const activeSessionId = useLiveQaStore((s) => s.activeSessionId);
  const terms = useLiveQaStore((s) => s.terms);
  const submitAudienceQuestion = useLiveQaStore((s) => s.submitAudienceQuestion);
  const toggleUpvote = useLiveQaStore((s) => s.toggleUpvote);
  const events = useEventStore((s) => s.events);

  const [sortBy, setSortBy] = useState("TOP");
  const [draft, setDraft] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [notice, setNotice] = useState(null);

  const cleanPin = (pin ?? "").replace(/\D/g, "");
  const formattedPin =
    cleanPin.length === 6 ? `${cleanPin.slice(0, 3)} ${cleanPin.slice(3)}` : cleanPin || "Chưa có PIN";

  const matchedSession = useMemo(() => {
    if (!cleanPin) return null;
    const defaultDigits = (DEFAULT_QA_SESSION.pin ?? "").replace(/\D/g, "");
    if (defaultDigits && cleanPin === defaultDigits) {
      return DEFAULT_QA_SESSION;
    }
    for (const evt of events) {
      for (const ses of evt.sessions ?? []) {
        if (!ses.activities?.liveQa) continue;
        const derivedPin = String(
          400000 + ((evt.id.length * 7919 + ses.id.length * 104729) % 599999)
        );
        if (derivedPin === cleanPin) {
          return {
            id: `qa-${evt.id}-${ses.id}`,
            eventId: evt.id,
            label: `${evt.title} · ${ses.name}`,
            pin: derivedPin
          };
        }
      }
    }
    return null;
  }, [cleanPin, events]);

  const isKnownPin = Boolean(matchedSession);
  const targetSessionId = matchedSession?.id || activeSessionId || DEFAULT_QA_SESSION.id || "default-qa";

  // Audience wall only displays APPROVED or ANSWERED questions (never PENDING or REJECTED)
  const visibleQuestions = useMemo(
    () =>
      questions.filter(
        (q) =>
          (q.status === "APPROVED" || q.status === "ANSWERED") &&
          (!matchedSession?.id || q.sessionId === matchedSession.id)
      ),
    [questions, matchedSession?.id]
  );

  const sorted = useMemo(() => {
    return [...visibleQuestions].sort((a, b) => {
      if (a.onStage && !b.onStage) return -1;
      if (!a.onStage && b.onStage) return 1;
      if (sortBy === "TOP") return (b.upvoterIds?.length ?? 0) - (a.upvoterIds?.length ?? 0);
      return b.id.localeCompare(a.id);
    });
  }, [visibleQuestions, sortBy]);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    setErrorMsg(null);
    if (trimmed.length < 10) {
      setErrorMsg("Vui lòng nhập câu hỏi rõ ràng (tối thiểu 10 ký tự).");
      return;
    }
    const foundBanned = terms
      .filter((t) => t.active)
      .find((t) => trimmed.toLowerCase().includes(t.word.toLowerCase()));
    if (foundBanned) {
      setErrorMsg(
        `Câu hỏi bị từ chối bởi Bộ lọc Từ ngữ Nhạy cảm (chứa từ khóa "${foundBanned.word}"). Vui lòng diễn đạt lịch sự.`
      );
      return;
    }

    const authorDisplay = anonymous
      ? "Sinh viên Khoa CNTT (Ẩn danh)"
      : fullName
        ? `${fullName} · SV Khoa CNTT`
        : "Sinh viên Khoa CNTT";
    const realIdentity = [userId, fullName].filter(Boolean).join(" · ") || "Khán giả trực tuyến";

    submitAudienceQuestion({
      sessionId: targetSessionId,
      content: trimmed,
      anonymous,
      authorDisplay,
      realIdentity
    });
    setDraft("");
    setNotice(
      "Đã gửi câu hỏi tới Bàn Kiểm duyệt Live Q&A. Câu hỏi sẽ xuất hiện trên tường ngay sau khi được duyệt."
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-7 rounded-full px-2.5 text-xs">
              <Link to="/live-qa">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Đổi mã PIN</span>
              </Link>
            </Button>
            <Badge variant="info" className="tabular-mono">
              PIN: {formattedPin}
            </Badge>
            <Badge variant={isKnownPin ? "success" : "warning"}>
              {isKnownPin ? "Đang mở nhận câu hỏi" : "Mã PIN chưa xác thực"}
            </Badge>
          </div>
          <h1 className="mt-2 font-display text-2xl font-medium text-foreground sm:text-3xl">
            {matchedSession?.label || DEFAULT_QA_SESSION.label || "Tường Hỏi - Đáp Trực tiếp (Live Q&A)"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Đặt câu hỏi trực tiếp cho diễn giả và bình chọn (Upvote) các câu hỏi bạn quan tâm nhất.
          </p>
        </div>

        {canControlStage && (
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/stage/live-qa">
              <MonitorPlay className="h-4 w-4" />
              <span>Màn hình LED</span>
            </Link>
          </Button>
        )}
      </div>

      {!isKnownPin && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-xs text-status-warning sm:flex-row sm:items-center">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">
                Không tìm thấy phiên hỏi đáp khớp với mã PIN &ldquo;{pin}&rdquo;
              </div>
              <p className="mt-0.5 text-foreground/80">
                Bạn đang xem phiên hỏi đáp mặc định. Vui lòng kiểm tra lại 6 chữ số trên màn chiếu LED hội trường.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 rounded-full">
            <Link to="/live-qa">Nhập lại PIN</Link>
          </Button>
        </div>
      )}

      {/* Ask Composer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquarePlus className="h-4 w-4 text-primary" />
            <span>Đặt câu hỏi cho Diễn giả</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={3}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Nhập câu hỏi của bạn cho phiên tọa đàm..."
          />

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs font-medium text-status-danger">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {notice && (
            <div className="flex items-center gap-2 rounded-lg border border-status-success/30 bg-status-success/10 px-3 py-2 text-xs font-medium text-status-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Ẩn tên trên màn hình lớn (hiển thị &ldquo;Sinh viên Khoa CNTT (Ẩn danh)&rdquo;)</span>
            </label>

            <Button type="button" size="sm" onClick={handleSubmit}>
              <Send className="h-3.5 w-3.5" />
              <span>Gửi câu hỏi</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <span className="tabular-mono text-xs font-semibold text-muted-foreground">
          {sorted.length} câu hỏi đã duyệt hiển thị
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSortBy("TOP")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              sortBy === "TOP"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            Nhiều ủng hộ nhất
          </button>
          <button
            type="button"
            onClick={() => setSortBy("NEWEST")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              sortBy === "NEWEST"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            Mới nhất
          </button>
        </div>
      </div>

      {/* Question Feed */}
      {sorted.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-10 text-center text-sm text-muted-foreground">
            Chưa có câu hỏi nào được công bố trong phiên này. Hãy gửi câu hỏi đầu tiên cho diễn giả ở khung phía trên.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((q) => {
            const isPinned = q.onStage;
            const isAnswered = q.status === "ANSWERED";
            const voterKey = userId || "anon";
            const upvotedByMe = (q.upvoterIds ?? []).includes(voterKey);
            return (
              <div
                key={q.id}
                className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition-colors ${
                  isPinned ? "border-primary/45 bg-primary/[0.04]" : "border-border bg-card"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {isPinned && <Badge variant="default">Đang chiếu LED sân khấu</Badge>}
                    {isAnswered && <Badge variant="success">Đã giải đáp</Badge>}
                    <span className="text-xs text-muted-foreground">{q.authorDisplay}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-foreground">{q.content}</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleUpvote(q.id, voterKey)}
                  aria-label={`Ủng hộ câu hỏi (${q.upvoterIds?.length ?? 0})`}
                  className={`flex shrink-0 flex-col items-center justify-center rounded-xl border px-3 py-2 transition-colors ${
                    upvotedByMe
                      ? "border-primary bg-primary/12 text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="mt-1 tabular-mono text-xs font-semibold">
                    {q.upvoterIds?.length ?? 0}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
