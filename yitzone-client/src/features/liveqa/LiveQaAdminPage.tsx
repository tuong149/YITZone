import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  Eye,
  GitMerge,
  MonitorPlay,
  Plus,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModQuestion {
  id: string;
  content: string;
  anonymous: boolean;
  realIdentity: string;
  upvoterIds: string[];
  status: "PENDING" | "APPROVED" | "ANSWERED";
  onStage: boolean;
  unmasked?: boolean;
}

interface ProfanityTerm {
  id: string;
  word: string;
  scope: "Live Q&A & Minigame";
  active: boolean;
}

const INITIAL_MOD_QUESTIONS: ModQuestion[] = [
  {
    id: "mq-1",
    content: "Sinh viên chuyển ngành vào Khoa CNTT nhưng giữ MSSV cũ có được ghi nhận chuẩn CĐDN không?",
    anonymous: true,
    realIdentity: "22146091 · Võ Thanh Tùng",
    upvoterIds: ["sv1", "sv2", "sv3", "sv4"],
    status: "APPROVED",
    onStage: true
  },
  {
    id: "mq-2",
    content: "Cho em hỏi chuyển ngành sang CNTT giữ mã số cũ thì có tính CĐDN không ạ?",
    anonymous: true,
    realIdentity: "23110218 · Nguyễn Hoàng Nam",
    upvoterIds: ["sv2", "sv5"], // Overlaps sv2 -> Union with mq-1 = 5 (not 6!)
    status: "APPROVED",
    onStage: false
  },
  {
    id: "mq-3",
    content: "Bình luận công kích cá nhân vi phạm nội quy hội trường (Ẩn danh)",
    anonymous: true,
    realIdentity: "23110999 · Trần Văn X (Đã ghi nhận)",
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

export function LiveQaAdminPage(){
  const [questions, setQuestions] = useState<ModQuestion[]>(INITIAL_MOD_QUESTIONS);
  const [terms, setTerms] = useState<ProfanityTerm[]>(INITIAL_PROFANITY);
  const [newWord, setNewWord] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [unmaskTarget, setUnmaskTarget] = useState<ModQuestion | null>(null);
  const [deleteWordTarget, setDeleteWordTarget] = useState<ProfanityTerm | null>(null);

  const handleMergeDuplicate = (sourceId: string, targetId: string) => {
    const src = questions.find((q) => q.id === sourceId);
    const dst = questions.find((q) => q.id === targetId);
    if (!src || !dst) return;
    const unionUpvoters = Array.from(new Set([...dst.upvoterIds,...src.upvoterIds]));
    setQuestions((prev) =>
      prev
.filter((q) => q.id !== sourceId)
.map((q) => (q.id === targetId ? {...q, upvoterIds: unionUpvoters }: q))
    );
    setNotice(
      `Đã gộp câu hỏi trùng bằng phép Hợp (Union Upvote): ${dst.upvoterIds.length} ∪ ${src.upvoterIds.length} = ${unionUpvoters.length} lượt ủng hộ (không tính trùng người).`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Điều phối Live Q&amp;A &amp; Từ điển Lọc Từ ngữ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Duyệt/ghim câu hỏi lên màn hình LED, gộp câu trùng lặp, tra cứu danh tính khi cần kiểm toán và quản lý phiên hỏi đáp
            Bộ từ điển nhạy cảm.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/live-qa/482910">Tường Khán giả</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/stage/qa">
              <MonitorPlay className="h-4 w-4" />
              <span>Chiếu LED 16:9</span>
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setNotice("Đã xuất tổng kết Live Q&A (Excel/PDF) kèm trạng thái giải đáp & lượt Upvote.")}
          >
            <Download className="h-4 w-4" />
            <span>Xuất Tổng kết</span>
          </Button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-semibold underline">
            Đóng
          </button>
        </div>
      )}

      <Tabs defaultValue="moderate" className="min-h-[460px]">
        <TabsList className="justify-start">
          <TabsTrigger value="moderate">Bảng Điều khiển MC ({questions.length})</TabsTrigger>
          <TabsTrigger value="profanity">CRUD Từ điển Từ ngữ Nhạy cảm ({terms.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="moderate" className="mt-4 space-y-3">
          {questions.map((q) => (
            <Card key={q.id} className={q.onStage ? "border-primary/50": undefined}>
              <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={q.onStage ? "default": q.status === "ANSWERED" ? "success": "warning"}>
                      {q.onStage ? "Đang chiếu LED": q.status === "ANSWERED" ? "Đã giải đáp": q.status}
                    </Badge>
                    <span className="tabular-mono text-xs font-semibold text-primary">
                      {q.upvoterIds.length} Upvote
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {q.unmasked ? (
                        <strong className="text-status-danger">Danh tính gốc: {q.realIdentity}</strong>
                      ): q.anonymous ? (
                        "Sinh viên Khoa CNTT (Ẩn danh)"
                      ): (
                        q.realIdentity
                      )}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{q.content}</p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {!q.onStage && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setQuestions((prev) =>
                          prev.map((item) => ({
...item,
                            onStage: item.id === q.id,
                            status: item.id === q.id ? "APPROVED": item.status
                          }))
                        );
                        setNotice("Đã đẩy câu hỏi lên Màn hình LED Sân khấu (/stage/qa).");
                      }}
                    >
                      Chiếu LED
                    </Button>
                  )}
                  {q.id === "mq-2" && questions.some((x) => x.id === "mq-1") && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleMergeDuplicate("mq-2", "mq-1")}
                    >
                      <GitMerge className="h-3.5 w-3.5" />
                      <span>Gộp trùng (Union)</span>
                    </Button>
                  )}
                  {q.anonymous && !q.unmasked && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-brand-crimson/40 text-brand-crimson hover:bg-brand-crimson/10"
                      onClick={() => setUnmaskTarget(q)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Tra danh tính (UNMASK)</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* UC-QA-05 Profanity Dictionary CRUD */}
        <TabsContent value="profanity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Bộ Từ điển Lọc Từ ngữ Nhạy cảm Dùng chung</span>
              </CardTitle>
              <CardDescription>
                Áp dụng tức thì cho cả Live Q&amp;A Hội trường và chế độ Khách mời Minigame mà không cần deploy lại.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="Nhập từ khóa cấm mới..."
                />
                <Button
                  type="button"
                  disabled={!newWord.trim()}
                  onClick={() => {
                    setTerms((prev) => [
                      { id: `pf-${Date.now()}`, word: newWord.trim().toLowerCase(), scope: "Live Q&A & Minigame", active: true },
...prev
                    ]);
                    setNotice(`Đã thêm từ khóa "${newWord.trim()}" vào Bộ lọc tức thì.`);
                    setNewWord("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm từ khóa</span>
                </Button>
              </div>

              <div className="space-y-2">
                {terms.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="tabular-mono text-sm font-semibold text-foreground">{t.word}</span>
                      <Badge variant={t.active ? "success": "secondary"}>
                        {t.active ? "Đang chặn": "Tạm tắt"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setTerms((prev) =>
                            prev.map((item) => (item.id === t.id ? {...item, active: !item.active }: item))
                          )
                        }
                      >
                        {t.active ? "Tạm tắt": "Bật lại"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
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
        description="Quyền đặc biệt chỉ cấp cho BTV / Trưởng BTC được ủy quyền (không cấp cho SystemAdmin). Mọi lượt tra cứu bắt buộc ghi lý do và lưu Audit Log."
        targetSummary={unmaskTarget ? `Câu hỏi: "${unmaskTarget.content.slice(0, 65)}..."`: ""}
        actionCode="LIVEQA_UNMASK_AUTHOR"
        confirmLabel="Tra cứu Danh tính & Ghi Audit Log"
        onConfirm={() => {
          if (!unmaskTarget) return;
          setQuestions((prev) =>
            prev.map((q) => (q.id === unmaskTarget.id ? {...q, unmasked: true }: q))
          );
          setNotice(`Đã giải ẩn danh câu hỏi (${unmaskTarget.realIdentity}) và ghi Audit Log + thông báo BTV.`);
          setUnmaskTarget(null);
        }}
      />

      <AuditActionDialog
        open={Boolean(deleteWordTarget)}
        onOpenChange={(o) => !o && setDeleteWordTarget(null)}
        title="Xóa Từ khóa khỏi Từ điển Lọc"
        description="Từ khóa sẽ ngừng bị chặn trên Live Q&A và Minigame."
        targetSummary={deleteWordTarget ? `Từ khóa: "${deleteWordTarget.word}"`: ""}
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
