import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/api-client";

/**
 * Extracts data payload from a single SSE line per W3C Server-Sent Events specification:
 * removes only the single optional leading U+0020 SPACE after "data:", preserving token whitespace.
 */
function parseSseDataLine(rawLine: string): string | null {
  const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
  if (!line.startsWith("data:")) {
    return null;
  }
  return line.startsWith("data: ") ? line.slice(6) : line.slice(5);
}

export function YitBotPage() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [streaming, setStreaming] = useState(false);
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

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStreaming(true);
    setReply("");

    try {
      const headers = getAuthHeaders({
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      });

      // POST-only SSE stream avoids leaking prompt PII and JWT token in URL query strings (ISS-09)
      const response = await fetch("/api/v1/chatbot/stream", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: prompt.trim() }),
        signal: controller.signal
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            setReply((prev) => prev + data);
          }
        }
      }
      setStreaming(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setStreaming(false);
      setReply("Không kết nối được luồng SSE `POST /api/v1/chatbot/stream` (cần đăng nhập hoặc khởi chạy yitzone-server).");
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">YITBot — Trợ lý Quy chế &amp; Học thuật (SSE)</h1>
      <Card>
        <CardHeader>
          <CardTitle>Hỏi đáp RAG có Khử Định danh PII</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={(e) => void handleAsk(e)} className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Hỏi về quy chế ĐRL, CTXH, SV5T hoặc sự kiện khoa..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            {streaming ? (
              <Button type="button" variant="outline" onClick={handleStopStream}>
                <Square className="h-4 w-4" />
                Dừng
              </Button>
            ) : (
              <Button type="submit">
                <Send className="h-4 w-4" />
                Gửi
              </Button>
            )}
          </form>

          {reply && (
            <div className="prose prose-sm max-w-none rounded-md border border-border bg-muted/40 p-4">
              <ReactMarkdown>{reply}</ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
