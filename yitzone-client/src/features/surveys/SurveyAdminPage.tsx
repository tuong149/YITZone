import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  EyeOff,
  FileText,
  Lock,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface SurveyRow {
  id: string;
  title: string;
  scope: "Sau sự kiện" | "Toàn Khoa" | "Nội bộ Ban/Tổ";
  mode: "IDENTIFIED" | "ANONYMOUS";
  responsesCount: number;
  status: "OPEN" | "CLOSED";
}

interface SurveyTemplate {
  id: string;
  name: string;
  questionsCount: number;
  defaultScope: string;
}

const INITIAL_SURVEYS: SurveyRow[] = [
  {
    id: "evt-cloud-2026",
    title: "Đánh giá Hội thảo Cloud Native & DevOps 2026",
    scope: "Sau sự kiện",
    mode: "IDENTIFIED",
    responsesCount: 42,
    status: "OPEN"
  },
  {
    id: "anon-ofit-2026",
    title: "Khảo sát Ẩn danh Chất lượng Trực VP Ban OFIT",
    scope: "Nội bộ Ban/Tổ",
    mode: "ANONYMOUS",
    responsesCount: 3, // < 5 -> triggers N >= 5 lock!
    status: "OPEN"
  },
  {
    id: "all-fit-hk1",
    title: "Lấy ý kiến Chủ đề Học thuật Học kỳ 2 (2026–2027)",
    scope: "Toàn Khoa",
    mode: "ANONYMOUS",
    responsesCount: 68,
    status: "OPEN"
  }
];

const INITIAL_TEMPLATES: SurveyTemplate[] = [
  { id: "st-1", name: "Mẫu chuẩn Đánh giá Hội thảo / Workshop (5 câu)", questionsCount: 5, defaultScope: "Sau sự kiện" },
  { id: "st-2", name: "Mẫu khảo sát Nhu cầu Học thuật Toàn Khoa", questionsCount: 6, defaultScope: "Toàn Khoa" },
  { id: "st-3", name: "Mẫu đánh giá Nội bộ Cuối học kỳ 4 Ban – 9 Tổ", questionsCount: 4, defaultScope: "Nội bộ Ban/Tổ" }
];

const RAW_ESSAYS_SAMPLE = `- "Hội thảo rất bổ ích, cảm ơn anh Tuấn ban hậu cần đã hỗ trợ micro nhanh chóng. MSSV mình là 22110345, sđt 0901234567 muốn nhận slide."
- "Nên tăng thời gian Q&A thêm 15 phút và gửi link GitHub repo trước buổi học. Email: 23110218@student.hcmute.edu.vn."
- "Khu vực quét QR đầu giờ ở Hội trường A5 hơi đông, đề xuất mở thêm 1 bàn quét mã vạch thẻ SV."`;

function autoRedactPii(text: string): string {
  return text
.replace(/\b\d{8}\b/g, "[ĐÃ ẨN MSSV]")
.replace(/\b0\d{9}\b/g, "[ĐÃ ẨN SĐT]")
.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[ĐÃ ẨN EMAIL]");
}

