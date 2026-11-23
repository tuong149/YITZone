import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpenCheck,
  Bot,
  BotOff,
  Code2,
  ExternalLink,
  MessageSquareShare,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getAuthHeaders } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface Citation {
  docTitle: string;
  clause: string;
  effective: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  noOfficialInfo?: boolean;
  modeTag?: "RAG Quy chế" | "Tra cứu Cá nhân" | "Gợi ý OJ" | "FAQ Tĩnh (Circuit Breaker)";
}

const QUICK_PROMPTS = [
  { label: "Điều kiện đạt Sinh viên 5 tốt cấp Khoa?", kind: "RAG" as const },
  { label: "Quyền lợi đã ghi nhận & đơn hàng của tôi", kind: "PERSONAL" as const },
  { label: "Gợi ý hướng giải bài OJ: Tìm đường đi ngắn nhất (Dijkstra)", kind: "OJ" as const },
  { label: "Lịch nghỉ Tết năm 2028 của Khoa CNTT?", kind: "UNKNOWN" as const }
];

function parseSseDataLine(rawLine: string): string | null {
  const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1): rawLine;
  if (!line.startsWith("data:")) return null;
  return line.startsWith("data: ") ? line.slice(6): line.slice(5);
}

function buildLocalFallback(
  question: string,
  circuitBreakerOpen: boolean,
  inOjContest: boolean,
  userId: string | null
): Omit<ChatMessage, "id" | "role"> {
  if (circuitBreakerOpen) {
    return {
      modeTag: "FAQ Tĩnh (Circuit Breaker)",
      content:
        "Ngân sách AI tháng hiện đã chạm ngưỡng trần — hệ thống tự động chuyển sang **Chế độ FAQ Tĩnh**:\n\n- **Quy chế SV5T:** Đạt đủ 5 tiêu chí (*Đạo đức, Học tập, Thể lực, Tình nguyện, Hội nhập*), không vi phạm kỷ luật.\n- **Điểm danh 48h:** Mọi khiếu nại điểm danh gửi trong vòng 48 giờ sau sự kiện.\n\nNếu cần giải đáp chuyên sâu hơn, vui lòng chuyển tiếp trực tiếp đến Ban Chấp hành.",
      citations: [{ docTitle: "Kho FAQ Tĩnh Đoàn - Hội FIT", clause: "Mục 1–4", effective: "Đang hiệu lực" }]
    };
  }

  const lower = question.toLowerCase();

  if (lower.includes("oj") || lower.includes("dijkstra") || lower.includes("thuật toán") || lower.includes("biên dịch")) {
    if (inOjContest) {
      return {
        modeTag: "Gợi ý OJ",
        content:
          "**Từ chối gợi ý:** Tài khoản của bạn đang tham gia một **Contest Online Judge** đang diễn ra. `YITBot` tạm khóa hỗ trợ thuật toán cho các bài thuộc Contest để đảm bảo công bằng."
      };
    }
    return {
      modeTag: "Gợi ý OJ",
      content:
        "Dưới đây là **gợi ý tư duy từng bước** (không in sẵn toàn bộ mã nguồn đáp án theo quy chế học thuật):\n\n1. Kiểm tra trọng số cạnh: đảm bảo mọi cạnh đều **không âm** trước khi áp dụng Dijkstra.\n2. Khởi tạo mảng `dist[v] = +∞`, riêng `dist[start] = 0` và đưa `(0, start)` vào `PriorityQueue` (Min-Heap).\n3. Khi lấy `(d, u)` từ hàng đợi, bỏ qua ngay nếu `d > dist[u]` để tránh duyệt lặp.\n4. Thử tự kiểm tra độ phức tạp `O((V + E) log V)` với test mẫu biên `N = 10^5`.",
      citations: [{ docTitle: "Hướng dẫn Luyện tập OJ FIT", clause: "Chế độ Gợi ý Sư phạm", effective: "" }]
    };
  }

  if (lower.includes("đrl") || lower.includes("ctxh") || lower.includes("quyền lợi") || lower.includes("đơn hàng") || lower.includes("của tôi")) {
    const identity = userId ?? "22110418";
    return {
      modeTag: "Tra cứu Cá nhân",
      content: `Kết quả tra cứu theo tài khoản đang đăng nhập (\`${identity}\`):\n\n- **Sự kiện đã ghi nhận quyền lợi (HK1 2026–2027):**\n  - *Hội thảo Cloud Native & DevOps 2026* — Đã cấp E-Cert · Nhãn quyền lợi: \`Cộng ĐRL\`, \`Cộng CĐDN\`\n  - *Ngày hội Tình nguyện Mùa Hè Xanh FIT* — Đã cấp E-Cert · Nhãn quyền lợi: \`Cộng CTXH\`\n- **Sự kiện sắp tới đã đăng ký:** *FIT Tech Talk: Distributed Systems* (Thứ 7, 08:30 · Hội trường A5)\n- **Đơn hàng Cửa hàng FIT:** \`#ORD-2026-084\` — Áo Khoa CNTT (Size L) · *Sẵn sàng nhận tại bàn trực Văn phòng OFIT*.`
    };
  }

  if (lower.includes("2028") || lower.includes("nghỉ tết")) {
    return {
      modeTag: "RAG Quy chế",
      noOfficialInfo: true,
      content:
        "**Chưa có thông tin chính thức** trong kho văn bản quy chế đã được BTV phê duyệt cho nội dung bạn vừa hỏi. Để tránh suy đoán sai lệch, vui lòng bấm **Nhắn tin trực tiếp với Ban Chấp hành** bên dưới để được cán bộ phản hồi chính xác."
    };
  }

  return {
    modeTag: "RAG Quy chế",
    content:
      "Theo quy chế xét chọn **Sinh viên 5 tốt cấp Khoa CNTT** đã được BTV phê duyệt:\n\n1. **Đạo đức tốt:** Điểm rèn luyện đạt từ **80 điểm** trở lên, không vi phạm kỷ luật.\n2. **Học tập tốt:** Điểm trung bình tích lũy năm học đạt từ **3.0/4.0** (hoặc có sản phẩm NCKH/giải học thuật).\n3. **Thể lực tốt:** Đạt danh hiệu *Thanh niên khỏe* hoặc hoàn thành cự ly giải chạy Khoa.\n4. **Tình nguyện tốt:** Tối thiểu **5 ngày** tình nguyện/năm học (đồng bộ tự động từ E-Cert YITZone).\n5. **Hội nhập tốt:** Đạt chuẩn ngoại ngữ theo niên khóa hoặc tham gia hoạt động giao lưu quốc tế.",
    citations: [
      { docTitle: "Quy chế Xét chọn SV5T Khoa CNTT (Số 12/QC-HSV)", clause: "Điều 4, Khoản 1–5", effective: "Hiệu lực 2026–2027" },
      { docTitle: "Hướng dẫn Nộp minh chứng E-Cert tự động", clause: "Mục 2.3", effective: "Hiệu lực 2026" }
    ]
  };
}

