import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BellRing,
  CheckCircle2,
  ExternalLink,
  Lock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Trophy,
  XCircle
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
import {
  INITIAL_APPLICATIONS,
  INITIAL_CRITERIA_TREE,
  type CriterionKey,
  type Sv5tApplication,
  type Sv5tCriterion
} from "./sv5t-data";

const CURRENT_REVIEWER_USER_ID = "22110345"; // Triggers Conflict-of-Interest guard on app-01!

export function Sv5tAdminPage(){
  const [applications, setApplications] = useState<Sv5tApplication[]>(INITIAL_APPLICATIONS);
  const [criteriaTree, setCriteriaTree] = useState<Sv5tCriterion[]>(INITIAL_CRITERIA_TREE);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UC-AWD-01 CRUD state
  const [selectedCritKey, setSelectedCritKey] = useState<CriterionKey>("DAO_DUC");
  const [newCondLabel, setNewCondLabel] = useState("");
  const [newCondGroup, setNewCondGroup] = useState<"MANDATORY" | "OPTIONAL">("OPTIONAL");
  const [newCondSource, setNewCondSource] = useState<"YITZONE_AUTO" | "EXTERNAL_PROOF">("YITZONE_AUTO");
  const [cycleName, setCycleName] = useState("Sinh viên 5 tốt Khoa CNTT — Năm học 2025–2026");
  const [appealHours, setAppealHours] = useState("72");

  // Audit dialogs for UC-AWD-04 & UC-AWD-05
  const [decisionModal, setDecisionModal] = useState<{
    app: Sv5tApplication;
    nextStatus: "APPROVED" | "REJECTED" | "NEEDS_SUPPLEMENT";
    label: string;
  } | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [honorRollPublished, setHonorRollPublished] = useState(false);

  const selectedCriterion = criteriaTree.find((c) => c.key === selectedCritKey)!;

  const handleScreenPreliminary = (app: Sv5tApplication) => {
    if (app.userId === CURRENT_REVIEWER_USER_ID) return;
    setApplications((prev) =>
      prev.map((item) =>
        item.id === app.id
          ? {
...item,
              preliminaryStatus: "SCREENED_OK",
              preliminaryNote: "Đã thẩm tra sơ bộ bởi CTV Ban SV5T — Đủ điều kiện trình Hội đồng."
            }
: item
      )
    );
    setBannerMsg(`Đã hoàn tất thẩm tra sơ bộ hồ sơ ${app.mssv} · ${app.fullName}.`);
  };

  const handleAddCondition = () => {
    if (!newCondLabel.trim()) return;
    setErrorMsg(null);
    setCriteriaTree((prev) =>
      prev.map((crit) =>
        crit.key === selectedCritKey
          ? {
...crit,
              conditions: [
...crit.conditions,
                {
                  id: `${crit.key.toLowerCase()}-${Date.now()}`,
                  label: newCondLabel.trim(),
                  group: newCondGroup,
                  source: newCondSource,
                  achieved: false,
                  attachedApplicationsCount: 0
                }
              ]
            }
: crit
      )
    );
    setNewCondLabel("");
    setBannerMsg(`Đã thêm điều kiện mới vào tiêu chí "${selectedCriterion.title}".`);
  };

  const handleDeleteCondition = (critKey: CriterionKey, condId: string, attachedCount: number) => {
    setErrorMsg(null);
    if (attachedCount > 0) {
      setErrorMsg(
        `Không thể xóa điều kiện này: hiện đã có ${attachedCount} hồ sơ sinh viên đính kèm minh chứng.`
      );
      return;
    }
    setCriteriaTree((prev) =>
      prev.map((crit) =>
        crit.key === critKey
          ? {...crit, conditions: crit.conditions.filter((c) => c.id !== condId) }
: crit
      )
    );
    setBannerMsg("Đã xóa điều kiện phụ chưa phát sinh hồ sơ đính kèm.");
  };

  const handleOptionalMinChange = (critKey: CriterionKey, value: number) => {
    setCriteriaTree((prev) =>
      prev.map((crit) =>
        crit.key === critKey ? {...crit, optionalMinRequired: Math.max(1, value) }: crit
      )
    );
  };

  const appColumns: DataTableColumn<Sv5tApplication>[] = [
    {
      key: "student",
      header: "Ứng viên & Minh chứng",
      render: (row) => {
        const isSelf = row.userId === CURRENT_REVIEWER_USER_ID;
        return (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tabular-mono font-semibold text-foreground">{row.mssv}</span>
              <span className="font-medium text-foreground">{row.fullName}</span>
              {isSelf && (
                <Badge variant="danger">
                  <Lock className="h-3 w-3" />
                  <span>Khóa xung đột lợi ích</span>
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.major} ({row.cohort}) · Tự động:{" "}
              <span className="tabular-mono font-medium text-foreground">{row.autoEvidenceCount}</span>Ngoài:{" "}
              <span className="tabular-mono font-medium text-foreground">{row.externalFilesCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">{row.preliminaryNote}</p>
            {row.appealNote && (
              <p className="text-xs font-medium text-status-warning">
                Đơn phúc khảo 72h: {row.appealNote}
              </p>
            )}
          </div>
        );
      }
    },
    {
      key: "prelim",
      header: "Bước 1 · Ban SV5T",
      render: (row) => {
        if (row.preliminaryStatus === "SCREENED_OK") {
          return <Badge variant="success">Đã thẩm tra đạt</Badge>;
        }
        if (row.preliminaryStatus === "MISSING_DOCS") {
          return <Badge variant="warning">Thiếu minh chứng</Badge>;
        }
        return <Badge variant="secondary">Chờ thẩm tra</Badge>;
      }
    },
    {
      key: "council",
      header: "Bước 2 · Hội đồng",
      render: (row) => {
        if (row.councilStatus === "APPROVED") return <Badge variant="success">Đạt SV5T</Badge>;
        if (row.councilStatus === "REJECTED") return <Badge variant="danger">Không đạt</Badge>;
        if (row.councilStatus === "NEEDS_SUPPLEMENT") return <Badge variant="warning">Cần bổ sung</Badge>;
        return <Badge variant="outline">Chờ chấm duyệt</Badge>;
      }
    },
    {
      key: "actions",
      header: "Xử lý & Chống xung đột",
      align: "right",
      render: (row) => {
        const isSelf = row.userId === CURRENT_REVIEWER_USER_ID;
        if (isSelf) {
          return (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-status-danger/30 bg-status-danger/10 px-2.5 py-1.5 text-xs font-semibold text-status-danger">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Khóa tự chấm hồ sơ cá nhân</span>
            </span>
          );
        }

        return (
          <div className="flex flex-wrap justify-end gap-1.5">
            {row.preliminaryStatus === "PENDING" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleScreenPreliminary(row)}
              >
                Thẩm tra sơ bộ
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() =>
                setDecisionModal({
                  app: row,
                  nextStatus: "APPROVED",
                  label: "Chấm Đạt SV5T"
                })
              }
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Đạt</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setDecisionModal({
                  app: row,
                  nextStatus: "NEEDS_SUPPLEMENT",
                  label: "Yêu cầu bổ sung"
                })
              }
            >
              Bổ sung
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
              onClick={() =>
                setDecisionModal({
                  app: row,
                  nextStatus: "REJECTED",
                  label: "Từ chối hồ sơ"
                })
              }
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      }
    }
  ];

  const approvedCount = applications.filter((a) => a.councilStatus === "APPROVED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-foreground">
            Hội đồng Xét duyệt Sinh viên 5 tốt
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cấu hình cây 5 tiêu chí, thẩm tra sơ bộ Ban SV5T, chấm duyệt Hội đồng có khóa xung đột lợi ích và chốt Bảng
            vàng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/public/honor-roll">
              <Trophy className="h-3.5 w-3.5" />
              <span>Bảng vàng Công khai</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
          <Button type="button" size="sm" onClick={() => setPublishDialogOpen(true)}>
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>BTV Chốt &amp; Công bố Bảng vàng</span>
          </Button>
        </div>
      </div>

      {bannerMsg && (
        <div className="flex items-center justify-between rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {bannerMsg}
          </span>
          <button type="button" onClick={() => setBannerMsg(null)} className="text-xs font-semibold underline">
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

      <Tabs defaultValue="review" className="min-h-[520px]">
        <TabsList className="justify-start">
          <TabsTrigger value="review">Thẩm tra &amp; Chấm duyệt ({applications.length})</TabsTrigger>
          <TabsTrigger value="criteria">Cấu hình Cây 5 Tiêu chí</TabsTrigger>
          <TabsTrigger value="cohort">Tiến độ Toàn Khoa &amp; Chốt Bảng vàng</TabsTrigger>
        </TabsList>

        {/* TAB 1: UC-AWD-04 Review Queue */}
        <TabsContent value="review" className="mt-4 space-y-4">
          <div className="flex items-start gap-2.5 rounded-xl border border-brand-navy/25 bg-brand-navy/5 px-4 py-3 text-xs text-foreground dark:border-brand-cyan/25 dark:bg-brand-cyan/10">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-navy dark:text-brand-cyan" />
            <span>
              <strong>Chống xung đột lợi ích:</strong> Tài khoản cán bộ hiện tại (
              <span className="tabular-mono font-semibold">{CURRENT_REVIEWER_USER_ID}</span>) bị tự động khóa toàn bộ
              nút thẩm tra và chấm duyệt trên hồ sơ của chính mình. Mọi quyết định chấm duyệt đều yêu cầu lý do và ghi{" "}
              <span className="tabular-mono font-semibold">Audit Log</span>.
            </span>
          </div>

          <DataTable
            columns={appColumns}
            data={applications}
            emptyTitle="Chưa có hồ sơ nộp"
            emptyDescription="Hồ sơ sinh viên nộp trong đợt xét sẽ hiển thị tại đây."
          />
        </TabsContent>

        {/* TAB 2: UC-AWD-01 Criteria Tree CRUD */}
        <TabsContent value="criteria" className="mt-4 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin Đợt Xét duyệt Danh hiệu</CardTitle>
              <CardDescription>Chỉ Ban Thường vụ (`BTV`) có quyền mở đợt và công bố bộ tiêu chí.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cycle-name">Tên đợt xét duyệt</Label>
                <Input id="cycle-name" value={cycleName} onChange={(e) => setCycleName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="appeal-hours">Thời hạn phúc khảo (giờ)</Label>
                <Input
                  id="appeal-hours"
                  type="number"
                  value={appealHours}
                  onChange={(e) => setAppealHours(e.target.value)}
                  className="tabular-mono"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-12">
            {/* Left selector of 5 criteria */}
            <div className="space-y-2 lg:col-span-4">
              {criteriaTree.map((crit) => {
                const active = crit.key === selectedCritKey;
                return (
                  <button
                    key={crit.key}
                    type="button"
                    onClick={() => setSelectedCritKey(crit.key)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
: "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div>
                      <div className="font-display text-base font-medium text-foreground">{crit.title}</div>
                      <div className="text-xs text-muted-foreground tabular-mono">
                        {crit.conditions.length} điều kiện · Tùy chọn tối thiểu {crit.optionalMinRequired}
                      </div>
                    </div>
                    <Award className={`h-4 w-4 ${active ? "text-primary": "text-muted-foreground"}`} />
                  </button>
                );
              })}
            </div>

            {/* Right CRUD editor */}
            <Card className="lg:col-span-8">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Điều kiện cần đạt — {selectedCriterion.title}</CardTitle>
                  <CardDescription>
                    Chặn xóa các điều kiện đã có hồ sơ sinh viên đính kèm minh chứng.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="min-opt" className="whitespace-nowrap text-xs">
                    Nhóm (b) đạt tối thiểu:
                  </Label>
                  <Input
                    id="min-opt"
                    type="number"
                    min={1}
                    value={selectedCriterion.optionalMinRequired}
                    onChange={(e) =>
                      handleOptionalMinChange(selectedCriterion.key, Number(e.target.value) || 1)
                    }
                    className="h-8 w-16 tabular-mono"
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {selectedCriterion.conditions.map((cond) => (
                    <div
                      key={cond.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3.5"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={cond.group === "MANDATORY" ? "danger": "info"}>
                            {cond.group === "MANDATORY" ? "(a) Bắt buộc": "(b) Tiêu chí khác"}
                          </Badge>
                          <Badge variant="secondary">
                            {cond.source === "YITZONE_AUTO" ? "Tự động YITZone": "Minh chứng ngoài"}
                          </Badge>
                          <span className="tabular-mono text-[11px] text-muted-foreground">
                            {cond.attachedApplicationsCount} hồ sơ đính kèm
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{cond.label}</p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleDeleteCondition(
                            selectedCriterion.key,
                            cond.id,
                            cond.attachedApplicationsCount
                          )
                        }
                        title={
                          cond.attachedApplicationsCount > 0
                            ? "Đã có hồ sơ đính kèm — Bấm để xem cảnh báo chặn xóa"
: "Xóa điều kiện phụ"
                        }
                        className="shrink-0 text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add new condition form */}
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <div className="text-xs font-semibold text-foreground">Thêm điều kiện phụ mới</div>
                  <Input
                    value={newCondLabel}
                    onChange={(e) => setNewCondLabel(e.target.value)}
                    placeholder="VD: Tham gia ít nhất 01 Hội thảo chuyên đề AI / An toàn thông tin cấp Khoa"
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Select
                      value={newCondGroup}
                      onValueChange={(v) => setNewCondGroup(v as "MANDATORY" | "OPTIONAL")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANDATORY">(a) Tiêu chí bắt buộc</SelectItem>
                        <SelectItem value="OPTIONAL">(b) Tiêu chí khác</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={newCondSource}
                      onValueChange={(v) => setNewCondSource(v as "YITZONE_AUTO" | "EXTERNAL_PROOF")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YITZONE_AUTO">Tự động YITZone</SelectItem>
                        <SelectItem value="EXTERNAL_PROOF">Chờ minh chứng ngoài</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button type="button" disabled={!newCondLabel.trim()} onClick={handleAddCondition}>
                      <Plus className="h-4 w-4" />
                      <span>Thêm điều kiện</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: UC-AWD-02 & UC-AWD-05 Cohort & Publish */}
        <TabsContent value="cohort" className="mt-4 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Đã đăng ký mục tiêu đầu năm</CardDescription>
                <CardTitle className="tabular-mono text-3xl">184</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Sinh viên K22–K25 đang theo dõi tiến độ 5 tiêu chí trên YITZone.
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Đạt ≥ 3 tiêu chí tự động</CardDescription>
                <CardTitle className="tabular-mono text-3xl text-status-info">92</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Phần lớn đang ở trạng thái &ldquo;Chờ minh chứng ngoài&rdquo; (GPA, Thể lực, Ngoại ngữ).
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Đã được Hội đồng chấm Đạt</CardDescription>
                <CardTitle className="tabular-mono text-3xl text-status-success">{approvedCount}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Sẵn sàng xuất danh sách hành chính &amp; phát hành E-Cert danh hiệu.
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Điều phối Phong trào &amp; Chốt Kết quả Đợt xét</CardTitle>
              <CardDescription>
                Ban SV5T gửi thông báo nhắc bổ sung tiêu chí còn thiếu; duy nhất BTV có quyền chốt kết quả cuối cùng.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setBannerMsg(
                    "Đã gửi thông báo đẩy (Web Push + In-app) nhắc 92 sinh viên bổ sung minh chứng ngoài trước hạn."
                  )
                }
              >
                <BellRing className="h-4 w-4" />
                <span>Nhắc nhở sinh viên thiếu tiêu chí</span>
              </Button>

              <Button type="button" onClick={() => setPublishDialogOpen(true)}>
                <Trophy className="h-4 w-4" />
                <span>
                  {honorRollPublished
                    ? "Đã công bố Bảng vàng & Phát hành E-Cert"
: "BTV Chốt kết quả & Công bố Bảng vàng"}
                </span>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Audit Dialog for Council Decision (UC-AWD-04) */}
      <AuditActionDialog
        open={Boolean(decisionModal)}
        onOpenChange={(o) => !o && setDecisionModal(null)}
        title={decisionModal?.label ?? "Chấm duyệt Hồ sơ SV5T"}
        description="Quyết định của Hội đồng (BCH/BTV) sẽ được lưu vào Audit Log bất biến và gửi thông báo tới ứng viên."
        targetSummary={
          decisionModal ? `${decisionModal.app.mssv} · ${decisionModal.app.fullName}`: ""
        }
        actionCode={`SV5T_COUNCIL_${decisionModal?.nextStatus ?? "DECISION"}`}
        destructive={decisionModal?.nextStatus === "REJECTED"}
        confirmLabel="Xác nhận quyết định & Ghi Audit Log"
        onConfirm={() => {
          if (!decisionModal) return;
          setApplications((prev) =>
            prev.map((a) =>
              a.id === decisionModal.app.id ? {...a, councilStatus: decisionModal.nextStatus }: a
            )
          );
          setBannerMsg(
            `Đã cập nhật kết quả "${decisionModal.label}" cho ${decisionModal.app.mssv} và ghi Audit Log.`
          );
          setDecisionModal(null);
        }}
      />

      {/* Audit Dialog for BTV Final Lock & Publish (UC-AWD-05) */}
      <AuditActionDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        title="BTV Chốt Kết quả & Công bố Bảng vàng SV5T"
        description="Hành động này khóa sổ đợt xét, công bố công khai trên /public/honor-roll, gắn huy hiệu E-Portfolio và tự động phát hành E-Certificate có mã QR xác thực."
        targetSummary={`${cycleName} (${approvedCount} hồ sơ đạt)`}
        actionCode="SV5T_FINALIZE_AND_PUBLISH_HONOR_ROLL"
        destructive={false}
        confirmLabel="Chốt sổ & Công bố Bảng vàng"
        onConfirm={() => {
          setHonorRollPublished(true);
          setBannerMsg(
            "Đã chốt kết quả đợt xét SV5T, công bố Bảng vàng /public/honor-roll và phát hành tự động E-Certificate."
          );
        }}
      />
    </div>
  );
}
