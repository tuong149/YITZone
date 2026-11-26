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
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  { label: "Điều kiện đạt Sinh viên 5 tốt cấp Khoa?", kind: "RAG" },
  { label: "Quyền lợi đã ghi nhận & đơn hàng của tôi", kind: "PERSONAL" },
  { label: "Gợi ý hướng giải bài OJ: Tìm đường đi ngắn nhất (Dijkstra)", kind: "OJ" },
  { label: "Lịch nghỉ Tết năm 2028 của Khoa CNTT?", kind: "UNKNOWN" }
];

function parseSseDataLine(rawLine) {
  const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
  if (!line.startsWith("data:")) return null;
  return line.startsWith("data: ") ? line.slice(6) : line.slice(5);
}

export function YitBotPage() {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      modeTag: "RAG Quy chế",
      content:
        "Xin chào! Mình là **YITBot** — Trợ lý Ảo Đoàn - Hội Khoa CNTT. Mình trả lời quy chế **có trích dẫn điều khoản được BTV duyệt**, tra cứu ĐRL/CTXH theo phiên cá nhân và gợi ý tư duy bài tập Online Judge."
    }
  ]);
  const [streaming, setStreaming] = useState(false);
  const [examLocked, setExamLocked] = useState(false);
  const [circuitBreaker, setCircuitBreaker] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleStopStream = () => {
    abortControllerRef.current?.abort();
    setStreaming(false);
  };

  const sendQuestion = async (rawText) => {
    const trimmed = rawText.trim();
    if (!trimmed || examLocked || streaming) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg = { id: `u-${Date.now()}`, role: "user", content: trimmed };
    const assistantId = `a-${Date.now() + 1}`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setPrompt("");
    setStreaming(true);

    try {
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

      if (!response.ok) {
        let serverDetail = "";
        try {
          const errPayload = await response.json();
          serverDetail = errPayload?.detail || errPayload?.message || "";
        } catch {
          // Ignore non-JSON error body
        }

        if (response.status === 423 || response.status === 403) {
          if (response.status === 423) setExamLocked(true);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    modeTag: "Tạm khóa Phiên thi / Contest",
                    content:
                      serverDetail ||
                      "Tài khoản của bạn hiện đang tham gia phiên làm bài Thi Trắc nghiệm hoặc Contest Online Judge. YITBot tạm khóa hỗ trợ cho tới khi bạn nộp bài."
                  }
                : m
            )
          );
          setStreaming(false);
          return;
        }

        if (response.status === 503) {
          setCircuitBreaker(true);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    modeTag: "Ngắt mạch Ngân sách AI",
                    noOfficialInfo: true,
                    content:
                      serverDetail ||
                      "Hệ thống YITBot AI hiện đang kích hoạt mạch ngắt ngân sách (Circuit Breaker). Vui lòng chuyển tiếp câu hỏi sang Hộp thư Ban Chấp hành để được hỗ trợ trực tiếp."
                  }
                : m
            )
          );
          setStreaming(false);
          return;
        }

        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("EMPTY_STREAM");
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
              prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
            );
          }
        }
      }
      setStreaming(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                noOfficialInfo: true,
                content:
                  "Không thể kết nối máy chủ YITBot AI lúc này. Vui lòng thử lại sau hoặc chuyển tiếp câu hỏi sang Hộp thư Ban Chấp hành."
              }
            : m
        )
      );
      setStreaming(false);
    }
  };

  const summaryForBch = messages
    .slice(-4)
    .map((m) => `${m.role === "user" ? "SV" : "YITBot"}: ${m.content.replace(/\n+/g, " ").slice(0, 140)}`)
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
              ) : (
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
                    msg.role === "user" ? "justify-end" : "justify-start"
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
                        ) : msg.modeTag === "Tra cứu Cá nhân" ? (
                          <UserCheck className="h-3.5 w-3.5" />
                        ) : (
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
                ) : (
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
                Chọn nhanh chủ đề quy chế, quyền lợi cá nhân hoặc gợi ý học thuật
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
