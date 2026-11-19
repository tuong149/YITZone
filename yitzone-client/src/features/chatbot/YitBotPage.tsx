import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";

export function YitBotPage() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [streaming, setStreaming] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setStreaming(true);
    setReply("");

    try {
      const { accessToken } = useAuthStore.getState();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      };
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      // POST-only SSE stream avoids leaking prompt PII and JWT token in URL query strings (ISS-09)
      const response = await fetch("/api/v1/chatbot/stream", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: prompt.trim() })
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
          if (line.startsWith("data:")) {
            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              setStreaming(false);
              return;
            }
            setReply((prev) => prev + data);
          }
        }
      }
      setStreaming(false);
    } catch {
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
            <Button type="submit" disabled={streaming}>
              <Send className="h-4 w-4" />
              Gửi
            </Button>
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