export function YitBotPage(){
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      modeTag: "RAG Quy chế",
      content:
        "Xin chào! Mình là **YITBot** — Trợ lý Ảo Đoàn - Hội Khoa CNTT. Mình trả lời quy chế **có trích dẫn điều khoản được BTV duyệt**, tra cứu ĐRL/CTXH theo phiên cá nhân và gợi ý tư duy bài tập Online Judge.",
      citations: [
        { docTitle: "Kho Quy chế Đoàn - Hội FIT (Đã duyệt BTV)", clause: "18 văn bản hiệu lực", effective: "Đã re-index" }
      ]
    }
  ]);
  const [streaming, setStreaming] = useState(false);
  const [examLocked, setExamLocked] = useState(false);
  const [circuitBreaker, setCircuitBreaker] = useState(false);
  const [inOjContest, setInOjContest] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleStopStream = () => {
    abortControllerRef.current?.abort();
    setStreaming(false);
  };

  const sendQuestion = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || examLocked || streaming) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: trimmed };
    const assistantId = `a-${Date.now() + 1}`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setPrompt("");
    setStreaming(true);

    try {
      if (circuitBreaker || inOjContest) {
        throw new Error("LOCAL_POLICY_SIMULATION");
      }
      const headers = getAuthHeaders({
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      });
      const response = await fetch("/api/v1/chatbot/stream", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal
      });
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const data = parseSseDataLine(line);
          if (data !== null) {
            if (data.trim() === "[DONE]") {
              setStreaming(false);
              return;
            }
            accumulated += data;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? {...m, content: accumulated }: m))
            );
          }
        }
      }
      setStreaming(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      const fallback = buildLocalFallback(trimmed, circuitBreaker, inOjContest, userId);
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? {...m,...fallback }: m))
      );
      setStreaming(false);
    }
  };

  const summaryForBch = messages
