import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Lock,
  Pencil,
  Play,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { SurveyFormBuilder } from "@/features/surveys/SurveyFormBuilder";
import { useSurveyStore } from "@/stores/survey-store";

const RAW_ESSAYS_SAMPLE = `- "Hội thảo rất bổ ích, cảm ơn anh Tuấn ban hậu cần đã hỗ trợ micro nhanh chóng. MSSV mình là 22110345, sđt 0901234567 muốn nhận slide."
- "Nên tăng thời gian Q&A thêm 15 phút và gửi link GitHub repo trước buổi học. Email: 23110218@student.hcmute.edu.vn."
- "Khu vực quét QR đầu giờ ở Hội trường A5 hơi đông, đề xuất mở thêm 1 bàn quét mã vạch thẻ SV."`;

function autoRedactPii(text) {
  return text
    .replace(/\b\d{8}\b/g, "[ĐÃ ẨN MSSV]")
    .replace(/\b0\d{9}\b/g, "[ĐÃ ẨN SĐT]")
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[ĐÃ ẨN EMAIL]");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function statusBadge(status) {
  if (status === "OPEN") return <Badge variant="success">Đang mở</Badge>;
  if (status === "DRAFT") return <Badge variant="secondary">Bản nháp</Badge>;
  return <Badge variant="outline">Đã đóng</Badge>;
}

