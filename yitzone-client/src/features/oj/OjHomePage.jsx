import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BotOff,
  CheckCircle2,
  Clock,
  Code2,
  Search,
  Sparkles,
  Terminal,
  Trophy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PROBLEMS = [
  {
    id: "fit-101",
    code: "FIT-101",
    title: "Đường đi ngắn nhất trên Mạng lưới Campus",
    difficulty: "Trung bình",
    tags: ["Graph", "Dijkstra"],
    acRate: "48.2%",
    solved: true
  },
  {
    id: "fit-102",
    code: "FIT-102",
    title: "Phân bổ Ca trực Văn phòng Tối ưu",
    difficulty: "Dễ",
    tags: ["Greedy", "Sorting"],
    acRate: "72.6%",
    solved: true
  },
  {
    id: "fit-103",
    code: "FIT-103",
    title: "Truy vấn Tổng đoạn Cây Phân đoạn (Segment Tree)",
    difficulty: "Khó",
    tags: ["Segment Tree", "Data Structures"],
    acRate: "24.1%",
    solved: false,
    inActiveContest: true
  },
  {
    id: "fit-104",
    code: "FIT-104",
    title: "Xếp lịch Tổ chức Sự kiện Không trùng giờ",
    difficulty: "Trung bình",
    tags: ["DP", "Binary Search"],
    acRate: "51.9%",
    solved: false
  }
];

const CONTESTS = [
  {
    id: "icpc-fit-2026",
    title: "ICPC FIT HCM-UTE Vòng Tuyển chọn 2026",
    rule: "ICPC",
    ruleDetail: "Chấm toàn bộ Testcase · Phạt 20p/lần sai · Đóng băng BXH 60p cuối",
    window: "21/11/2026 · 19:00 – 22:00",
    status: "LIVE",
    participants: 128,
    featuredProblemId: "fit-103"
  },
  {
    id: "ioi-practice-w11",
    title: "Luyện tập Thuật toán Tuần 11 (Quy hoạch động)",
    rule: "IOI",
    ruleDetail: "Chấm điểm từng phần theo nhóm Testcase · Không phạt thời gian",
    window: "24/11/2026 · 08:00 – 26/11/2026 · 22:00",
    status: "UPCOMING",
    participants: 84,
    featuredProblemId: "fit-104"
  }
];

