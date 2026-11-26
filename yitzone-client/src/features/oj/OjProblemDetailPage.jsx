import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BotOff,
  Code2,
  Cpu,
  HardDrive,
  Play,
  Send,
  Sparkles,
  Terminal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient, extractApiErrorMessage } from "@/lib/api-client";
import { useOjProblems } from "./api";

const STARTER_CODE = {
  "C++20": `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    return 0;
}`,
  "Python 3": `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return

if __name__ == "__main__":
    solve()`,
  "Java 21": `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
    }
}`,
  C: `#include <stdio.h>

int main(void) {
    return 0;
}`
};

const INITIAL_SUBMISSIONS = [];

export function OjProblemDetailPage() {
  const { id } = useParams();
  const { data: apiProblems, isLoading } = useOjProblems();

  const problem = useMemo(() => {
    if (!id || !apiProblems) return null;
    const lowered = id.toLowerCase();
    return (
      apiProblems.find(
        (p) =>
          String(p.id).toLowerCase() === lowered ||
          String(p.code ?? "").toLowerCase() === lowered
      ) ?? null
    );
  }, [apiProblems, id]);

  const [lang, setLang] = useState("C++20");
  const [code, setCode] = useState(STARTER_CODE["C++20"] ?? "");
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);
  const [judging, setJudging] = useState(false);
  const [runnerNotice, setRunnerNotice] = useState(null);

  const handleLanguageChange = (nextLang) => {
    setLang(nextLang);
    setCode(STARTER_CODE[nextLang] ?? "");
  };

  const handleRunSample = async () => {
    if (!problem || !code.trim() || judging) return;
    setRunnerNotice(null);
    setJudging(true);
    try {
      const res = await apiClient.post(
        `/oj/problems/${encodeURIComponent(problem.id)}/run-sample`,
        { language: lang, sourceCode: code }
      );
      setRunnerNotice(res.data?.data?.summary ?? "Đã chạy test mẫu trên máy chủ Sandbox.");
    } catch (err) {
      setRunnerNotice(
        extractApiErrorMessage(
          err,
          "Không thể kết nối cụm máy chấm Sandbox để chạy Test mẫu lúc này."
        )
      );
    } finally {
      setJudging(false);
    }
  };

  const handleSubmit = async () => {
    if (!problem || !code.trim() || judging) return;
    setRunnerNotice(null);
    setJudging(true);
    try {
      const res = await apiClient.post(
        `/oj/problems/${encodeURIComponent(problem.id)}/submissions`,
        { language: lang, sourceCode: code }
      );
      if (res.data?.data) {
        setSubmissions((prev) => [res.data.data, ...prev]);
      }
    } catch (err) {
      setRunnerNotice(
        extractApiErrorMessage(
          err,
          "Không thể gửi bài nộp tới máy chủ Online Judge lúc này. Vui lòng thử lại sau."
        )
      );
    } finally {
      setJudging(false);
    }
  };

  if (!problem) {
    return (
      <div className="space-y-5">
        <div>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/oj">
              <ArrowLeft className="h-4 w-4" />
              <span>Danh sách bài</span>
            </Link>
          </Button>
        </div>

        <Card className="rounded-[20px]">
          <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <Code2 className="h-10 w-10 text-muted-foreground/70" />
            <h1 className="mt-4 font-display text-xl font-medium text-foreground">
              {isLoading
                ? "Đang tải nội dung đề bài từ máy chủ..."
                : "Chưa tìm thấy đề bài trên máy chủ Online Judge"}
            </h1>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
              {isLoading
                ? "Vui lòng chờ giây lát trong khi hệ thống đồng bộ thông tin đề bài và bộ giới hạn Sandbox."
                : `Đề bài ${id ? `(${id}) ` : ""}hiện chưa được xuất bản hoặc chưa kết nối được với máy chủ Online Judge.`}
            </p>
            <div className="mt-5">
              <Button asChild size="sm" className="rounded-full">
                <Link to="/oj">Quay lại Kho Bài tập</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/oj">
              <ArrowLeft className="h-4 w-4" />
              <span>Danh sách bài</span>
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-medium text-foreground">
              {problem.code && (
                <span className="tabular-mono mr-2 text-primary">{problem.code}</span>
              )}
              <span>{problem.title}</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full tabular-mono">
            <Cpu className="h-3 w-3" />
            CPU {problem.cpuSec ?? 1.0}s
          </Badge>
          <Badge variant="secondary" className="rounded-full tabular-mono">
            <HardDrive className="h-3 w-3" />
            RAM {problem.ramMb ?? 256}MB · OLE 16MB
          </Badge>
          {problem.inActiveContest ? (
            <Badge variant="danger" className="rounded-full">
              <BotOff className="h-3.5 w-3.5" />
              YITBot khóa (Đang thi Contest)
            </Badge>
          ) : (
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link to="/yitbot">
                <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
                <span>Gợi ý tư duy YITBot</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Problem Specification */}
        <Card className="rounded-[20px] lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-lg">Đề bài Thuật toán</CardTitle>
            <CardDescription>
              Thực thi trong Sandbox cô lập không mạng · Hỗ trợ C, C++, Python, Java
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-foreground">
            <p className="whitespace-pre-line">
              {problem.statement ?? "Nội dung chi tiết đề bài được cung cấp trực tiếp từ máy chủ."}
            </p>

            {problem.inputSpec && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Định dạng Input
                </div>
                <p className="text-xs text-muted-foreground">{problem.inputSpec}</p>
              </div>
            )}

            {(problem.sampleInput || problem.sampleOutput) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
                    Sample Input
                  </div>
                  <pre className="tabular-mono text-xs text-foreground">
                    {problem.sampleInput ?? ""}
                  </pre>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <div className="mb-1 text-[11px] font-semibold text-muted-foreground">
                    Sample Output
                  </div>
                  <pre className="tabular-mono text-xs text-foreground">
                    {problem.sampleOutput ?? ""}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Code Editor & Verdict Panel */}
        <Card className="overflow-hidden rounded-[20px] lg:col-span-7">
          <Tabs defaultValue="editor">
            <CardHeader className="flex flex-col gap-3 border-b border-border/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="justify-start">
                <TabsTrigger value="editor">Trình soạn thảo Code</TabsTrigger>
                <TabsTrigger value="history">Lịch sử nộp ({submissions.length})</TabsTrigger>
              </TabsList>

              <div className="w-40">
                <Select value={lang} onValueChange={handleLanguageChange}>
                  <SelectTrigger aria-label="Chọn ngôn ngữ lập trình" className="h-9 rounded-full">
                    <SelectValue placeholder="Ngôn ngữ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C++20">C++20 (GCC)</SelectItem>
                    <SelectItem value="Python 3">Python 3.12</SelectItem>
                    <SelectItem value="Java 21">Java 21</SelectItem>
                    <SelectItem value="C">C17 (GCC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <TabsContent value="editor" className="m-0">
              <div className="bg-[#0E1529] p-4">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  rows={14}
                  aria-label="Trình soạn thảo mã nguồn"
                  className="w-full resize-y bg-transparent tabular-mono text-[13px] leading-relaxed text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-3 border-t border-border/80 bg-muted/25 px-4 py-3.5">
                {runnerNotice && (
                  <div className="flex items-center gap-2 rounded-xl border border-status-warning/35 bg-status-warning/10 px-3.5 py-2 text-xs text-status-warning">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{runnerNotice}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Terminal className="h-3.5 w-3.5" />
                    Sandbox cô lập · Tự cắt tiến trình nếu stdout &gt; 16MB (OLE)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={judging || !code.trim()}
                      onClick={() => void handleRunSample()}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Chạy Test mẫu
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="liquid-glass-btn-cobalt rounded-full px-5"
                      onClick={() => void handleSubmit()}
                      disabled={judging || !code.trim()}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {judging ? "Đang chấm..." : "Nộp bài"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="m-0 space-y-2.5 p-4">
              {submissions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/25 px-4 py-8 text-center text-xs text-muted-foreground">
                  Chưa có lịch sử nộp bài cho đề bài này.
                </div>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="tabular-mono font-semibold text-foreground">{sub.id}</span>
                      <Badge
                        variant={
                          sub.verdict === "AC"
                            ? "success"
                            : sub.verdict === "TLE"
                              ? "warning"
                              : "danger"
                        }
                        className="tabular-mono"
                      >
                        {sub.verdict}
                      </Badge>
                      <Badge variant="secondary">{sub.lang}</Badge>
                    </div>
                    <div className="flex items-center gap-4 tabular-mono text-muted-foreground">
                      <span>{sub.runtimeMs} ms</span>
                      <span>{sub.memoryMb} MB</span>
                      <span className="font-semibold text-foreground">{sub.score}</span>
                      <span>{sub.time}</span>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
