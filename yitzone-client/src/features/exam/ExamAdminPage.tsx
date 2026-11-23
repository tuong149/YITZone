import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  Award,
  FileSpreadsheet,
  Gamepad2,
  Laptop,
  MonitorPlay,
  Plus,
  ShieldAlert,
  Sliders,
  Trash2,
  Users
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

type Difficulty = "Nhận biết" | "Thông hiểu" | "Vận dụng";

interface BankQuestion {
  id: string;
  stem: string;
  difficulty: Difficulty;
  usedInExam: boolean;
  archived: boolean;
}

interface CandidateSession {
  id: string;
  mssv: string;
  fullName: string;
  device: string;
  score: number;
  durationSec: number;
  violations: number;
  flags: string[];
  status: "IN_PROGRESS" | "SUBMITTED" | "DISQUALIFIED";
  deviceTransferred: boolean;
}

const INITIAL_BANK: BankQuestion[] = [
  {
    id: "Q-001",
    stem: "Cơ chế chữ ký số nào dùng cho mã QR điểm danh ngoại tuyến của YITZone?",
    difficulty: "Nhận biết",
    usedInExam: true,
    archived: false
  },
  {
    id: "Q-002",
    stem: "Quy định xử lý đơn xin vắng trực Văn phòng gửi trước ≥ 2 giờ kèm ca bù hợp lệ?",
    difficulty: "Thông hiểu",
    usedInExam: true,
    archived: false
  },
  {
    id: "Q-003",
    stem: "Cách xử lý khi kiểm kê tài sản OFIT phát hiện số lượng thực tế nhiều hơn sổ sách?",
    difficulty: "Vận dụng",
    usedInExam: false,
    archived: false
  }
];

const INITIAL_CANDIDATES: CandidateSession[] = [
  {
    id: "s1",
    mssv: "22110345",
    fullName: "Nguyễn Minh Khôi",
    device: "Chrome · Windows 11",
    score: 95,
    durationSec: 642,
    violations: 0,
    flags: [],
    status: "SUBMITTED",
    deviceTransferred: false
  },
  {
    id: "s2",
    mssv: "22110418",
    fullName: "Trần Đức Thịnh",
    device: "Edge · Windows 11",
    score: 88,
    durationSec: 710,
    violations: 1,
    flags: ["HEARTBEAT_GAP > 15s (LOG_ONLY)"],
    status: "IN_PROGRESS",
    deviceTransferred: false
  },
  {
    id: "s3",
    mssv: "23110219",
    fullName: "Lê Hoàng Nam",
    device: "Safari · iOS Mobile",
    score: 80,
    durationSec: 890,
    violations: 2,
    flags: ["MOBILE_LOG_ONLY ×2"],
    status: "SUBMITTED",
    deviceTransferred: false
  }
];

export function ExamAdminPage(){
  const [bank, setBank] = useState<BankQuestion[]>(INITIAL_BANK);
  const [candidates, setCandidates] = useState<CandidateSession[]>(INITIAL_CANDIDATES);
  const [newStem, setNewStem] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>("Nhận biết");
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const [matrix, setMatrix] = useState({
    know: 40,
    understand: 40,
    apply: 20,
    durationMin: 20,
    ecertPass: 75,
    maxBlur: 3
  });

  const [auditTarget, setAuditTarget] = useState<{
    kind: "ARCHIVE_Q" | "TRANSFER_DEVICE" | "DISQUALIFY";
    id: string;
    label: string;
  } | null>(null);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStem.trim()) return;
    setBank((prev) => [
      {
        id: `Q-00${prev.length + 1}`,
        stem: newStem.trim(),
        difficulty: newDifficulty,
        usedInExam: false,
        archived: false
      },
...prev
    ]);
    setNewStem("");
  };

  const handleSimulateExcelImport = () => {
    const imported: BankQuestion[] = [
      {
        id: `Q-IMP-${bank.length + 1}`,
        stem: "Điều kiện điểm sàn để mở khóa E-Certificate bài thu hoạch sự kiện là gì?",
        difficulty: "Nhận biết",
        usedInExam: false,
        archived: false
      },
      {
        id: `Q-IMP-${bank.length + 2}`,
        stem: "Phân biệt quyền hạn giữa MOD_YITBOT_CURATOR và MOD_YITBOT_FULL (BTV).",
        difficulty: "Vận dụng",
        usedInExam: false,
        archived: false
      }
    ];
    setBank((prev) => [...imported,...prev]);
    setImportFeedback("Đã nhập thành công 2 câu hỏi mới từ tệp Excel mẫu (0 lỗi định dạng).");
  };

  const handleAuditConfirm = () => {
    if (!auditTarget) return;
    if (auditTarget.kind === "ARCHIVE_Q") {
      setBank((prev) =>
        prev.map((q) => (q.id === auditTarget.id ? {...q, archived: true }: q))
      );
    } else if (auditTarget.kind === "TRANSFER_DEVICE") {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === auditTarget.id
            ? {...c, deviceTransferred: true, device: "Đã cấp phép máy mới (Đang đồng bộ nháp)" }
: c
        )
      );
    } else if (auditTarget.kind === "DISQUALIFY") {
      setCandidates((prev) =>
        prev.map((c) => (c.id === auditTarget.id ? {...c, status: "DISQUALIFIED" }: c))
      );
    }
    setAuditTarget(null);
  };

  const rankedCandidates = [...candidates]
