import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileUp,
  Flag,
  HelpCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  UploadCloud
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_CRITERIA_TREE, type Sv5tCriterion } from "./sv5t-data";

interface UploadedProof {
  id: string;
  criterionTitle: string;
  fileName: string;
  sizeLabel: string;
  kind: "PDF" | "IMAGE";
}

function getCriterionProgress(criterion: Sv5tCriterion) {
  const autoConditions = criterion.conditions.filter((c) => c.source === "YITZONE_AUTO");
  const externalConditions = criterion.conditions.filter((c) => c.source === "EXTERNAL_PROOF");
  const autoDone = autoConditions.filter((c) => c.achieved).length;
  const externalPending = externalConditions.filter((c) => !c.achieved).length;
  const autoPct = autoConditions.length > 0 ? Math.round((autoDone / autoConditions.length) * 100): null;

  return { autoConditions, externalConditions, autoDone, externalPending, autoPct };
}

export function Sv5tPortalPage(){
  const [goalRegistered, setGoalRegistered] = useState(true);
  const [selectedAutoIds, setSelectedAutoIds] = useState<string[]>([
    "dd-m2",
    "dd-o1",
    "ht-o1",
    "tl-o1",
    "tn-m1",
    "tn-o1",
    "hn-o1"
  ]);
  const [uploadedProofs, setUploadedProofs] = useState<UploadedProof[]>([
    {
      id: "up-1",
      criterionTitle: "Học tập tốt",
      fileName: "BangDiem_HK1_HK2_22110345.pdf",
      sizeLabel: "1.4 MB",
      kind: "PDF"
    },
    {
      id: "up-2",
      criterionTitle: "Hội nhập tốt",
      fileName: "TOEIC_785_Certificate.jpg",
      sizeLabel: "1.8 MB",
      kind: "IMAGE"
    }
  ]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  // UC-AWD-04 72h Appeal form
  const [appealText, setAppealText] = useState("");
  const [appealSent, setAppealSent] = useState(false);

  const autoEvidences = useMemo(() =>
      INITIAL_CRITERIA_TREE.flatMap((crit) =>
        crit.conditions
.filter((c) => c.source === "YITZONE_AUTO" && c.achieved)
.map((c) => ({...c, criterionTitle: crit.title }))
      ),
    []
  );

  const toggleAutoEvidence = (id: string) => {
    setSelectedAutoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id): [...prev, id]
    );
  };

  const handleUploadProof = (criterionTitle: string, file?: File) => {
    setUploadError(null);
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      setUploadError("Chỉ hỗ trợ tệp PDF (≤ 10MB) hoặc Ảnh JPG/PNG (≤ 5MB).");
      return;
    }

    const maxBytes = isPdf ? 10 * 1024 * 1024: 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(
        `Tệp "${file.name}" vượt giới hạn cho phép (${isPdf ? "PDF ≤ 10MB": "Ảnh ≤ 5MB"}).`
      );
      return;
    }

    setUploadedProofs((prev) => [
...prev,
      {
        id: `up-${Date.now()}`,
        criterionTitle,
        fileName: file.name,
        sizeLabel: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        kind: isPdf ? "PDF": "IMAGE"
      }
    ]);
  };

  return (
    <div className="space-y-7">
      {/* Unified Liquid Glass Page Header */}
      <section className="liquid-glass flex flex-col gap-4 rounded-[26px] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Phong trào &amp; Xét duyệt Sinh viên 5 tốt
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Đăng ký mục tiêu từ đầu năm học, tự động đồng bộ minh chứng E-Certificate từ YITZone và nộp hồ sơ xét
            duyệt đợt năm học 2025–2026.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant={goalRegistered ? "outline": "default"}
            className="rounded-full"
            onClick={() => setGoalRegistered((v) => !v)}
          >
            <Flag className="h-4 w-4" />
            <span>{goalRegistered ? "Đã đăng ký mục tiêu 2025–2026": "Đăng ký mục tiêu SV5T"}</span>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/public/honor-roll">
              <Trophy className="h-4 w-4 text-brand-navy dark:text-brand-cyan" />
              <span>Bảng vàng Vinh danh</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* Active Cycle Banner */}
      <div className="flex flex-col gap-3 rounded-[18px] border border-brand-navy/25 bg-brand-navy/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-brand-cyan/25 dark:bg-brand-cyan/10">
        <div className="flex flex-wrap items-center gap-3">
          <VerifiedBadge label="Đợt xét SV5T 2025–2026 · Đang mở cổng" />
          <span className="text-sm text-foreground">
            Hạn nộp hồ sơ:{" "}
            <strong className="tabular-mono font-semibold text-cal-deadline">30/11/2026 · 23:59</strong>
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Cổng phúc khảo sau sơ khảo: <strong className="tabular-mono text-foreground">72 giờ</strong>
        </span>
      </div>

      <Tabs defaultValue="progress" className="min-h-[540px]">
        <TabsList className="justify-start">
          <TabsTrigger value="progress">Tiến độ 5 Tiêu chí</TabsTrigger>
          <TabsTrigger value="submit">Nộp Hồ sơ Xét duyệt</TabsTrigger>
          <TabsTrigger value="appeal">Sơ khảo &amp; Phúc khảo 72h</TabsTrigger>
        </TabsList>

        {/* TAB 1: UC-AWD-02 — 5 Criteria Tree */}
        <TabsContent value="progress" className="mt-5 space-y-5">
          {!goalRegistered && (
            <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">
              Bạn chưa đăng ký mục tiêu phấn đấu SV5T năm học này. Bấm &ldquo;Đăng ký mục tiêu SV5T&rdquo; ở góc trên để
              Ban SV5T gửi nhắc nhở tự động khi thiếu tiêu chí.
            </div>
          )}

          <div className="space-y-4">
            {INITIAL_CRITERIA_TREE.map((criterion) => {
              const { autoDone, autoConditions, externalPending, autoPct } = getCriterionProgress(criterion);
              const mandatoryList = criterion.conditions.filter((c) => c.group === "MANDATORY");
              const optionalList = criterion.conditions.filter((c) => c.group === "OPTIONAL");

              return (
                <Card key={criterion.key}>
                  <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Award className="h-5 w-5 text-primary" />
                        <span>{criterion.title}</span>
                      </CardTitle>
                      <CardDescription>
                        Bắt buộc đạt toàn bộ nhóm (a) và đạt tối thiểu{" "}
                        <span className="tabular-mono font-semibold text-foreground">
                          {criterion.optionalMinRequired}/{optionalList.length}
                        </span>{" "}
                        điều kiện ở nhóm (b).
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {autoPct !== null && (
                        <Badge variant="success" className="tabular-mono">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>
                            YITZone: {autoDone}/{autoConditions.length} ({autoPct}%)
                          </span>
                        </Badge>
                      )}
                      {externalPending > 0 && (
                        <Badge variant="warning">
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>Chờ minh chứng ngoài</span>
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="grid gap-4 lg:grid-cols-2">
                    {/* Group A: Mandatory */}
                    <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4">
                      <div className="text-xs font-semibold text-foreground">
                        (a) Tiêu chí bắt buộc — Phải đạt toàn bộ
                      </div>
                      <ul className="space-y-2.5">
                        {mandatoryList.map((cond) => (
                          <li key={cond.id} className="flex items-start justify-between gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="text-foreground">{cond.label}</div>
                              {cond.evidenceSummary && (
                                <div className="text-xs text-status-success">{cond.evidenceSummary}</div>
                              )}
                            </div>
                            <div className="shrink-0">
                              {cond.source === "EXTERNAL_PROOF" && !cond.achieved ? (
                                <Badge variant="warning">Chờ minh chứng ngoài</Badge>
                              ): cond.achieved ? (
                                <Badge variant="success">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{cond.linkedBenefit ?? "Đã đạt"}</span>
                                </Badge>
                              ): (
                                <Badge variant="secondary">Chưa hoàn thành</Badge>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Group B: Optional min n */}
                    <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-4">
                      <div className="text-xs font-semibold text-foreground">
                        (b) Tiêu chí khác — Đạt tối thiểu{" "}
                        <span className="tabular-mono">{criterion.optionalMinRequired}</span> điều kiện
                      </div>
                      <ul className="space-y-2.5">
                        {optionalList.map((cond) => (
                          <li key={cond.id} className="flex items-start justify-between gap-3 text-sm">
                            <div className="space-y-1">
                              <div className="text-foreground">{cond.label}</div>
                              {cond.evidenceSummary && (
                                <div className="text-xs text-status-success">{cond.evidenceSummary}</div>
                              )}
                            </div>
                            <div className="shrink-0">
                              {cond.source === "EXTERNAL_PROOF" && !cond.achieved ? (
                                <Badge variant="warning">Chờ minh chứng ngoài</Badge>
                              ): cond.achieved ? (
                                <Badge variant="success">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{cond.linkedBenefit ?? "Đã đạt"}</span>
                                </Badge>
                              ): (
                                <Badge variant="outline">Tùy chọn</Badge>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: UC-AWD-03 — Application Submission */}
        <TabsContent value="submit" className="mt-5 space-y-5">
          {applicationSubmitted && (
            <div className="flex items-center gap-3 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>
                Hồ sơ xét duyệt SV5T 2025–2026 đã được nộp thành công ({selectedAutoIds.length} minh chứng YITZone +{" "}
                {uploadedProofs.length} tệp minh chứng ngoài). Đang chờ CTV Ban SV5T thẩm tra sơ bộ.
              </span>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-12">
            {/* Auto-attached YITZone Evidence */}
            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Minh chứng tự động đồng bộ từ YITZone</span>
                </CardTitle>
                <CardDescription>
                  Hệ thống tự động gợi ý các hoạt động có E-Certificate xác thực (`Cộng ĐRL`, `Cộng CTXH`, `Cộng
                  CĐDN`, Kết quả OJ). Không cần tải lại tệp giấy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {autoEvidences.map((ev) => {
                  const checked = selectedAutoIds.includes(ev.id);
                  return (
                    <label
                      key={ev.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors ${
                        checked
                          ? "border-primary/40 bg-primary/5"
: "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAutoEvidence(ev.id)}
                        className="mt-1 h-4 w-4 accent-primary"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{ev.criterionTitle}</span>
                          {ev.linkedBenefit && <Badge variant="info">{ev.linkedBenefit}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{ev.evidenceSummary}</p>
                      </div>
                    </label>
                  );
                })}
              </CardContent>
            </Card>

            {/* External Proof Uploader */}
            <Card className="lg:col-span-5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-primary" />
                  <span>Tải lên Minh chứng Ngoài</span>
                </CardTitle>
                <CardDescription>
                  Bảng điểm học kỳ, Chứng chỉ ngoại ngữ (IELTS/TOEIC), Giấy xác nhận Thể lực. Giới hạn{" "}
                  <strong className="text-foreground">PDF ≤ 10MB</strong> hoặc{" "}
                  <strong className="text-foreground">Ảnh ≤ 5MB</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sv5t-file-upload">Chọn tệp minh chứng bổ sung</Label>
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-3">
                    <FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      id="sv5t-file-upload"
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleUploadProof("Thể lực tốt", e.target.files?.[0])}
                      className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/12 file:px-3 py-1 file:text-xs file:font-semibold file:text-primary"
                    />
                  </div>
                  {uploadError && (
                    <p className="text-xs font-medium text-status-danger">{uploadError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">
                    Danh sách tệp đính kèm ({uploadedProofs.length})
                  </div>
                  {uploadedProofs.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{f.fileName}</div>
                        <div className="text-muted-foreground">
                          {f.criterionTitle}<span className="tabular-mono">{f.sizeLabel}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="tabular-mono">
                        {f.kind}
                      </Badge>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={selectedAutoIds.length === 0 || uploadedProofs.length === 0}
                  onClick={() => setApplicationSubmitted(true)}
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>{applicationSubmitted ? "Cập nhật Hồ sơ SV5T": "Nộp Hồ sơ Xét duyệt SV5T"}</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: UC-AWD-04 — 72h Appeal Window */}
        <TabsContent value="appeal" className="mt-5">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Kết quả Sơ khảo &amp; Cổng Phúc khảo 72 Giờ</CardTitle>
                <CardDescription>
                  Khi có tiêu chí bị đánh dấu Cần bổ sung hoặc Không đạt ở vòng sơ khảo, bạn có đúng 72 giờ để gửi giải
                  trình kèm minh chứng bổ sung trước khi BTV khóa sổ.
                </CardDescription>
              </div>
              <Badge variant="warning" className="tabular-mono px-3 py-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Còn lại: 46:18:05</span>
              </Badge>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-5">
                {[
                  { name: "Đạo đức tốt", ok: true },
                  { name: "Học tập tốt", ok: true },
                  { name: "Thể lực tốt", ok: false },
                  { name: "Tình nguyện tốt", ok: true },
                  { name: "Hội nhập tốt", ok: true }
                ].map((item) => (
                  <div
                    key={item.name}
                    className="rounded-xl border border-border bg-muted/30 p-3 text-center"
                  >
                    <div className="text-xs font-semibold text-foreground">{item.name}</div>
                    <div className="mt-2">
                      {item.ok ? (
                        <Badge variant="success">Đạt sơ khảo</Badge>
                      ): (
                        <Badge variant="warning">Cần bổ sung</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 text-sm text-foreground">
                <div className="font-semibold text-status-warning">Ghi chú từ Ban SV5T (Tiêu chí Thể lực tốt):</div>
                <p className="mt-1 text-muted-foreground">
                  Ảnh giấy xác nhận &ldquo;Thanh niên khỏe&rdquo; bị mờ con dấu đơn vị cấp. Vui lòng tải lại bản scan rõ
                  nét hoặc đính kèm chứng nhận hoàn thành giải chạy HCM-UTE Run.
                </p>
              </div>

              {appealSent ? (
                <div className="flex items-center gap-2.5 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>
                    Đã gửi đơn phúc khảo trong khung 72 giờ. Hội đồng BCH/BTV sẽ phản hồi trước khi chốt Bảng vàng.
                  </span>
                </div>
              ): (
                <div className="space-y-3">
                  <Label htmlFor="sv5t-appeal-text">Nội dung giải trình phúc khảo</Label>
                  <Textarea
                    id="sv5t-appeal-text"
                    rows={3}
                    value={appealText}
                    onChange={(e) => setAppealText(e.target.value)}
                    placeholder="Trình bày căn cứ giải trình và thông tin minh chứng bổ sung..."
                  />
                  <Button
                    type="button"
                    disabled={appealText.trim().length < 12}
                    onClick={() => setAppealSent(true)}
                  >
                    <Send className="h-4 w-4" />
                    <span>Gửi Phúc khảo (Trong hạn 72h)</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