export function SurveyAdminPage({ embeddedEventId } = {}) {
  const allSurveys = useSurveyStore((s) => s.surveys);
  const surveys = embeddedEventId ? allSurveys : allSurveys;
  const templates = useSurveyStore((s) => s.templates);
  const createSurvey = useSurveyStore((s) => s.createSurvey);
  const updateSurvey = useSurveyStore((s) => s.updateSurvey);
  const setSurveyStatus = useSurveyStore((s) => s.setSurveyStatus);
  const duplicateSurvey = useSurveyStore((s) => s.duplicateSurvey);
  const deleteSurvey = useSurveyStore((s) => s.deleteSurvey);
  const createTemplate = useSurveyStore((s) => s.createTemplate);
  const updateTemplateQuestions = useSurveyStore((s) => s.updateTemplateQuestions);
  const deleteTemplate = useSurveyStore((s) => s.deleteTemplate);

  const [activeTab, setActiveTab] = useState("surveys");
  const [selectedAnalyticsId, setSelectedAnalyticsId] = useState(
    () => surveys[1]?.id ?? surveys[0]?.id ?? ""
  );
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  // Create new survey dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newScope, setNewScope] = useState("Sau sự kiện");
  const [newMode, setNewMode] = useState("IDENTIFIED");
  const [newTemplateId, setNewTemplateId] = useState("BLANK");

  // Survey / Template Builder dialog
  const [builderTarget, setBuilderTarget] = useState(null);

  // Template quick-add state
  const [newTplName, setNewTplName] = useState("");
  const [newTplScope, setNewTplScope] = useState("Sau sự kiện");
  const [newTplMode, setNewTplMode] = useState("IDENTIFIED");

  // 2-step AI PII Redaction Preview
  const [redactedPayload, setRedactedPayload] = useState(() => autoRedactPii(RAW_ESSAYS_SAMPLE));
  const [customMaskTerm, setCustomMaskTerm] = useState("");
  const [aiSummaryGenerated, setAiSummaryGenerated] = useState(false);

  const [notice, setNotice] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const activeAnalyticsSurvey =
    surveys.find((s) => s.id === selectedAnalyticsId) ?? surveys[0];
  const isAnonLocked =
    Boolean(activeAnalyticsSurvey) &&
    activeAnalyticsSurvey.mode === "ANONYMOUS" &&
    activeAnalyticsSurvey.responsesCount < 5;

  const activeBuilderSurvey =
    builderTarget?.kind === "SURVEY"
      ? surveys.find((s) => s.id === builderTarget.id) ?? null
      : null;
  const activeBuilderTemplate =
    builderTarget?.kind === "TEMPLATE"
      ? templates.find((t) => t.id === builderTarget.id) ?? null
      : null;

  const handleCreateSurveySubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created = createSurvey({
      title: newTitle.trim(),
      scope: newScope,
      mode: newMode,
      templateId: newTemplateId === "BLANK" ? undefined : newTemplateId
    });
    setCreateDialogOpen(false);
    setNewTitle("");
    setNewTemplateId("BLANK");
    setBuilderTarget({ kind: "SURVEY", id: created.id });
    setNotice(`Đã tạo khảo sát bản nháp "${created.title}". Hãy hoàn thiện câu hỏi rồi mở cổng.`);
  };

  const handleUseTemplate = (templateId) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const created = createSurvey({
      title: `${tpl.name} — Đợt mới`,
      scope: tpl.defaultScope,
      mode: tpl.defaultMode,
      templateId: tpl.id
    });
    setActiveTab("surveys");
    setBuilderTarget({ kind: "SURVEY", id: created.id });
    setNotice(`Đã khởi tạo khảo sát bản nháp từ "${tpl.name}" (${created.questions.length} câu hỏi).`);
  };

  const handleMaskCustomTerm = (e) => {
    e.preventDefault();
    const term = customMaskTerm.trim();
    if (!term) return;
    const regex = new RegExp(escapeRegex(term), "gi");
    setRedactedPayload((prev) => prev.replace(regex, "[ĐÃ ẨN TÊN]"));
    setAiSummaryGenerated(false);
    setCustomMaskTerm("");
  };

  const surveyColumns = [
    {
      key: "title",
      header: "Biểu mẫu Khảo sát",
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground">{row.title}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="outline">{row.scope}</Badge>
            <Badge variant={row.mode === "ANONYMOUS" ? "info" : "secondary"}>
              {row.mode === "ANONYMOUS" ? "Ẩn danh (N ≥ 5)" : "Định danh (Mở E-Cert)"}
            </Badge>
            <span className="tabular-mono text-[11px]">{row.questions.length} câu hỏi</span>
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
      render: (row) => statusBadge(row.status)
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => {
        const editable = row.status === "DRAFT" && row.responsesCount === 0;
        return (
          <div className="flex flex-wrap justify-end gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={editable ? "default" : "outline"}
              onClick={() => setBuilderTarget({ kind: "SURVEY", id: row.id })}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>{editable ? "Sửa câu hỏi" : "Xem câu hỏi"}</span>
            </Button>

            {row.status === "DRAFT" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setErrorMsg(null);
                  if (row.questions.length === 0) {
                    setErrorMsg("Cần ít nhất 1 câu hỏi trước khi mở cổng khảo sát.");
                    return;
                  }
                  setSurveyStatus(row.id, "OPEN");
                  setNotice(`Đã mở cổng khảo sát "${row.title}".`);
                }}
              >
                <Play className="h-3.5 w-3.5" />
                <span>Mở cổng</span>
              </Button>
            )}

            {row.status === "OPEN" && (
              <>
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
                    setSurveyStatus(row.id, "CLOSED");
                    setNotice(`Đã đóng cổng khảo sát "${row.title}".`);
                  }}
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>Đóng cổng</span>
                </Button>
              </>
            )}

            {row.status !== "DRAFT" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedAnalyticsId(row.id);
                  setActiveTab("analytics");
                }}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Thống kê</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label={`Nhân bản ${row.title}`}
              onClick={() => {
                const copy = duplicateSurvey(row.id);
                if (copy) {
                  setBuilderTarget({ kind: "SURVEY", id: copy.id });
                  setNotice(`Đã nhân bản "${row.title}" sang Bản nháp và mở trình biên tập câu hỏi.`);
                }
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>

            {editable && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Xóa ${row.title}`}
                className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                onClick={() => {
                  setErrorMsg(null);
                  setDeleteConfirmTarget({ kind: "SURVEY", id: row.id, title: row.title });
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-medium text-foreground">
            Quản trị Khảo sát &amp; Lấy ý kiến Sinh viên
          </h1>
          <p className="text-sm text-muted-foreground">
            Dựng biểu mẫu khảo sát, quản lý kho mẫu chuẩn, bảo vệ ẩn danh ngưỡng N ≥ 5 và tóm tắt AI khử PII 2 bước.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() =>
              setNotice("Đã xuất báo cáo thống kê khảo sát (.xlsx) đạt chuẩn đối chiếu.")
            }
          >
            <Download className="h-4 w-4" />
            <span>Xuất Excel (.xlsx)</span>
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Tạo khảo sát mới</span>
          </Button>
        </div>
      </div>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setNotice(null)}
            className="h-7 px-2.5 text-xs text-status-success hover:bg-status-success/15 hover:text-status-success"
          >
            Đóng
          </Button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-sm text-status-danger"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setErrorMsg(null)}
            className="h-7 px-2.5 text-xs text-status-danger hover:bg-status-danger/15 hover:text-status-danger"
          >
            Đóng
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-[460px]">
        <TabsList className="justify-start">
          <TabsTrigger value="surveys">Biểu mẫu Khảo sát ({surveys.length})</TabsTrigger>
          <TabsTrigger value="templates">Kho Mẫu Chuẩn ({templates.length})</TabsTrigger>
          <TabsTrigger value="analytics">Thống kê (N ≥ 5) &amp; Tóm tắt AI</TabsTrigger>
        </TabsList>

        {/* TAB 1: Surveys List */}
        <TabsContent value="surveys" className="mt-4">
          <DataTable columns={surveyColumns} data={surveys} />
        </TabsContent>

        {/* TAB 2: Reusable Survey Templates */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                <span>Kho Mẫu Khảo sát Chuẩn của Khoa</span>
              </CardTitle>
              <CardDescription>
                Chuẩn hóa bộ câu hỏi dùng lại cho các buổi hội thảo, khảo sát toàn Khoa và đánh giá nội bộ 4 Ban – 9 Tổ.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTplName.trim()) return;
                  const created = createTemplate({
                    name: newTplName.trim(),
                    defaultScope: newTplScope,
                    defaultMode: newTplMode
                  });
                  setNewTplName("");
                  setBuilderTarget({ kind: "TEMPLATE", id: created.id });
                  setNotice(`Đã tạo mẫu "${created.name}". Bạn có thể biên tập ngay bộ câu hỏi mẫu.`);
                }}
                className="grid gap-2.5 sm:grid-cols-12"
              >
                <Input
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  placeholder="Tên mẫu khảo sát chuẩn mới..."
                  className="sm:col-span-5"
                  aria-label="Tên mẫu khảo sát chuẩn mới"
                />
                <div className="sm:col-span-3">
                  <Select value={newTplScope} onValueChange={(v) => setNewTplScope(v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sau sự kiện">Sau sự kiện</SelectItem>
                      <SelectItem value="Toàn Khoa">Toàn Khoa</SelectItem>
                      <SelectItem value="Nội bộ Ban/Tổ">Nội bộ Ban/Tổ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Select value={newTplMode} onValueChange={(v) => setNewTplMode(v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDENTIFIED">Định danh</SelectItem>
                      <SelectItem value="ANONYMOUS">Ẩn danh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={!newTplName.trim()} className="sm:col-span-2">
                  <Plus className="h-4 w-4" />
                  <span>Thêm mẫu</span>
                </Button>
              </form>

              <div className="space-y-2">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-muted/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{tpl.name}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>Phạm vi: {tpl.defaultScope}</span>
                        <span>·</span>
                        <span>{tpl.defaultMode === "ANONYMOUS" ? "Ẩn danh" : "Định danh"}</span>
                        <span>·</span>
                        <span className="tabular-mono">{tpl.questions.length} câu hỏi</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleUseTemplate(tpl.id)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Dùng mẫu tạo khảo sát</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setBuilderTarget({ kind: "TEMPLATE", id: tpl.id })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>Sửa câu hỏi</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Xóa mẫu ${tpl.name}`}
                        className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                        onClick={() => {
                          setDeleteConfirmTarget({ kind: "TEMPLATE", id: tpl.id, title: tpl.name });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Analytics N >= 5 + 2-Step AI PII Redaction */}
        <TabsContent value="analytics" className="mt-4 space-y-5">
          {activeAnalyticsSurvey && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Label className="text-xs">Khảo sát đang phân tích:</Label>
                <div className="w-full max-w-md">
                  <Select value={activeAnalyticsSurvey.id} onValueChange={setSelectedAnalyticsId}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {surveys.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title} ({s.responsesCount} phản hồi)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isAnonLocked ? (
                <Card className="border-status-warning/35 bg-status-warning/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-status-warning">
                      <Lock className="h-5 w-5" />
                      <span>Đang khóa thống kê chi tiết (Ngưỡng Ẩn danh N ≥ 5)</span>
                    </CardTitle>
                    <CardDescription>
                      Khảo sát ẩn danh <strong>{activeAnalyticsSurvey.title}</strong> hiện mới có{" "}
                      <strong className="tabular-mono text-foreground">
                        {activeAnalyticsSurvey.responsesCount}/5
                      </strong>{" "}
                      phản hồi. Hệ thống chỉ mở hiển thị chi tiết khi đạt tối thiểu 5 phản hồi để chống suy đoán ngược danh tính người nộp.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="grid gap-5 lg:grid-cols-12">
                  <Card className="lg:col-span-5">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span>
                          Tổng hợp Định lượng ({activeAnalyticsSurvey.responsesCount} phản hồi)
                        </span>
                      </CardTitle>
                      <CardDescription>
                        Phân bố mức độ hài lòng tổng quan từ câu hỏi thang đánh giá.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {activeAnalyticsSurvey.responsesCount === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                          Chưa có phản hồi nào cho khảo sát này.
                        </p>
                      ) : (
                        activeAnalyticsSurvey.ratingBreakdown.map((bar) => (
                          <div key={bar.label} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-foreground">{bar.label}</span>
                              <span className="tabular-mono font-semibold text-primary">
                                {bar.pct}%
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${bar.pct}%` }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-7">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="h-4 w-4 text-brand-cyan" />
                        <span>Tóm tắt AI Khử Định danh 2 Bước (Bắt buộc Xem trước)</span>
                      </CardTitle>
                      <CardDescription>
                        Hệ thống tự động che MSSV/Email/SĐT. Cán bộ bắt buộc rà soát và che thêm tên riêng tiếng Việt còn sót trước khi xác nhận gửi sang AI.
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
                        aria-label="Nội dung góp ý đã khử định danh"
                      />

                      <form onSubmit={handleMaskCustomTerm} className="flex flex-wrap items-center gap-2">
                        <Input
                          value={customMaskTerm}
                          onChange={(e) => setCustomMaskTerm(e.target.value)}
                          placeholder="Nhập tên riêng / từ cần che (VD: anh Tuấn)..."
                          className="h-9 flex-1 min-w-[200px] text-xs"
                          aria-label="Tên riêng cần che"
                        />
                        <Button type="submit" size="sm" variant="outline" disabled={!customMaskTerm.trim()}>
                          Che thành [ĐÃ ẨN TÊN]
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRedactedPayload((prev) => autoRedactPii(prev));
                            setAiSummaryGenerated(false);
                          }}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Quét lại PII</span>
                        </Button>
                      </form>

                      <div className="flex justify-end pt-1">
                        <Button type="button" size="sm" onClick={() => setAiSummaryGenerated(true)}>
                          <Sparkles className="h-4 w-4" />
                          <span>Xác nhận Đã sạch PII &amp; Gửi AI Tóm tắt</span>
                        </Button>
                      </div>

                      {aiSummaryGenerated && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="space-y-1.5 rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs text-foreground"
                        >
                          <div className="font-semibold text-primary">
                            Báo cáo Tóm tắt 3 mục từ AI (Payload sạch PII):
                          </div>
                          <p>
                            1. <strong>Điểm mạnh:</strong> Nội dung chuyên môn thực chiến cao, hỗ trợ kỹ thuật nhanh.
                          </p>
                          <p>
                            2. <strong>Điểm cần cải thiện:</strong> Thời lượng Q&amp;A ngắn, lối check-in đầu giờ còn ùn nhẹ.
                          </p>
                          <p>
                            3. <strong>Đề xuất hành động:</strong> Mở thêm 1 bàn quét mã vạch 1D thẻ SV và gửi repo trước buổi học.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Create New Survey */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Biểu mẫu Khảo sát mới</DialogTitle>
            <DialogDescription>
              Khảo sát mới được tạo ở trạng thái Bản nháp (0 phản hồi) để bạn tùy chỉnh câu hỏi trước khi mở cổng cho sinh viên.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSurveySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-survey-title">Tên khảo sát</Label>
              <Input
                id="new-survey-title"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Đánh giá FIT Tech Talk: Kiến trúc Phân tán"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Phạm vi áp dụng</Label>
                <Select value={newScope} onValueChange={(v) => setNewScope(v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sau sự kiện">Sau sự kiện</SelectItem>
                    <SelectItem value="Toàn Khoa">Toàn Khoa</SelectItem>
                    <SelectItem value="Nội bộ Ban/Tổ">Nội bộ Ban/Tổ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Chế độ danh tính</Label>
                <Select value={newMode} onValueChange={(v) => setNewMode(v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IDENTIFIED">Định danh (Mở E-Cert)</SelectItem>
                    <SelectItem value="ANONYMOUS">Ẩn danh (Ngưỡng N ≥ 5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Khởi tạo từ mẫu chuẩn (tùy chọn)</Label>
              <Select value={newTemplateId} onValueChange={setNewTemplateId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BLANK">Bắt đầu từ Form trống (1 câu đánh giá sao)</SelectItem>
                  {templates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.questions.length} câu)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={!newTitle.trim()}>
                Tạo &amp; Mở trình dựng câu hỏi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Survey / Template Form Builder */}
      <Dialog open={Boolean(builderTarget)} onOpenChange={(o) => !o && setBuilderTarget(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeBuilderSurvey
                ? `Biên tập Form: ${activeBuilderSurvey.title}`
                : activeBuilderTemplate
                  ? `Biên tập Mẫu chuẩn: ${activeBuilderTemplate.name}`
                  : "Trình dựng Form Khảo sát"}
            </DialogTitle>
            <DialogDescription>
              {activeBuilderSurvey
                ? "Thêm, sửa, sắp xếp câu hỏi (Sao 1–5, Likert 5 mức, Chọn 1/nhiều phương án, Tự luận). Sinh viên mở đường dẫn khảo sát sẽ thấy ngay bộ câu hỏi này."
                : "Thay đổi trên mẫu chuẩn sẽ áp dụng cho các khảo sát mới khởi tạo từ mẫu này."}
            </DialogDescription>
          </DialogHeader>

          {activeBuilderSurvey && (
            <SurveyFormBuilder
              questions={activeBuilderSurvey.questions}
              locked={activeBuilderSurvey.status !== "DRAFT" || activeBuilderSurvey.responsesCount > 0}
              onChange={(next) =>
                updateSurvey(activeBuilderSurvey.id, { questions: next })
              }
            />
          )}

          {activeBuilderTemplate && (
            <SurveyFormBuilder
              questions={activeBuilderTemplate.questions}
              onChange={(next) =>
                updateTemplateQuestions(activeBuilderTemplate.id, next)
              }
            />
          )}

          <DialogFooter className="pt-2">
            {activeBuilderSurvey && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/surveys/${activeBuilderSurvey.id}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Xem trước Form sinh viên</span>
                </Link>
              </Button>
            )}
            <Button type="button" onClick={() => setBuilderTarget(null)}>
              Xong
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirm Delete Survey or Template (B13) */}
      <Dialog
        open={Boolean(deleteConfirmTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmTarget(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Xác nhận xóa {deleteConfirmTarget?.kind === "TEMPLATE" ? "mẫu khảo sát" : "biểu mẫu nháp"}
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa <strong>{deleteConfirmTarget?.title}</strong>? Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmTarget(null)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteConfirmTarget) return;
                if (deleteConfirmTarget.kind === "SURVEY") {
                  const ok = deleteSurvey(deleteConfirmTarget.id);
                  if (ok) setNotice(`Đã xóa biểu mẫu nháp "${deleteConfirmTarget.title}".`);
                } else {
                  deleteTemplate(deleteConfirmTarget.id);
                  setNotice(`Đã xóa mẫu chuẩn "${deleteConfirmTarget.title}".`);
                }
                setDeleteConfirmTarget(null);
              }}
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
