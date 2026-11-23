import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
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

interface AudienceQuestion {
  id: string;
  content: string;
  authorDisplay: string;
  anonymous: boolean;
  upvotes: number;
  upvotedByMe: boolean;
  answered: boolean;
  pinned?: boolean;
  createdOrder: number;
}

const BANNED_WORDS = ["spam", "lừa đảo", "vô học"];

const INITIAL_QUESTIONS: AudienceQuestion[] = [
  {
    id: "q-1",
    content: "Sinh viên chuyển ngành vào Khoa CNTT nhưng giữ MSSV cũ có được ghi nhận chuẩn CĐDN không?",
    authorDisplay: "Sinh viên Khoa CNTT (Ẩn danh)",
    anonymous: true,
    upvotes: 42,
    upvotedByMe: true,
    answered: false,
    pinned: true,
    createdOrder: 1
  },
  {
    id: "q-2",
    content: "Lộ trình thực tập Java/React kỳ Xuân 2027 có yêu cầu tối thiểu bao nhiêu tín chỉ tích lũy ạ?",
    authorDisplay: "Nguyễn Hoàng Nam · K23 CNTT",
    anonymous: false,
    upvotes: 29,
    upvotedByMe: false,
    answered: false,
    createdOrder: 2
  },
  {
    id: "q-3",
    content: "Sau khi kết thúc hội thảo bao lâu thì E-Certificate xuất hiện trên trang /certificates?",
    authorDisplay: "Trần Thị Minh Anh · K23 KTDL",
    anonymous: false,
    upvotes: 18,
    upvotedByMe: false,
    answered: true,
    createdOrder: 3
  }
];

export function LiveQaAudiencePage(){
  const { pin } = useParams<{ pin: string }>();
  const [questions, setQuestions] = useState<AudienceQuestion[]>(INITIAL_QUESTIONS);
  const [sortBy, setSortBy] = useState<"TOP" | "NEWEST">("TOP");
  const [draft, setDraft] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...questions].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (sortBy === "TOP") return b.upvotes - a.upvotes;
      return b.createdOrder - a.createdOrder;
    });
  }, [questions, sortBy]);

  const handleUpvote = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
...q,
              upvotedByMe: !q.upvotedByMe,
              upvotes: q.upvotedByMe ? q.upvotes - 1: q.upvotes + 1
            }
: q
      )
    );
  };

  const handleSubmit = () => {
    const trimmed = draft.trim();
    setErrorMsg(null);
    if (trimmed.length < 10) {
      setErrorMsg("Vui lòng nhập câu hỏi rõ ràng (tối thiểu 10 ký tự).");
      return;
    }
    const foundBanned = BANNED_WORDS.find((w) => trimmed.toLowerCase().includes(w));
    if (foundBanned) {
      setErrorMsg(
        `Câu hỏi bị từ chối bởi Bộ lọc Từ ngữ Nhạy cảm (chứa từ khóa "${foundBanned}"). Vui lòng diễn đạt lịch sự.`
      );
      return;
    }

    setQuestions((prev) => [
      {
        id: `q-${Date.now()}`,
        content: trimmed,
        authorDisplay: anonymous ? "Sinh viên Khoa CNTT (Ẩn danh)": "Nguyễn Minh Khôi · K22 CNTT",
        anonymous,
        upvotes: 1,
        upvotedByMe: true,
        answered: false,
        createdOrder: prev.length + 1
      },
...prev
    ]);
    setDraft("");
    setNotice("Đã gửi câu hỏi lên tường Live Q&A (Giới hạn tốc độ: tối đa 2 câu / 5 phút).");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info" className="tabular-mono">
              PIN: {pin ?? "482 910"}
            </Badge>
            <Badge variant="success">Đang mở nhận câu hỏi</Badge>
          </div>
          <h1 className="mt-2 font-display text-2xl font-medium text-foreground sm:text-3xl">
            Bức tường Hỏi – Đáp Hội trường (Live Q&amp;A)
          </h1>
          <p className="text-sm text-muted-foreground">
            Đặt câu hỏi trực tiếp cho diễn giả và bình chọn (Upvote) các câu hỏi bạn quan tâm nhất.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link to="/stage/qa">
            <MonitorPlay className="h-4 w-4" />
            <span>Màn hình LED</span>
          </Link>
        </Button>
      </div>

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
        <span className="text-xs font-semibold text-muted-foreground tabular-mono">
          {questions.length} câu hỏi đang hiển thị
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
      <div className="space-y-3">
        {sorted.map((q) => (
          <div
            key={q.id}
            className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition-colors ${
              q.pinned ? "border-primary/45 bg-primary/[0.04]": "border-border bg-card"
            }`}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {q.pinned && <Badge variant="default">Đang chiếu LED</Badge>}
                {q.answered && <Badge variant="success">Đã giải đáp</Badge>}
                <span className="text-xs text-muted-foreground">{q.authorDisplay}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed text-foreground">{q.content}</p>
            </div>

            <button
              type="button"
              onClick={() => handleUpvote(q.id)}
              aria-label={`Ủng hộ câu hỏi (${q.upvotes})`}
              className={`flex shrink-0 flex-col items-center justify-center rounded-xl border px-3 py-2 transition-colors ${
                q.upvotedByMe
                  ? "border-primary bg-primary/12 text-primary"
: "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="mt-1 tabular-mono text-xs font-semibold">{q.upvotes}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
