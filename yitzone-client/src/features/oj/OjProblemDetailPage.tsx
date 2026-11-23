import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BotOff,
  CheckCircle2,
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

type Verdict = "AC" | "WA" | "TLE" | "MLE" | "OLE" | "RE" | "CE";

interface Submission {
  id: string;
  time: string;
  lang: string;
  verdict: Verdict;
  runtimeMs: number;
  memoryMb: number;
  score: string;
}

const STARTER_CODE: Record<string, string> = {
  "C++20": `#include <bits/stdc++.h>
using namespace std;

int main {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    if (!(cin >> n >> m)) return 0;
    // Dijkstra O((V + E) log V)
    cout << 0 << "\\n";
    return 0;
}`,
  "Python 3": `import sys, heapq

def solve:
    data = sys.stdin.read().split
    if not data:
        return
    print(0)

if __name__ == "__main__":
    solve`,
  "Java 21": `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        System.out.println(0);
    }
}`,
  C: `#include <stdio.h>

int main(void) {
    printf("0\\n");
    return 0;
}`
};

const INITIAL_SUBMISSIONS: Submission[] = [
  { id: "SUB-8841", time: "21:14:08", lang: "C++20", verdict: "AC", runtimeMs: 84, memoryMb: 18.4, score: "100/100" },
  { id: "SUB-8832", time: "21:06:51", lang: "Python 3", verdict: "TLE", runtimeMs: 1000, memoryMb: 42.1, score: "60/100" }
];

export function OjProblemDetailPage(){
  const { id } = useParams();
  const problemId = (id ?? "fit-101").toUpperCase();
  const isContestProblem = problemId === "FIT-103";

  const [lang, setLang] = useState<string>("C++20");
  const [code, setCode] = useState<string>(STARTER_CODE["C++20"] ?? "");
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [judging, setJudging] = useState(false);
  const [sampleOutput, setSampleOutput] = useState<string | null>(null);

  const handleLanguageChange = (nextLang: string) => {
    setLang(nextLang);
    setCode(STARTER_CODE[nextLang] ?? "");
  };

  const handleRunSample = () => {
    setSampleOutput("Test mẫu #1: Output = 7 (Kỳ vọng: 7) · 12 ms · 4.2 MB · Hợp lệ");
  };

  const handleSubmit = () => {
    if (!code.trim() || judging) return;
    setJudging(true);
    window.setTimeout(() => {
      const verdict: Verdict = code.includes("while(true)") ? "TLE": "AC";
      const entry: Submission = {
        id: `SUB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        time: new Date().toLocaleTimeString("vi-VN"),
        lang,
        verdict,
        runtimeMs: verdict === "AC" ? 68: 1000,
        memoryMb: 16.2,
        score: verdict === "AC" ? "100/100": "0/100"
      };
      setSubmissions((prev) => [entry,...prev]);
      setJudging(false);
    }, 700);
  };

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
              <span className="tabular-mono text-primary">{problemId}</span>Đường đi ngắn nhất trên Mạng lưới Campus
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full tabular-mono">
            <Cpu className="h-3 w-3" />
            CPU 1.0s
          </Badge>
          <Badge variant="secondary" className="rounded-full tabular-mono">
            <HardDrive className="h-3 w-3" />
            RAM 256MB · OLE 16MB
          </Badge>
          {isContestProblem ? (
            <Badge variant="danger" className="rounded-full">
              <BotOff className="h-3.5 w-3.5" />
              YITBot khóa (Đang thi Contest)
            </Badge>
          ): (
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
            <CardDescription>Thực thi trong Sandbox cô lập không mạng · Hỗ trợ C, C++, Python, Java</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-foreground">
            <p>
              Cho đồ thị có hướng gồm <span className="tabular-mono font-semibold">N</span> tòa nhà học thuật (<span className="tabular-mono">1 ≤ N ≤ 10⁵</span>) và <span className="tabular-mono font-semibold">M</span> tuyến hành lang nối hai tòa nhà với thời gian di chuyển không âm <span className="tabular-mono">wᵢ</span>. Hãy tìm thời gian ngắn nhất để đi từ tòa nhà <strong>1</strong> đến tòa nhà <strong>N</strong>.
            </p>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Định dạng Input</div>
              <p className="text-xs text-muted-foreground">
                Dòng đầu chứa hai số nguyên <span className="tabular-mono">N, M</span>. <span className="tabular-mono">M</span> dòng tiếp theo mỗi dòng chứa <span className="tabular-mono">u, v, w</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="mb-1 text-[11px] font-semibold text-muted-foreground">Sample Input</div>
                <pre className="tabular-mono text-xs text-foreground">{`4 5\n1 2 2\n1 3 5\n2 3 1\n2 4 6\n3 4 4`}</pre>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <div className="mb-1 text-[11px] font-semibold text-muted-foreground">Sample Output</div>
                <pre className="tabular-mono text-xs text-foreground">{`7`}</pre>
              </div>
            </div>
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
                {sampleOutput && (
                  <div className="flex items-center gap-2 rounded-xl border border-status-success/35 bg-status-success/10 px-3.5 py-2 tabular-mono text-xs text-status-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{sampleOutput}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Terminal className="h-3.5 w-3.5" />
                    Sandbox cô lập · Tự cắt tiến trình nếu stdout &gt; 16MB (OLE)
                  </span>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={handleRunSample}>
                      <Play className="h-3.5 w-3.5" />
                      Chạy Test mẫu
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="liquid-glass-btn-cobalt rounded-full px-5"
                      onClick={handleSubmit}
                      disabled={judging}
                    >
                      <Send className="h-3.5 w-3.5" />
                      {judging ? "Đang chấm...": "Nộp bài"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="m-0 p-4 space-y-2.5">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="tabular-mono font-semibold text-foreground">{sub.id}</span>
                    <Badge
                      variant={sub.verdict === "AC" ? "success": sub.verdict === "TLE" ? "warning": "danger"}
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
              ))}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