export function OjHomePage(){
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("ALL");
  const [tagFilter, setTagFilter] = useState("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROBLEMS.filter((p) => {
      const matchQ =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      const matchDiff = difficulty === "ALL" || p.difficulty === difficulty;
      const matchTag = tagFilter === "ALL" || p.tags.includes(tagFilter);
      return matchQ && matchDiff && matchTag;
    });
  }, [query, difficulty, tagFilter]);

  const columns = [
    {
      key: "code",
      header: "Mã bài",
      render: (p) => <span className="tabular-mono text-xs font-semibold text-primary">{p.code}</span>
    },
    {
      key: "title",
      header: "Tên đề bài & Thẻ thuật toán",
      render: (p) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/oj/problems/${p.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
              {p.title}
            </Link>
            {p.inActiveContest && (
              <Badge variant="danger" className="text-[10px]">
                <BotOff className="h-3 w-3" />
                Đang thi Contest
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {p.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[11px]">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      )
    },
    {
      key: "difficulty",
      header: "Độ khó",
      render: (p) => (
        <Badge
          variant={p.difficulty === "Dễ" ? "success": p.difficulty === "Trung bình" ? "warning": "danger"}
        >
          {p.difficulty}
        </Badge>
      )
    },
    {
      key: "acRate",
      header: "Tỷ lệ AC",
      align: "right",
      render: (p) => <span className="tabular-mono text-xs font-medium">{p.acRate}</span>
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (p) =>
        p.solved ? (
          <Badge variant="calExam">
            <CheckCircle2 className="h-3 w-3" />
            Đã AC
          </Badge>
        ): (
          <span className="text-xs text-muted-foreground">Chưa giải</span>
        )
    },
    {
      key: "action",
      header: "Thực hành",
      align: "right",
      render: (p) => (
        <Button asChild size="sm" variant="outline" className="rounded-full">
          <Link to={`/oj/problems/${p.id}`}>
            <Code2 className="h-3.5 w-3.5" />
            <span>Giải bài</span>
          </Link>
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Luyện tập &amp; Thi đấu Lập trình (Online Judge)
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Chấm bài tự động trên cụm Sandbox cô lập hỗ trợ C, C++, Python và Java; thi đấu theo luật ICPC/IOI và đồng bộ thành tích lên E-Portfolio.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/yitbot">
                <Sparkles className="h-4 w-4 text-brand-cyan" />
                <span>Hỏi gợi ý YITBot</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/admin/oj">Quản trị OJ</Link>
            </Button>
          </div>
        </div>
      </section>

      <Tabs defaultValue="problems" className="min-h-[480px]">
        <TabsList className="justify-start">
          <TabsTrigger value="problems">Kho Bài tập ({PROBLEMS.length})</TabsTrigger>
          <TabsTrigger value="contests">Kỳ thi ICPC / IOI ({CONTESTS.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-12">
            <div className="relative md:col-span-6">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo mã bài, tên đề bài hoặc thẻ thuật toán..."
                className="pl-9"
              />
            </div>
            <div className="md:col-span-3">
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v)}>
                <SelectTrigger aria-label="Lọc độ khó">
                  <SelectValue placeholder="Độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả độ khó</SelectItem>
                  <SelectItem value="Dễ">Dễ</SelectItem>
                  <SelectItem value="Trung bình">Trung bình</SelectItem>
                  <SelectItem value="Khó">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger aria-label="Lọc thẻ thuật toán">
                  <SelectValue placeholder="Thẻ thuật toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả chủ đề</SelectItem>
                  <SelectItem value="Graph">Graph</SelectItem>
                  <SelectItem value="Greedy">Greedy</SelectItem>
                  <SelectItem value="DP">DP</SelectItem>
                  <SelectItem value="Segment Tree">Segment Tree</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DataTable columns={columns} data={filtered} />
        </TabsContent>

        <TabsContent value="contests" className="mt-4 grid gap-5 md:grid-cols-2">
          {CONTESTS.map((c) => (
            <Card key={c.id} className="rounded-[20px]">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={c.rule === "ICPC" ? "default": "calExam"} className="rounded-full">
                    <Trophy className="h-3 w-3" />
                    Luật {c.rule}
                  </Badge>
                  <Badge variant={c.status === "LIVE" ? "danger": "secondary"} className="rounded-full">
                    {c.status === "LIVE" ? "Đang diễn ra": "Sắp mở cổng"}
                  </Badge>
                </div>
                <CardTitle className="pt-1 text-lg">{c.title}</CardTitle>
                <CardDescription>{c.ruleDetail}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="tabular-mono font-medium text-foreground">{c.window}</span>
                  </span>
                  <span className="tabular-mono font-semibold text-foreground">{c.participants} thí sinh</span>
                </div>

                {c.status === "LIVE" && (
                  <div className="flex items-center gap-2 rounded-xl border border-status-warning/30 bg-status-warning/10 px-3 py-2 text-status-warning">
                    <BotOff className="h-4 w-4 shrink-0" />
                    <span>Trong giờ thi, YITBot tự động khóa gợi ý thuật toán cho toàn bộ bài thuộc Contest.</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button asChild size="sm" className="liquid-glass-btn-cobalt rounded-full px-5">
                    <Link to={`/oj/problems/${c.featuredProblemId}`}>
                      <Terminal className="h-3.5 w-3.5" />
                      <span>{c.status === "LIVE" ? "Vào phòng thi ngay": "Xem đề mẫu"}</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