export function SurveyAdminPage(){
  const [surveys, setSurveys] = useState<SurveyRow[]>(INITIAL_SURVEYS);
  const [templates, setTemplates] = useState<SurveyTemplate[]>(INITIAL_TEMPLATES);
  const [newTplName, setNewTplName] = useState("");
  const [newTplScope, setNewTplScope] = useState("Sau sự kiện");
  const [selectedAnalyticsId, setSelectedAnalyticsId] = useState<string>("anon-ofit-2026");

  // 2-step AI PII Redaction Preview (UC-SUR-03)
  const [redactedPayload, setRedactedPayload] = useState<string>(() => autoRedactPii(RAW_ESSAYS_SAMPLE));
  const [aiSummaryGenerated, setAiSummaryGenerated] = useState(false);

  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeAnalyticsSurvey = surveys.find((s) => s.id === selectedAnalyticsId) ?? surveys[0]!;
  const isAnonLocked =
    activeAnalyticsSurvey.mode === "ANONYMOUS" && activeAnalyticsSurvey.responsesCount < 5;

  const surveyColumns: DataTableColumn<SurveyRow>[] = [
    {
      key: "title",
      header: "Biểu mẫu Khảo sát",
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{row.title}</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{row.scope}</Badge>
            <Badge variant={row.mode === "ANONYMOUS" ? "info": "secondary"}>
              {row.mode === "ANONYMOUS" ? "Ẩn danh (N ≥ 5)": "Định danh (Mở E-Cert)"}
            </Badge>
          </div>
        </div>
      )
    },
    {
      key: "responses",
      header: "Phản hồi",
      align: "right",
      render: (row) => (
        <span className="tabular-mono font-semibold text-foreground">{row.responsesCount}</span>
      )
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row) =>
        row.status === "OPEN" ? (
          <Badge variant="success">Đang mở</Badge>
        ): (
          <Badge variant="secondary">Đã đóng</Badge>
        )
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button asChild size="sm" variant="outline">
            <Link to={`/surveys/${row.id}`}>
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Mở form</span>
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setSurveys((prev) => [
                {
...row,
                  id: `${row.id}-copy-${Date.now()}`,
                  title: `${row.title} (Bản sao)`,
                  responsesCount: 0,
                  status: "OPEN"
                },
...prev
              ]);
              setNotice(`Đã nhân bản khảo sát "${row.title}" (0 phản hồi — cho phép chỉnh sửa câu hỏi).`);
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Nhân bản</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
            onClick={() => {
              setErrorMsg(null);
              if (row.responsesCount > 0) {
                setErrorMsg(
                  `Khóa chỉnh sửa/xóa câu hỏi: "${row.title}" đã có ${row.responsesCount} phản hồi. Hãy dùng "Nhân bản" hoặc Đóng cổng.`
                );
                return;
              }
              setSurveys((prev) => prev.filter((s) => s.id !== row.id));
              setNotice(`Đã xóa biểu mẫu nháp "${row.title}" (0 phản hồi).`);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Quản trị Khảo sát &amp; Lấy ý kiến Sinh viên
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CRUD Kho mẫu chuẩn, bảo vệ ẩn danh tách bảng ngưỡng N ≥ 5 và tóm tắt AI khử định danh 2 bước.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setNotice("Đã xuất báo cáo thống kê khảo sát (.xlsx) đạt chuẩn đối chiếu.")}
        >
          <Download className="h-4 w-4" />
          <span>Xuất Excel (.xlsx)</span>
        </Button>
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

      {errorMsg && (
        <div className="flex items-center justify-between rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-sm text-status-danger">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {errorMsg}
          </span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-xs font-semibold underline">
            Đóng
          </button>
        </div>
      )}

      <Tabs defaultValue="surveys" className="min-h-[480px]">
        <TabsList className="justify-start">
          <TabsTrigger value="surveys">Biểu mẫu Khảo sát ({surveys.length})</TabsTrigger>
          <TabsTrigger value="templates">CRUD Kho Mẫu Chuẩn ({templates.length})</TabsTrigger>
          <TabsTrigger value="analytics">Thống kê (N ≥ 5) &amp; Tóm tắt AI</TabsTrigger>
        </TabsList>

        <TabsContent value="surveys" className="mt-4">
          <DataTable columns={surveyColumns} data={surveys} />
        </TabsContent>

        {/* CRUD Survey Templates (FR-SUR-01) */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                <span>Kho Mẫu Khảo sát Chuẩn của Khoa (`SURVEY_TEMPLATES`)</span>
              </CardTitle>
              <CardDescription>
                Thêm mới, tái sử dụng hoặc xóa mẫu chuẩn để khởi tạo nhanh khảo sát sau sự kiện và toàn Khoa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2.5 sm:grid-cols-12">
                <Input
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  placeholder="Tên mẫu khảo sát chuẩn mới..."
                  className="sm:col-span-6"
                />
                <div className="sm:col-span-4">
                  <Select value={newTplScope} onValueChange={setNewTplScope}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sau sự kiện">Sau sự kiện</SelectItem>
                      <SelectItem value="Toàn Khoa">Toàn Khoa</SelectItem>
                      <SelectItem value="Nội bộ Ban/Tổ">Nội bộ Ban/Tổ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  disabled={!newTplName.trim()}
                  className="sm:col-span-2"
                  onClick={() => {
                    setTemplates((prev) => [
                      { id: `st-${Date.now()}`, name: newTplName.trim(), questionsCount: 5, defaultScope: newTplScope },
...prev
                    ]);
                    setNewTplName("");
                    setNotice("Đã thêm mẫu mới vào Kho Mẫu Khảo sát Chuẩn.");
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm mẫu</span>
                </Button>
              </div>

              <div className="space-y-2">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-foreground">{tpl.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Phạm vi mặc định: {tpl.defaultScope} ·{" "}
                        <span className="tabular-mono">{tpl.questionsCount} câu hỏi</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                      onClick={() => {
                        setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
                        setNotice(`Đã xóa mẫu "${tpl.name}".`);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics N >= 5 + 2-Step AI PII Redaction */}
        <TabsContent value="analytics" className="mt-4 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-xs">Chọn khảo sát cần xem thống kê:</Label>
            <div className="w-80">
              <Select value={selectedAnalyticsId} onValueChange={setSelectedAnalyticsId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {surveys.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title} ({s.responsesCount} phiếu)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAnonLocked ? (
            <Card className="border-status-warning/35 bg-status-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-status-warning">
                  <Lock className="h-5 w-5" />
                  <span>Đang khóa thống kê chi tiết (Ngưỡng Ẩn danh N ≥ 5)</span>
                </CardTitle>
                <CardDescription>
                  Khảo sát ẩn danh <strong>{activeAnalyticsSurvey.title}</strong> hiện mới có{" "}
                  <strong className="tabular-mono text-foreground">{activeAnalyticsSurvey.responsesCount}/5</strong>{" "}
                  phản hồi. Hệ thống chỉ mở hiển thị chi tiết khi đạt tối thiểu 5 phản hồi để chống suy đoán ngược danh
                  tính.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedAnalyticsId("all-fit-hk1")}
                >
                  <EyeOff className="h-4 w-4" />
                  <span>Chuyển sang khảo sát ẩn danh đã đủ N ≥ 5 (68 phiếu)</span>
                </Button>
              </CardContent>
            </Card>
          ): (
            <div className="grid gap-5 lg:grid-cols-12">
              <Card className="lg:col-span-5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span>Tổng hợp Định lượng ({activeAnalyticsSurvey.responsesCount} phản hồi)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    { label: "5 sao · Rất hài lòng", pct: 64 },
                    { label: "4 sao · Hài lòng", pct: 26 },
                    { label: "3 sao · Bình thường", pct: 8 },
                    { label: "1–2 sao · Cần cải thiện", pct: 2 }
                  ].map((bar) => (
                    <div key={bar.label} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground">{bar.label}</span>
                        <span className="tabular-mono font-semibold text-primary">{bar.pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${bar.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="lg:col-span-7">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-brand-cyan" />
                    <span>Tóm tắt AI Khử Định danh 2 Bước (Bắt buộc Xem trước)</span>
                  </CardTitle>
                  <CardDescription>
                    Hệ thống tự động che MSSV/Email/SĐT. Cán bộ bắt buộc rà soát và che tay tên riêng tiếng Việt còn
                    sót (VD: &ldquo;anh Tuấn&rdquo; → `[ĐÃ ẨN TÊN]`) trước khi gửi sang LLM.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    rows={5}
                    value={redactedPayload}
                    onChange={(e) => {
                      setRedactedPayload(e.target.value);
                      setAiSummaryGenerated(false);
                    }}
                    className="font-mono text-xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setRedactedPayload((p) => p.replace(/anh Tuấn/gi, "[ĐÃ ẨN TÊN]"))
                      }
                    >
                      Che nhanh &ldquo;anh Tuấn&rdquo; → [ĐÃ ẨN TÊN]
                    </Button>
                    <Button type="button" size="sm" onClick={() => setAiSummaryGenerated(true)}>
                      <Sparkles className="h-4 w-4" />
                      <span>Xác nhận Đã sạch PII &amp; Gửi AI Tóm tắt</span>
                    </Button>
                  </div>

                  {aiSummaryGenerated && (
                    <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs space-y-1.5 text-foreground">
                      <div className="font-semibold text-primary">Báo cáo Tóm tắt 3 mục từ AI (Payload sạch PII):</div>
                      <p>1. <strong>Điểm mạnh:</strong> Nội dung chuyên môn thực chiến cao, hỗ trợ kỹ thuật nhanh.</p>
                      <p>2. <strong>Điểm cần cải thiện:</strong> Thời lượng Q&amp;A ngắn, lối check-in đầu giờ còn ùn nhẹ.</p>
                      <p>3. <strong>Đề xuất hành động:</strong> Mở thêm 1 bàn quét mã vạch 1D thẻ SV và gửi repo trước buổi học.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