.filter((c) => c.status !== "DISQUALIFIED")
.sort((a, b) => b.score - a.score || a.durationSec - b.durationSec || a.violations - b.violations);

  const bankCols: DataTableColumn<BankQuestion>[] = [
    {
      key: "id",
      header: "Mã",
      render: (q) => <span className="tabular-mono text-xs font-semibold">{q.id}</span>
    },
    {
      key: "stem",
      header: "Nội dung câu hỏi",
      render: (q) => (
        <span className={q.archived ? "text-muted-foreground line-through": "font-medium text-foreground"}>
          {q.stem}
        </span>
      )
    },
    {
      key: "difficulty",
      header: "Mức độ",
      render: (q) => <Badge variant="secondary">{q.difficulty}</Badge>
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (q) =>
        q.archived ? (
          <Badge variant="outline">Đã lưu trữ (Archive)</Badge>
        ): q.usedInExam ? (
          <Badge variant="info">Đã dùng trong đề</Badge>
        ): (
          <Badge variant="success">Chưa dùng</Badge>
        )
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (q) =>
        q.archived ? (
          <span className="text-xs text-muted-foreground">Khóa xóa</span>
        ): q.usedInExam ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              setAuditTarget({ kind: "ARCHIVE_Q", id: q.id, label: `${q.id} — ${q.stem}` })
            }
          >
            <Archive className="h-3.5 w-3.5" />
            Lưu trữ
          </Button>
        ): (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setBank((prev) => prev.filter((item) => item.id !== q.id))}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Xóa
          </Button>
        )
    }
  ];

  const candidateCols: DataTableColumn<CandidateSession>[] = [
    {
      key: "rank",
      header: "Hạng",
      render: (c) => {
        const rankIdx = rankedCandidates.findIndex((r) => r.id === c.id);
        return <span className="tabular-mono text-xs font-semibold">{rankIdx >= 0 ? `#${rankIdx + 1}`: "—"}</span>;
      }
    },
    {
      key: "student",
      header: "MSSV · Thí sinh",
      render: (c) => (
        <div>
          <div className="font-medium text-foreground">{c.fullName}</div>
          <div className="tabular-mono text-xs text-muted-foreground">{c.mssv}</div>
        </div>
      )
    },
    {
      key: "device",
      header: "Thiết bị",
      render: (c) => (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>{c.device}</div>
          {c.deviceTransferred && <Badge variant="info">Đã chuyển thiết bị</Badge>}
        </div>
      )
    },
    {
      key: "score",
      header: "Điểm / Thời gian",
      render: (c) => (
        <div className="space-y-1 tabular-mono text-xs">
          <div className="font-semibold text-foreground">{c.score}/100</div>
          <div className="text-muted-foreground">
            {Math.floor(c.durationSec / 60)}p {c.durationSec % 60}s
          </div>
          {c.score >= matrix.ecertPass && c.status !== "DISQUALIFIED" && (
            <Badge variant="verified">
              <Award className="h-3 w-3" />
              E-Cert
            </Badge>
          )}
        </div>
      )
    },
    {
      key: "flags",
      header: "Nhật ký Giám sát",
      render: (c) =>
        c.status === "DISQUALIFIED" ? (
          <Badge variant="danger">Đã hủy kết quả</Badge>
        ): c.flags.length === 0 ? (
          <Badge variant="success">Sạch (0 vi phạm)</Badge>
        ): (
          <div className="flex flex-wrap gap-1">
            {c.flags.map((f) => (
              <Badge key={f} variant="warning">
                {f}
              </Badge>
            ))}
          </div>
        )
    },
    {
      key: "actions",
      header: "Điều hành",
      align: "right",
      render: (c) => (
        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={c.status === "DISQUALIFIED"}
            onClick={() =>
              setAuditTarget({
                kind: "TRANSFER_DEVICE",
                id: c.id,
                label: `${c.mssv} — ${c.fullName}`
              })
            }
          >
            <Laptop className="h-3.5 w-3.5" />
            Chuyển máy
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={c.status === "DISQUALIFIED"}
            onClick={() =>
              setAuditTarget({
                kind: "DISQUALIFY",
                id: c.id,
                label: `${c.mssv} — ${c.fullName}`
              })
            }
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Hủy KQ
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Quản trị Minigame &amp; Thi Trắc nghiệm
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ngân hàng câu hỏi 4 đáp án, Import Excel, Ma trận rút đề, Coi thi chuyển thiết bị &amp; LED Minigame.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/stage/minigame">
              <MonitorPlay className="h-4 w-4" />
              <span>Mở LED Minigame</span>
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/exam/ex-fit-2026">Xem thử Phòng thi</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="bank" className="min-h-[460px]">
        <TabsList className="justify-start">
          <TabsTrigger value="bank">Ngân hàng Câu hỏi ({bank.length})</TabsTrigger>
          <TabsTrigger value="matrix">Cấu hình Kỳ thi</TabsTrigger>
          <TabsTrigger value="proctor">Coi thi &amp; Xếp hạng ({candidates.length})</TabsTrigger>
          <TabsTrigger value="minigame">Bộ Câu hỏi Minigame</TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Thêm mới &amp; Import Hàng loạt Excel/CSV</CardTitle>
                <CardDescription>
                  Câu hỏi đã từng dùng trong kỳ thi bị chặn xóa cứng — chỉ cho phép Lưu trữ (Archive) kèm Audit Log.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleSimulateExcelImport}>
                <FileSpreadsheet className="h-4 w-4" />
                Import Excel mẫu (+2 câu)
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {importFeedback && (
                <div className="rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-xs font-medium text-status-success">
                  {importFeedback}
                </div>
              )}

              <form onSubmit={handleAddQuestion} className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-7">
                  <Input
                    value={newStem}
                    onChange={(e) => setNewStem(e.target.value)}
                    placeholder="Nhập nội dung câu hỏi 4 đáp án A/B/C/D..."
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-3">
                  <Select value={newDifficulty} onValueChange={(v) => setNewDifficulty(v as Difficulty)}>
                    <SelectTrigger aria-label="Mức độ câu hỏi" className="h-10 rounded-xl">
                      <SelectValue placeholder="Mức độ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nhận biết">Nhận biết</SelectItem>
                      <SelectItem value="Thông hiểu">Thông hiểu</SelectItem>
                      <SelectItem value="Vận dụng">Vận dụng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" className="w-full rounded-xl">
                    <Plus className="h-4 w-4" />
                    Thêm câu
                  </Button>
                </div>
              </form>

              <DataTable columns={bankCols} data={bank} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-primary" />
                Ma trận Rút đề Ngẫu nhiên &amp; Ngưỡng Giám sát
              </CardTitle>
              <CardDescription>
                Cấu hình tỷ lệ 3 mức độ, điểm sàn mở khóa E-Cert và ngưỡng vi phạm rời tab trên Desktop.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Tỷ lệ Nhận biết (%)</Label>
                <Input
                  type="number"
                  value={matrix.know}
                  onChange={(e) => setMatrix({...matrix, know: Number(e.target.value) })}
                  className="rounded-xl tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tỷ lệ Thông hiểu (%)</Label>
                <Input
                  type="number"
                  value={matrix.understand}
                  onChange={(e) => setMatrix({...matrix, understand: Number(e.target.value) })}
                  className="rounded-xl tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tỷ lệ Vận dụng (%)</Label>
                <Input
                  type="number"
                  value={matrix.apply}
                  onChange={(e) => setMatrix({...matrix, apply: Number(e.target.value) })}
                  className="rounded-xl tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Thời gian làm bài (phút)</Label>
                <Input
                  type="number"
                  value={matrix.durationMin}
                  onChange={(e) => setMatrix({...matrix, durationMin: Number(e.target.value) })}
                  className="rounded-xl tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Điểm sàn mở khóa E-Cert (/100)</Label>
                <Input
                  type="number"
                  value={matrix.ecertPass}
                  onChange={(e) => setMatrix({...matrix, ecertPass: Number(e.target.value) })}
                  className="rounded-xl tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ngưỡng rời tab Desktop (lần)</Label>
                <Input
                  type="number"
                  value={matrix.maxBlur}
                  onChange={(e) => setMatrix({...matrix, maxBlur: Number(e.target.value) })}
                  className="rounded-xl tabular-mono"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proctor" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Bảng Coi thi Trực tuyến &amp; Hậu kiểm Vi phạm
              </CardTitle>
              <CardDescription>
                Cấp phép chuyển thiết bị khi máy thí sinh gặp sự cố (ghi Audit Log) và xem xếp hạng theo (Điểm ↓ → Thời gian ↑ → Vi phạm ↑).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={candidateCols} data={candidates} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minigame" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                Bộ Câu hỏi Minigame Hội trường
              </CardTitle>
              <CardDescription>
                Hỗ trợ 1 đáp án, Nhiều đáp án (chọn đủ), Đúng/Sai · Thời gian 10/20/30/60s · Điểm 1000/2000.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display text-base font-medium text-foreground">
                    Đấu trường Công nghệ FIT 2026
                  </div>
                  <Badge variant="success">10 câu · Sẵn sàng</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Chế độ Khách mời: Bật (có lọc từ ngữ nhạy cảm) · Hiển thị LED che 5 số đầu MSSV.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" className="rounded-full">
                    <Link to="/stage/minigame">Mở phòng LED (PIN 739 204)</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-full">
                    <Link to="/minigame">Màn hình người chơi</Link>
                  </Button>
                </div>
              </div>
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display text-base font-medium text-foreground">
                    Rung chuông vàng Tân sinh viên K26
                  </div>
                  <Badge variant="secondary">15 câu · Bản nháp</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Chỉ dành cho Sinh viên đăng nhập SSO · Thưởng Streak tối đa +500đ.
                </p>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to="/stage/minigame">Xem trước Sân khấu LED</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={Boolean(auditTarget)}
        onOpenChange={(open) => !open && setAuditTarget(null)}
        title={
          auditTarget?.kind === "ARCHIVE_Q"
            ? "Lưu trữ (Archive) Câu hỏi Đã sử dụng"
: auditTarget?.kind === "TRANSFER_DEVICE"
              ? "Cấp phép Chuyển sang Thiết bị khác"
: "Hủy Kết quả Thi do Gian lận"
        }
        description={
          auditTarget?.kind === "ARCHIVE_Q"
            ? "Câu hỏi này đã từng xuất hiện trong kỳ thi nên không thể xóa vĩnh viễn. Chuyển sang Lưu trữ để giữ toàn vẹn lịch sử."
: auditTarget?.kind === "TRANSFER_DEVICE"
              ? "Hủy khóa máy cũ và cho phép thí sinh tiếp tục bài nháp trên thiết bị mới theo đồng hồ server."
: "Hủy bỏ kết quả bài làm sau khi đối chiếu nhật ký vi phạm hậu kiểm."
        }
        targetSummary={auditTarget?.label ?? ""}
        actionCode={
          auditTarget?.kind === "ARCHIVE_Q"
            ? "EXAM_QUESTION_ARCHIVE"
: auditTarget?.kind === "TRANSFER_DEVICE"
              ? "EXAM_DEVICE_TRANSFER"
: "EXAM_DISQUALIFY"
        }
        destructive={auditTarget?.kind === "DISQUALIFY"}
        onConfirm={handleAuditConfirm}
      />
    </div>
  );
}
