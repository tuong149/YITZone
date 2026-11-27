import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Flag,
  HelpCircle,
  Image as ImageIcon,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  UploadCloud
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatVietnameseDateTime } from "@/components/ui/date-time-picker";
import { cn } from "@/lib/utils";
import { useAwardCampaigns } from "./api";
import { cloneFreshCriteriaTree, INITIAL_AWARD_CYCLES } from "./sv5t-data";

function getCriterionProgress(criterion) {
  const conditions = criterion.conditions ?? [];
  const autoConditions = conditions.filter((c) => c.source === "YITZONE_AUTO");
  const externalConditions = conditions.filter((c) => c.source === "EXTERNAL_PROOF");
  const autoDone = autoConditions.filter((c) => c.achieved).length;
  const externalPending = externalConditions.filter((c) => !c.achieved).length;
  const autoPct = autoConditions.length > 0 ? Math.round((autoDone / autoConditions.length) * 100) : null;

  return { autoConditions, externalConditions, autoDone, externalPending, autoPct };
}

export function Sv5tPortalPage() {
  const { data: apiCampaigns } = useAwardCampaigns();
  const activeCycle = useMemo(() => {
    const fromApi = Array.isArray(apiCampaigns)
      ? apiCampaigns.find((c) => c.status === "OPEN") ?? apiCampaigns[0]
      : null;
    if (fromApi) return fromApi;
    return INITIAL_AWARD_CYCLES.find((c) => c.status === "OPEN") ?? INITIAL_AWARD_CYCLES[0] ?? null;
  }, [apiCampaigns]);

  const criteriaTree = useMemo(
    () =>
      Array.isArray(activeCycle?.criteriaTree) && activeCycle.criteriaTree.length > 0
        ? activeCycle.criteriaTree
        : cloneFreshCriteriaTree(),
    [activeCycle]
  );

  const [goalRegistered, setGoalRegistered] = useState(false);
  const [selectedAutoIds, setSelectedAutoIds] = useState([]);
  const [uploadedProofs, setUploadedProofs] = useState([]);
  const [selectedCriterionKey, setSelectedCriterionKey] = useState("DAO_DUC");
  const [uploadTarget, setUploadTarget] = useState(null);
  const [draggingConditionId, setDraggingConditionId] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  // UC-AWD-04 72h Appeal form
  const [appealText, setAppealText] = useState("");
  const [appealSent, setAppealSent] = useState(false);

  const selectedCriterionIndex = useMemo(
    () => Math.max(0, criteriaTree.findIndex((c) => c.key === selectedCriterionKey)),
    [criteriaTree, selectedCriterionKey]
  );

  const selectedCriterionObj = criteriaTree[selectedCriterionIndex] ?? criteriaTree[0] ?? null;

  const criteriaSubmissionStatus = useMemo(() => {
    const uploadedCondIds = new Set(uploadedProofs.map((p) => p.conditionId));
    return criteriaTree.map((crit) => {
      const conditions = crit.conditions ?? [];
      const mandatory = conditions.filter((c) => c.group === "MANDATORY");
      const optional = conditions.filter((c) => c.group === "OPTIONAL");
      const isConditionCovered = (cond) =>
        (cond.source === "YITZONE_AUTO" && cond.achieved && selectedAutoIds.includes(cond.id)) ||
        uploadedCondIds.has(cond.id);
      const mandatoryMetCount = mandatory.filter(isConditionCovered).length;
      const optionalMetCount = optional.filter(isConditionCovered).length;
      const mandatoryMissing = mandatory.length - mandatoryMetCount;
      const optionalMissing = Math.max(0, crit.optionalMinRequired - optionalMetCount);
      const ready = mandatoryMissing === 0 && optionalMissing === 0;
      return {
        key: crit.key,
        title: crit.title,
        ready,
        mandatoryMetCount,
        mandatoryTotal: mandatory.length,
        optionalMetCount,
        optionalMinRequired: crit.optionalMinRequired,
        missingCount: mandatoryMissing + optionalMissing
      };
    });
  }, [criteriaTree, selectedAutoIds, uploadedProofs]);

  const activeCriterionStatus =
    criteriaSubmissionStatus[selectedCriterionIndex] ?? criteriaSubmissionStatus[0];
  const readyCriteriaCount = criteriaSubmissionStatus.filter((c) => c.ready).length;

  const triggerFilePickerForCondition = (criterionObj, conditionObj) => {
    setUploadError(null);
    setUploadTarget({ criterionObj, conditionObj });
    fileInputRef.current?.click();
  };

  const toggleAutoEvidence = (id) => {
    setSelectedAutoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleUploadProof = (criterionObj, conditionObj, file) => {
    setUploadError(null);
    if (!file || !criterionObj || !conditionObj) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage) {
      setUploadError("Chỉ hỗ trợ tệp PDF (≤ 10MB) hoặc Ảnh JPG/PNG (≤ 5MB).");
      return;
    }

    const maxBytes = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(
        `Tệp "${file.name}" vượt giới hạn cho phép (${isPdf ? "PDF ≤ 10MB" : "Ảnh ≤ 5MB"}).`
      );
      return;
    }

    setUploadedProofs((prev) => [
      ...prev,
      {
        id: `up-${Date.now()}`,
        criterionKey: criterionObj.key,
        criterionTitle: criterionObj.title,
        conditionId: conditionObj.id,
        conditionLabel: conditionObj.label,
        fileName: file.name,
        sizeLabel: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        kind: isPdf ? "PDF" : "IMAGE"
      }
    ]);
  };

  const handleRemoveProof = (id) => {
    setUploadedProofs((prev) => prev.filter((item) => item.id !== id));
    setUploadError(null);
  };

  if (!activeCycle) {
    return (
      <div className="space-y-7">
        <section className="liquid-glass flex flex-col gap-4 rounded-[26px] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Phong trào &amp; Xét duyệt Sinh viên 5 tốt
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Đăng ký mục tiêu phấn đấu từ đầu năm học, tự động đồng bộ minh chứng E-Certificate từ YITZone và nộp hồ sơ
              xét duyệt trực tuyến khi mở đợt.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Button asChild variant="glass">
              <Link to="/public/honor-roll">
                <Trophy className="h-4 w-4 shrink-0" />
                <span>Bảng vàng Vinh danh</span>
              </Link>
            </Button>
          </div>
        </section>

        <Card className="rounded-[24px]">
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </div>
            <div className="max-w-lg space-y-1.5">
              <h2 className="font-display text-xl font-medium text-foreground">
                Chưa có đợt xét chọn Sinh viên 5 tốt nào đang mở
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Hiện tại Ban Thường vụ Đoàn – Hội Khoa CNTT chưa mở cổng tiếp nhận hồ sơ xét duyệt Sinh viên 5 tốt. Khi
                đợt xét mới được công bố, cây 5 tiêu chí và cổng nộp minh chứng sẽ hiển thị ngay tại đây.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-2 rounded-full">
              <Link to="/public/honor-roll">
                <Trophy className="h-4 w-4" />
                <span>Xem Bảng vàng Vinh danh các năm</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const myApplication = activeCycle.myApplication ?? null;

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
            duyệt {activeCycle.academicYear ? `đợt năm học ${activeCycle.academicYear}` : "trực tuyến"}.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant={goalRegistered ? "glass" : "default"}
            className="rounded-full"
            onClick={() => setGoalRegistered((v) => !v)}
          >
            <Flag className="h-4 w-4 shrink-0" />
            <span>
              {goalRegistered
                ? `Đã đăng ký mục tiêu ${activeCycle.academicYear ?? ""}`.trim()
                : "Đăng ký mục tiêu SV5T"}
            </span>
          </Button>
          <Button asChild variant="glass">
            <Link to="/public/honor-roll">
              <Trophy className="h-4 w-4 shrink-0" />
              <span>Bảng vàng Vinh danh</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* Active Cycle Banner */}
      <div className="flex flex-col gap-3 rounded-[18px] border border-brand-navy/25 bg-brand-navy/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-brand-cyan/25 dark:bg-brand-cyan/10">
        <div className="flex flex-wrap items-center gap-3">
          <VerifiedBadge label={`${activeCycle.name ?? "Đợt xét SV5T"} · Đang mở cổng`} />
          {activeCycle.deadline && (
            <span className="text-sm text-foreground">
              Hạn nộp hồ sơ:{" "}
              <strong className="tabular-mono font-semibold text-cal-deadline">
                {formatVietnameseDateTime(activeCycle.deadline, true)}
              </strong>
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          Cổng phúc khảo sau sơ khảo:{" "}
          <strong className="tabular-mono text-foreground">{activeCycle.appealHours ?? "72"} giờ</strong>
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
            {criteriaTree.map((criterion) => {
              const { autoDone, autoConditions, externalPending, autoPct } = getCriterionProgress(criterion);
              const conditions = criterion.conditions ?? [];
              const mandatoryList = conditions.filter((c) => c.group === "MANDATORY");
              const optionalList = conditions.filter((c) => c.group === "OPTIONAL");

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
                              ) : cond.achieved ? (
                                <Badge variant="success">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{cond.linkedBenefit ?? "Đã đạt"}</span>
                                </Badge>
                              ) : (
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
                              ) : cond.achieved ? (
                                <Badge variant="success">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{cond.linkedBenefit ?? "Đã đạt"}</span>
                                </Badge>
                              ) : (
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

        {/* TAB 2: UC-AWD-03 — Unified Criterion-by-Criterion Submission Workspace */}
        <TabsContent value="submit" className="mt-5 space-y-5">
          {/* Hidden shared file input bound dynamically to whichever sub-criterion row triggered upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (uploadTarget) {
                handleUploadProof(uploadTarget.criterionObj, uploadTarget.conditionObj, picked);
              }
              e.target.value = "";
            }}
            className="sr-only"
          />

          {applicationSubmitted && (
            <div className="flex items-center gap-3 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>
                Hồ sơ xét duyệt SV5T đã được nộp thành công ({readyCriteriaCount}/5 tiêu chí đủ minh chứng ·{" "}
                {selectedAutoIds.length} minh chứng YITZone · {uploadedProofs.length} tệp ngoài). Đang chờ Ban SV5T thẩm tra sơ bộ.
              </span>
            </div>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-12">
            {/* Left Rail: 5 Criteria Master Checklist + Overall Submit */}
            <aside className="space-y-3 lg:col-span-4 lg:sticky lg:top-20">
              <Card className="overflow-hidden rounded-[22px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">5 Tiêu chí SV5T</CardTitle>
                    <Badge
                      variant={readyCriteriaCount === 5 ? "success" : "warning"}
                      className="tabular-mono"
                    >
                      {readyCriteriaCount}/5 đủ
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Chọn từng tiêu chí bên dưới để rà soát và tải minh chứng trực tiếp cho từng mục còn thiếu.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-2 pt-0">
                  <nav aria-label="Danh sách 5 tiêu chí xét duyệt" className="space-y-1">
                    {criteriaSubmissionStatus.map((crit, idx) => {
                      const isActive = selectedCriterionKey === crit.key;
                      return (
                        <button
                          key={crit.key}
                          type="button"
                          onClick={() => {
                            setSelectedCriterionKey(crit.key);
                            setUploadError(null);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                              ? "bg-primary/[0.08] text-foreground"
                              : "hover:bg-muted/60 text-foreground/85"
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-mono",
                                crit.ready
                                  ? "bg-status-success/15 text-status-success"
                                  : isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-status-warning/15 text-status-warning"
                              )}
                            >
                              {crit.ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div
                                className={cn(
                                  "truncate text-sm",
                                  isActive ? "font-semibold text-primary" : "font-medium text-foreground"
                                )}
                              >
                                {crit.title}
                              </div>
                              <div className="tabular-mono text-[11px] text-muted-foreground">
                                Bắt buộc {crit.mandatoryMetCount}/{crit.mandatoryTotal} · Tùy chọn {crit.optionalMetCount}/{crit.optionalMinRequired}
                              </div>
                            </div>
                          </div>

                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                              crit.ready
                                ? "bg-status-success/12 text-status-success"
                                : "bg-status-warning/15 text-status-warning"
                            )}
                          >
                            {crit.ready ? "Đủ" : `Thiếu ${crit.missingCount}`}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </CardContent>

                <div className="space-y-3 border-t border-border bg-muted/25 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Minh chứng YITZone</span>
                    <span className="tabular-mono font-semibold text-foreground">{selectedAutoIds.length} mục</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Tệp minh chứng ngoài</span>
                    <span className="tabular-mono font-semibold text-foreground">{uploadedProofs.length} tệp</span>
                  </div>
                  <Button
                    type="button"
                    className="h-11 w-full rounded-xl"
                    disabled={selectedAutoIds.length === 0 && uploadedProofs.length === 0}
                    onClick={() => setApplicationSubmitted(true)}
                  >
                    <FileCheck2 className="h-4 w-4" />
                    <span>{applicationSubmitted ? "Cập nhật Hồ sơ SV5T" : "Nộp Hồ sơ Xét duyệt"}</span>
                  </Button>
                </div>
              </Card>
            </aside>

            {/* Right Workspace: Selected Criterion Sub-Criteria with Inline Proof Attachment */}
            {selectedCriterionObj && activeCriterionStatus && (
            <Card className="rounded-[22px] lg:col-span-8">
              <CardHeader className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5 text-primary" />
                    <span>
                      {selectedCriterionIndex + 1}. {selectedCriterionObj.title}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Giới hạn tệp minh chứng ngoài: <strong className="text-foreground">PDF ≤ 10MB</strong> hoặc{" "}
                    <strong className="text-foreground">Ảnh JPG/PNG ≤ 5MB</strong>. Kéo thả tệp trực tiếp vào từng mục bên dưới.
                  </CardDescription>
                </div>
                <Badge
                  variant={activeCriterionStatus.ready ? "success" : "warning"}
                  className="shrink-0 self-start sm:self-center"
                >
                  {activeCriterionStatus.ready
                    ? "Đã đủ điều kiện"
                    : `Còn thiếu ${activeCriterionStatus.missingCount} mục`}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-6 pt-5">
                {uploadError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-3.5 py-2.5 text-xs font-medium text-status-danger"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {[
                  {
                    groupKey: "MANDATORY",
                    heading: "(a) Tiêu chí bắt buộc — Phải đạt toàn bộ",
                    items: (selectedCriterionObj.conditions ?? []).filter((c) => c.group === "MANDATORY")
                  },
                  {
                    groupKey: "OPTIONAL",
                    heading: `(b) Tiêu chí khác — Đạt tối thiểu ${selectedCriterionObj.optionalMinRequired} điều kiện`,
                    items: (selectedCriterionObj.conditions ?? []).filter((c) => c.group === "OPTIONAL")
                  }
                ].map((section) => (
                  <section key={section.groupKey} className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {section.heading}
                    </h3>

                    <div className="space-y-3">
                      {section.items.map((cond) => {
                        const attachedFiles = uploadedProofs.filter((f) => f.conditionId === cond.id);
                        const isAutoAchieved = cond.source === "YITZONE_AUTO" && cond.achieved;
                        const isAutoSelected = isAutoAchieved && selectedAutoIds.includes(cond.id);
                        const isCovered = isAutoSelected || attachedFiles.length > 0;
                        const isMandatoryMissing = cond.group === "MANDATORY" && !isCovered;
                        const isDraggingHere = draggingConditionId === cond.id;

                        return (
                          <div
                            key={cond.id}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDraggingConditionId(cond.id);
                            }}
                            onDragLeave={() => setDraggingConditionId(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDraggingConditionId(null);
                              handleUploadProof(
                                selectedCriterionObj,
                                cond,
                                e.dataTransfer.files?.[0]
                              );
                            }}
                            className={cn(
                              "space-y-3 rounded-xl border p-4 transition-colors",
                              isDraggingHere
                                ? "border-primary bg-primary/[0.06]"
                                : isCovered
                                  ? "border-status-success/35 bg-status-success/[0.03]"
                                  : isMandatoryMissing
                                    ? "border-status-warning/45 bg-status-warning/[0.04]"
                                    : "border-border bg-card"
                            )}
                          >
                            {/* Top Row: Condition Title + Status Badge */}
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                              <div className="space-y-1">
                                <div className="text-sm font-medium leading-snug text-foreground">
                                  {cond.label}
                                </div>
                                {cond.source === "YITZONE_AUTO" && cond.achieved && cond.evidenceSummary && (
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-status-success">
                                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                    <span>{cond.evidenceSummary}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5">
                                {cond.linkedBenefit && (
                                  <Badge variant="info" className="text-[11px]">
                                    {cond.linkedBenefit}
                                  </Badge>
                                )}
                                {isCovered ? (
                                  <Badge variant="success">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Đã có minh chứng</span>
                                  </Badge>
                                ) : isMandatoryMissing ? (
                                  <Badge variant="warning">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Cần bổ sung</span>
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Tùy chọn</Badge>
                                )}
                              </div>
                            </div>

                            {/* Action Row: Auto-Sync Checkbox and/or Inline Upload Button */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                              {isAutoAchieved ? (
                                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                                  <input
                                    type="checkbox"
                                    checked={isAutoSelected}
                                    onChange={() => toggleAutoEvidence(cond.id)}
                                    className="h-4 w-4 rounded accent-primary"
                                  />
                                  <span>Đính kèm minh chứng tự động từ YITZone</span>
                                </label>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {attachedFiles.length > 0
                                    ? `Đã đính kèm ${attachedFiles.length} tệp minh chứng ngoài.`
                                    : "Chưa có tệp đính kèm — kéo thả tệp vào khung này hoặc bấm tải lên."}
                                </span>
                              )}

                              <Button
                                type="button"
                                size="sm"
                                variant={isCovered ? "outline" : "default"}
                                className="h-8 rounded-full px-3 text-xs"
                                onClick={() => triggerFilePickerForCondition(selectedCriterionObj, cond)}
                              >
                                <UploadCloud className="h-3.5 w-3.5" />
                                <span>
                                  {attachedFiles.length > 0 || isAutoAchieved
                                    ? "Tải thêm tệp"
                                    : "Tải minh chứng"}
                                </span>
                              </Button>
                            </div>

                            {/* Attached External Files for THIS Sub-Criterion */}
                            {attachedFiles.length > 0 && (
                              <ul className="space-y-1.5 pt-1">
                                {attachedFiles.map((f) => {
                                  const isPdf = f.kind === "PDF";
                                  return (
                                    <li
                                      key={f.id}
                                      className="flex items-center justify-between gap-2.5 rounded-lg border border-border bg-card px-3 py-2 text-xs"
                                    >
                                      <div className="flex min-w-0 items-center gap-2">
                                        <span
                                          className={cn(
                                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                                            isPdf
                                              ? "bg-status-danger/10 text-status-danger"
                                              : "bg-primary/10 text-primary"
                                          )}
                                        >
                                          {isPdf ? (
                                            <FileText className="h-3.5 w-3.5" />
                                          ) : (
                                            <ImageIcon className="h-3.5 w-3.5" />
                                          )}
                                        </span>
                                        <span className="truncate font-medium text-foreground" title={f.fileName}>
                                          {f.fileName}
                                        </span>
                                        <span aria-hidden="true" className="text-muted-foreground">·</span>
                                        <span className="shrink-0 tabular-mono text-muted-foreground">
                                          {f.sizeLabel}
                                        </span>
                                      </div>

                                      <div className="flex shrink-0 items-center gap-1.5">
                                        <Badge variant="secondary" className="text-[11px]">
                                          {isPdf ? "PDF" : "Ảnh"}
                                        </Badge>
                                        <button
                                          type="button"
                                          aria-label={`Xóa tệp ${f.fileName}`}
                                          title="Xóa tệp"
                                          onClick={() => handleRemoveProof(f.id)}
                                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-status-danger/10 hover:text-status-danger"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}

                {/* Prev / Next Criterion Footer */}
                <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={selectedCriterionIndex === 0}
                    onClick={() => {
                      const prev = criteriaTree[selectedCriterionIndex - 1];
                      if (prev) setSelectedCriterionKey(prev.key);
                    }}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Tiêu chí trước</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={selectedCriterionIndex === criteriaTree.length - 1}
                    onClick={() => {
                      const next = criteriaTree[selectedCriterionIndex + 1];
                      if (next) setSelectedCriterionKey(next.key);
                    }}
                  >
                    <span>Tiêu chí tiếp theo</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </TabsContent>

        {/* TAB 3: UC-AWD-04 — 72h Appeal Window */}
        <TabsContent value="appeal" className="mt-5">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Kết quả Sơ khảo &amp; Cổng Phúc khảo {activeCycle.appealHours ?? "72"} Giờ</CardTitle>
                <CardDescription>
                  Khi có tiêu chí bị đánh dấu Cần bổ sung hoặc Không đạt ở vòng sơ khảo, bạn có đúng {activeCycle.appealHours ?? "72"} giờ để gửi giải
                  trình kèm minh chứng bổ sung trước khi BTV khóa sổ.
                </CardDescription>
              </div>
              {myApplication?.appealRemainingLabel && (
                <Badge variant="warning" className="tabular-mono px-3 py-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Còn lại: {myApplication.appealRemainingLabel}</span>
                </Badge>
              )}
            </CardHeader>

            <CardContent className="space-y-5">
              {!myApplication ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 font-display text-lg font-medium text-foreground">
                    Chưa có kết quả thẩm tra sơ khảo
                  </p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Kết quả rà soát từng tiêu chí và biểu mẫu gửi đơn phúc khảo sẽ mở tại đây sau khi Ban SV5T hoàn tất thẩm tra sơ bộ hồ sơ của bạn.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-5">
                    {(myApplication.criteriaReview ?? []).map((item) => (
                      <div
                        key={item.key ?? item.title}
                        className="rounded-xl border border-border bg-muted/30 p-3 text-center"
                      >
                        <div className="text-xs font-semibold text-foreground">{item.title}</div>
                        <div className="mt-2">
                          {item.status === "OK" ? (
                            <Badge variant="success">Đạt sơ khảo</Badge>
                          ) : (
                            <Badge variant="warning">Cần bổ sung</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {myApplication.preliminaryNote && (
                    <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 text-sm text-foreground">
                      <div className="font-semibold text-status-warning">Ghi chú từ Ban SV5T:</div>
                      <p className="mt-1 text-muted-foreground">{myApplication.preliminaryNote}</p>
                    </div>
                  )}

                  {appealSent ? (
                    <div className="flex items-center gap-2.5 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-sm text-status-success">
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span>
                        Đã gửi đơn phúc khảo trong khung {activeCycle.appealHours ?? "72"} giờ. Hội đồng BCH/BTV sẽ phản hồi trước khi chốt Bảng vàng.
                      </span>
                    </div>
                  ) : (
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
                        <span>Gửi Phúc khảo (Trong hạn {activeCycle.appealHours ?? "72"}h)</span>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
