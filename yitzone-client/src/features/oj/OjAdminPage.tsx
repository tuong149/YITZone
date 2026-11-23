import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Code2,
  FileArchive,
  Plus,
  RefreshCw,
  ShieldAlert,
  Tag,
  Trash2,
  Trophy
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdminProblem {
  id: string;
  code: string;
  title: string;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  cpuSec: number;
  ramMb: number;
  testcases: number;
  published: boolean;
}

interface PlagiarismPair {
  id: string;
  contest: string;
  studentA: string;
  studentB: string;
  similarityPct: number;
  flagged: boolean;
}

const INITIAL_PROBLEMS: AdminProblem[] = [
  { id: "p1", code: "FIT-101", title: "Đường đi ngắn nhất trên Mạng lưới Campus", difficulty: "Trung bình", cpuSec: 1.0, ramMb: 256, testcases: 20, published: true },
  { id: "p2", code: "FIT-102", title: "Phân bổ Ca trực Văn phòng Tối ưu", difficulty: "Dễ", cpuSec: 1.0, ramMb: 128, testcases: 15, published: true },
  { id: "p3", code: "FIT-103", title: "Truy vấn Tổng đoạn Cây Phân đoạn", difficulty: "Khó", cpuSec: 2.0, ramMb: 512, testcases: 30, published: true }
];

const INITIAL_PAIRS: PlagiarismPair[] = [
  { id: "pl-1", contest: "ICPC FIT 2026 · FIT-103", studentA: "23110218 · Nguyễn Hoàng Nam", studentB: "23110244 · Lê Minh Trí", similarityPct: 92, flagged: false },
  { id: "pl-2", contest: "ICPC FIT 2026 · FIT-101", studentA: "22110418 · Trần Đức Thịnh", studentB: "22110345 · Nguyễn Minh Khôi", similarityPct: 34, flagged: false }
];