.slice(-4)
.map((m) => `${m.role === "user" ? "SV": "YITBot"}: ${m.content.replace(/\n+/g, " ").slice(0, 140)}`)
.join("\n");

  const handleConfirmEscalate = () => {
    setEscalateOpen(false);
    void navigate("/messenger", {
      state: {
        fromYitBot: true,
        prefillTitle: "Chuyển tiếp từ YITBot: Cần BCH giải đáp chi tiết",
        prefillSummary: summaryForBch
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Liquid Glass Top Container */}
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              YITBot — Trợ lý Ảo AI Đoàn - Hội
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Hỏi đáp RAG có trích dẫn nguồn văn bản BTV phê duyệt, khử định danh PII và tra cứu dữ liệu cá nhân theo phiên.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant="info" className="rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              Bảo vệ dữ liệu cá nhân (PII)
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setEscalateOpen(true)}
            >
              <MessageSquareShare className="h-4 w-4 text-primary" />
              <span>Nhắn trực tiếp BCH</span>
            </Button>
          </div>
        </div>

        {/* Simulation controls strip */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs">
          <span className="tabular-mono font-medium text-muted-foreground">
            Hạn mức hôm nay: <strong className="text-foreground">18 / 30 câu</strong>
          </span>
          {import.meta.env.DEV && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setExamLocked((v) => !v)}
                className={cn(
                  "rounded-full border px-3 py-1 font-medium transition-colors",
                  examLocked
                    ? "border-status-danger/40 bg-status-danger/10 text-status-danger"
                    : "border-border/80 bg-card/70 text-muted-foreground hover:text-foreground"
                )}
              >
                {examLocked ? "Đang khóa (Thi Trắc nghiệm)" : "Mô phỏng khóa khi Thi"}
              </button>
              <button
                type="button"
                onClick={() => setCircuitBreaker((v) => !v)}
                className={cn(
                  "rounded-full border px-3 py-1 font-medium transition-colors",
                  circuitBreaker
                    ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                    : "border-border/80 bg-card/70 text-muted-foreground hover:text-foreground"
                )}
              >
                {circuitBreaker ? "Circuit Breaker: FAQ Tĩnh" : "Mô phỏng vượt ngân sách"}
              </button>
              <button
                type="button"
                onClick={() => setInOjContest((v) => !v)}
                className={cn(
                  "rounded-full border px-3 py-1 font-medium transition-colors",
                  inOjContest
                    ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                    : "border-border/80 bg-card/70 text-muted-foreground hover:text-foreground"
                )}
              >
                {inOjContest ? "Đang thi Contest OJ" : "Mô phỏng Contest OJ"}
              </button>
            </div>
          )}
        </div>
      </section>

      {examLocked && (
        <div className="flex items-start gap-3 rounded-2xl border border-status-danger/35 bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
          <BotOff className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">YITBot đang tạm khóa cho tài khoản của bạn</div>
            <p className="mt-0.5 text-xs">
              Hệ thống ghi nhận bạn đang mở phiên làm bài Thi Trắc nghiệm. Trợ lý ảo sẽ tự động mở lại ngay khi nộp bài.
            </p>
          </div>
        </div>
      )}

      {circuitBreaker && !examLocked && (
        <div className="flex items-start gap-3 rounded-2xl border border-status-warning/35 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold">Mạch ngắt Ngân sách AI (Circuit Breaker) đang kích hoạt</div>
            <p className="mt-0.5 text-xs">
              Hệ thống đang trả lời bằng Kho FAQ Tĩnh được BTV duyệt để kiểm soát chi phí LLM tháng này.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="flex flex-col overflow-hidden rounded-[20px] lg:col-span-8">
          <CardHeader className="border-b border-border/80 px-5 py-3.5">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-cyan/15 text-brand-cyan">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span>Hội thoại Trợ lý Ảo</span>
              </CardTitle>
              {streaming ? (
                <Badge variant="info" className="animate-pulse rounded-full">
                  YITBot đang trả lời...
                </Badge>
              ): (
                <span className="tabular-mono text-xs text-muted-foreground">
                  {messages.length} tin nhắn
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col p-0">
            <div className="flex-1 min-h-[340px] max-h-[500px] space-y-5 overflow-y-auto px-5 py-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex items-start gap-3",
                    msg.role === "user" ? "justify-end": "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-cyan/12 text-brand-cyan">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[84%] space-y-2.5 px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "rounded-2xl rounded-tr-md bg-primary text-primary-foreground"
: "rounded-2xl rounded-tl-md bg-muted/55 text-foreground"
                    )}
                  >
                    {msg.role === "assistant" && msg.modeTag && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-cyan">
                        {msg.modeTag === "Gợi ý OJ" ? (
                          <Code2 className="h-3.5 w-3.5" />
                        ): msg.modeTag === "Tra cứu Cá nhân" ? (
                          <UserCheck className="h-3.5 w-3.5" />
                        ): (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        <span>{msg.modeTag}</span>
                      </div>
                    )}

                    <div className="prose prose-sm max-w-none dark:prose-invert [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                      <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                    </div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.citations.map((cit) => (
                          <span
                            key={`${cit.docTitle}-${cit.clause}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm"
                          >
                            <BookOpenCheck className="h-3 w-3 shrink-0 text-brand-cyan" />
                            <span>
                              {cit.docTitle} · {cit.clause}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    {msg.noOfficialInfo && (
                      <div className="pt-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => setEscalateOpen(true)}
                        >
                          <MessageSquareShare className="h-3.5 w-3.5" />
                          Chuyển tiếp sang Hộp thư BCH
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border/80 bg-muted/25 px-4 py-3.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendQuestion(prompt);
                }}
                className="flex items-center gap-2 rounded-full border border-input bg-card p-1.5 pl-4 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
              >
                <Input
                  value={prompt}
                  disabled={examLocked}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    examLocked
                      ? "YITBot đang bị khóa trong thời gian thi..."
: "Hỏi quy chế ĐRL, CTXH, SV5T, tra cứu cá nhân hoặc gợi ý bài OJ..."
                  }
                  className="h-9 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
                {streaming ? (
                  <Button type="button" variant="outline" size="sm" className="h-9 rounded-full px-4" onClick={handleStopStream}>
                    <Square className="h-3.5 w-3.5" />
                    <span>Dừng</span>
                  </Button>
                ): (
                  <Button
                    type="submit"
                    size="sm"
                    className="liquid-glass-btn-cobalt h-9 rounded-full px-4 disabled:opacity-45"
                    disabled={examLocked || !prompt.trim()}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Gửi</span>
                  </Button>
                )}
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-4">
          <div className="liquid-glass-card rounded-[20px] p-5 space-y-3">
            <div>
              <h2 className="font-display text-base font-medium text-foreground">Câu hỏi Gợi ý Nhanh</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Kiểm thử 4 luồng RAG, Cá nhân, OJ và Chống bịa đặt
              </p>
            </div>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  disabled={examLocked || streaming}
                  onClick={() => void sendQuestion(q.label)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-border/80 bg-card/85 px-3.5 py-2.5 text-left text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-card disabled:opacity-50"
                >
                  <span>{q.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

          <div className="liquid-glass-card rounded-[20px] p-5 space-y-3">
            <div>
              <h2 className="font-display text-base font-medium text-foreground">
                Cần Cán bộ Xử lý Trực tiếp?
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Chuyển ngữ cảnh sang Q&amp;A Messenger
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Hệ thống sẽ tự động đính kèm đoạn tóm tắt cuộc trò chuyện vừa rồi để Ban Chấp hành nắm bắt ngay.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full rounded-full"
              onClick={() => setEscalateOpen(true)}
            >
              <MessageSquareShare className="h-4 w-4" />
              Nhắn tin trực tiếp với Ban Chấp hành
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chuyển tiếp Cuộc trò chuyện sang Hộp thư BCH</DialogTitle>
            <DialogDescription>
              Một luồng Q&amp;A Messenger mới sẽ được gửi về Hộp thư Chung của BCH/BTV kèm bản tóm tắt ngữ cảnh bên dưới.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-muted/50 p-3 text-xs leading-relaxed text-foreground whitespace-pre-line">
            {summaryForBch}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEscalateOpen(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={handleConfirmEscalate}>
              Xác nhận &amp; Mở Q&amp;A Messenger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