export function OjAdminPage(){
  const [problems, setProblems] = useState<AdminProblem[]>(INITIAL_PROBLEMS);
  const [pairs, setPairs] = useState<PlagiarismPair[]>(INITIAL_PAIRS);
  const [tags, setTags] = useState(["Graph", "Dijkstra", "Greedy", "DP", "Segment Tree", "Binary Search"]);
  const [newTitle, setNewTitle] = useState("");
  const [newDiff, setNewDiff] = useState<"Dễ" | "Trung bình" | "Khó">("Trung bình");
  const [newCpu, setNewCpu] = useState(1.0);
  const [newRam, setNewRam] = useState(256);
  const [newTag, setNewTag] = useState("");
  const [auditTarget, setAuditTarget] = useState<{ kind: "REJUDGE" | "PLAGIARISM"; id: string; label: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleAddProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const code = `FIT-10${problems.length + 1}`;
    setProblems((prev) => [
      {
        id: `p-${Date.now()}`,
        code,
        title: newTitle.trim(),
        difficulty: newDiff,
        cpuSec: newCpu,
        ramMb: newRam,
        testcases: 10,
        published: true
      },
...prev
    ]);
    setNewTitle("");
    setNotice(`Đã xuất bản đề bài ${code} kèm gói Testcase.zip mẫu vào Kho Luyện tập.`);
  };

  const handleConfirmAudit = () => {
    if (!auditTarget) return;
    if (auditTarget.kind === "REJUDGE") {
      setNotice(`Đã đẩy toàn bộ bài nộp của ${auditTarget.label} vào hàng đợi Re-judge Sandbox và ghi Audit Log.`);
    } else {
      setPairs((prev) =>
        prev.map((p) => (p.id === auditTarget.id ? {...p, flagged: true }: p))
      );
    }
    setAuditTarget(null);
  };

  const problemCols: DataTableColumn<AdminProblem>[] = [
    { key: "code", header: "Mã bài", render: (p) => <span className="tabular-mono text-xs font-semibold text-primary">{p.code}</span> },
    { key: "title", header: "Tên đề bài", render: (p) => <span className="font-medium text-foreground">{p.title}</span> },
    {
      key: "diff",
      header: "Độ khó",
      render: (p) => (
        <Badge variant={p.difficulty === "Dễ" ? "success": p.difficulty === "Trung bình" ? "warning": "danger"}>
          {p.difficulty}
        </Badge>
      )
    },
    {
      key: "limits",
      header: "Giới hạn Sandbox",
      render: (p) => (
        <span className="tabular-mono text-xs text-muted-foreground">
          {p.cpuSec}s · {p.ramMb}MB · {p.testcases} tests
        </span>
      )
    },
    {
      key: "actions",
      header: "Điều hành",
      align: "right",
      render: (p) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setAuditTarget({ kind: "REJUDGE", id: p.id, label: `${p.code} — ${p.title}` })}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Re-judge
        </Button>
      )
    }
  ];

  const pairCols: DataTableColumn<PlagiarismPair>[] = [
    { key: "contest", header: "Kỳ thi / Bài", render: (p) => <span className="text-xs font-medium">{p.contest}</span> },
    {
      key: "pair",
      header: "Cặp bài nộp đối chiếu (AST/Token)",
      render: (p) => (
        <div className="text-xs">
          <div>{p.studentA}</div>
          <div className="text-muted-foreground">↔ {p.studentB}</div>
        </div>
      )
    },
    {
      key: "sim",
      header: "Độ tương đồng",
      align: "right",
      render: (p) => (
        <Badge variant={p.similarityPct >= 80 ? "danger": "success"} className="tabular-mono">
          {p.similarityPct >= 80 && <AlertTriangle className="h-3 w-3" />}
          {p.similarityPct}%
        </Badge>
      )
    },
    {
      key: "action",
      header: "Xử lý",
      align: "right",
      render: (p) =>
        p.flagged ? (
          <Badge variant="danger">Đã gắn cờ vi phạm</Badge>
        ): p.similarityPct >= 80 ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() =>
              setAuditTarget({ kind: "PLAGIARISM", id: p.id, label: `${p.studentA} ↔ ${p.studentB} (${p.similarityPct}%)` })
            }
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Gắn cờ sao chép
          </Button>
        ): (
          <span className="text-xs text-muted-foreground">Bình thường</span>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Quản trị Online Judge &amp; Kỳ thi ICPC/IOI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Soạn đề bài, tải Testcase `.zip`, chấm lại bài nộp, quét trùng lặp AST/Token và quản lý Thẻ thuật toán.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/oj">
            <Code2 className="h-4 w-4" />
            <span>Mở Cổng Luyện tập OJ</span>
          </Link>
        </Button>
      </div>

      {notice && (
        <div className="rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-xs font-medium text-status-success">
          {notice}
        </div>
      )}

      <Tabs defaultValue="problems" className="min-h-[460px]">
        <TabsList className="justify-start">
          <TabsTrigger value="problems">Ngân hàng Đề &amp; Chấm lại ({problems.length})</TabsTrigger>
          <TabsTrigger value="plagiarism">Contest &amp; Quét AST/Token</TabsTrigger>
          <TabsTrigger value="tags">Danh mục Thẻ Thuật toán ({tags.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="problems" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tạo Đề bài Mới &amp; Nạp Gói Testcase `.zip`</CardTitle>
              <CardDescription>
                Giới hạn CPU `0.5s–5.0s`, bộ nhớ `64MB–512MB`, tự động cô lập mạng khi chạy Sandbox.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProblem} className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5 space-y-1">
                  <Label>Tên đề bài thuật toán</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="VD: Cây Khung Nhỏ Nhất (Kruskal)..." />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label>Độ khó</Label>
                  <Select value={newDiff} onValueChange={(v) => setNewDiff(v as typeof newDiff)}>
                    <SelectTrigger aria-label="Độ khó đề bài">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dễ">Dễ</SelectItem>
                      <SelectItem value="Trung bình">Trung bình</SelectItem>
                      <SelectItem value="Khó">Khó</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label>CPU (s)</Label>
                  <Input type="number" step="0.5" min={0.5} max={5} value={newCpu} onChange={(e) => setNewCpu(Number(e.target.value))} className="tabular-mono" />
                </div>
                <div className="sm:col-span-1 space-y-1">
                  <Label>RAM</Label>
                  <Input type="number" min={64} max={512} value={newRam} onChange={(e) => setNewRam(Number(e.target.value))} className="tabular-mono" />
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <Button type="submit" className="w-full">
                    <FileArchive className="h-4 w-4" />
                    Xuất bản
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <DataTable columns={problemCols} data={problems} />
        </TabsContent>

        <TabsContent value="plagiarism" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Đối chiếu Trùng lặp Mã nguồn (AST / Token Scanner)
              </CardTitle>
              <CardDescription>
                Quét tự động sau khi đóng Contest ICPC/IOI để cảnh báo cặp bài nộp có độ tương đồng vượt ngưỡng sao chép.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={pairCols} data={pairs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Quản lý Thẻ Chủ đề Thuật toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTag.trim()) return;
                  setTags((prev) => Array.from(new Set([...prev, newTag.trim()])));
                  setNewTag("");
                }}
                className="flex max-w-md gap-2"
              >
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Tên thẻ thuật toán mới..." />
                <Button type="submit">
                  <Plus className="h-4 w-4" />
                  Thêm
                </Button>
              </form>

              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      aria-label={`Xóa thẻ ${tag}`}
                      className="text-muted-foreground hover:text-status-danger"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(auditTarget)}
        onOpenChange={(open) => !open && setAuditTarget(null)}
        title={auditTarget?.kind === "REJUDGE" ? "Chấm lại Toàn bộ Bài nộp (Re-judge)": "Gắn cờ Sao chép Mã nguồn Contest"}
        description={
          auditTarget?.kind === "REJUDGE"
            ? "Đẩy lại toàn bộ bài nộp của đề bài này vào hàng đợi Judge Worker sau khi cập nhật bộ Testcase."
: "Xác nhận đánh dấu vi phạm sao chép dựa trên kết quả phân tích AST/Token và lưu nhật ký kiểm toán."
        }
        targetSummary={auditTarget?.label ?? ""}
        actionCode={auditTarget?.kind === "REJUDGE" ? "OJ_REJUDGE_PROBLEM": "OJ_PLAGIARISM_FLAG"}
        destructive={auditTarget?.kind === "PLAGIARISM"}
        onConfirm={handleConfirmAudit}
      />
    </div>
  );
}
