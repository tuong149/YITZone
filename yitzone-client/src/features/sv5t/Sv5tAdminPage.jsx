import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BellRing,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  HelpCircle,
  Lock,
  Pencil,
  PlayCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Trophy,
  X,
  XCircle
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DateTimePicker, formatVietnameseDateTime } from "@/components/ui/date-time-picker";
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
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { cloneFreshCriteriaTree, INITIAL_AWARD_CYCLES } from "./sv5t-data";

const EMPTY_LIST = [];

const COHORT_CRITERIA_PROGRESS = [
  {
    key: "DAO_DUC",
    title: "Đạo đức tốt",
    mode: "AUTO",
    note: "Đồng bộ từ hoạt động sinh hoạt chính trị & ĐRL gắn nhãn SV5T"
  },
  {
    key: "HOC_TAP",
    title: "Học tập tốt",
    mode: "EXTERNAL",
    note: "GPA chính thức cần minh chứng ngoài; sự kiện học thuật & OJ đồng bộ tự động"
  },
  {
    key: "THE_LUC",
    title: "Thể lực tốt",
    mode: "EXTERNAL",
    note: "Giấy xác nhận Thanh niên khỏe cần tải minh chứng ngoài; FIT Games đồng bộ tự động"
  },
  {
    key: "TINH_NGUYEN",
    title: "Tình nguyện tốt",
    mode: "AUTO",
    note: "Đồng bộ tự động từ E-Cert Mùa Hè Xanh, Xuân Tình Nguyện, Hiến máu & CTXH"
  },
  {
    key: "HOI_NHAP",
    title: "Hội nhập tốt",
    mode: "EXTERNAL",
    note: "Chứng chỉ ngoại ngữ (IELTS/TOEIC/VSTEP) cần minh chứng ngoài; Seminar CĐDN đồng bộ tự động"
  }
];

function escapeCsvCell(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function getCycleStatusMeta(status) {
  if (status === "OPEN") return { label: "Đang mở cổng", variant: "success" };
  if (status === "PUBLISHED") return { label: "Đã công bố & Khóa sổ", variant: "info" };
  return { label: "Bản nháp", variant: "secondary" };
}

export function Sv5tAdminPage() {
  const authUserId = useAuthStore((s) => s.userId) ?? "";

  // Level 1: Award Cycles state
  const [cycles, setCycles] = useState(INITIAL_AWARD_CYCLES);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [cycleSearch, setCycleSearch] = useState("");
  const [cycleStatusFilter, setCycleStatusFilter] = useState("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCycleDraft, setNewCycleDraft] = useState({
    name: "",
    academicYear: "2026–2027",
    openAt: "2026-10-15T08:00",
    deadline: "2026-11-30T23:59",
    appealHours: "72",
    status: "DRAFT"
  });

  // Shared feedback banners
  const [bannerMsg, setBannerMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Level 2: Inside a selected cycle
  const [activeTab, setActiveTab] = useState("review");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [cohortFilter, setCohortFilter] = useState("ALL");
  const [inspectAppId, setInspectAppId] = useState(null);
  const [prelimNoteDraft, setPrelimNoteDraft] = useState("");

  // Cycle config form drafts (synced when entering a cycle)
  const [cycleNameDraft, setCycleNameDraft] = useState("");
  const [cycleOpenAtDraft, setCycleOpenAtDraft] = useState("");
  const [cycleDeadlineDraft, setCycleDeadlineDraft] = useState("");
  const [appealHoursDraft, setAppealHoursDraft] = useState("72");

  // Criteria Tree CRUD state
  const [selectedCritKey, setSelectedCritKey] = useState("DAO_DUC");
  const [newCondLabel, setNewCondLabel] = useState("");
  const [newCondGroup, setNewCondGroup] = useState("OPTIONAL");
  const [editingCondId, setEditingCondId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    label: "",
    group: "OPTIONAL"
  });

  // Audit dialogs
  const [decisionModal, setDecisionModal] = useState(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  const activeCycle = useMemo(
    () => cycles.find((c) => c.id === selectedCycleId) ?? null,
    [cycles, selectedCycleId]
  );

  const updateActiveCycle = (updater) => {
    if (!selectedCycleId) return;
    setCycles((prev) =>
      prev.map((cycle) => (cycle.id === selectedCycleId ? updater(cycle) : cycle))
    );
  };

  const enterCycle = (cycle) => {
    setSelectedCycleId(cycle.id);
    setActiveTab("review");
    setSearchQuery("");
    setStatusFilter("ALL");
    setCohortFilter("ALL");
    setInspectAppId(null);
    setSelectedCritKey("DAO_DUC");
    setEditingCondId(null);
    setNewCondLabel("");
    setCycleNameDraft(cycle.name);
    setCycleOpenAtDraft(cycle.openAt);
    setCycleDeadlineDraft(cycle.deadline);
    setAppealHoursDraft(cycle.appealHours);
    setBannerMsg(null);
    setErrorMsg(null);
  };

  const leaveCycle = () => {
    setSelectedCycleId(null);
    setInspectAppId(null);
    setEditingCondId(null);
    setBannerMsg(null);
    setErrorMsg(null);
  };

  // Level 1 derived values
  const openCyclesCount = useMemo(
    () => cycles.filter((c) => c.status === "OPEN").length,
    [cycles]
  );
  const publishedCyclesCount = useMemo(
    () => cycles.filter((c) => c.status === "PUBLISHED").length,
    [cycles]
  );
  const filteredCycles = useMemo(() => {
    const q = cycleSearch.trim().toLowerCase();
    return cycles.filter((cycle) => {
      if (cycleStatusFilter !== "ALL" && cycle.status !== cycleStatusFilter) return false;
      if (
        q &&
        !cycle.name.toLowerCase().includes(q) &&
        !cycle.academicYear.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [cycles, cycleSearch, cycleStatusFilter]);

  const handleCreateCycle = () => {
    const name = newCycleDraft.name.trim();
    const parsedHours = Number(newCycleDraft.appealHours);
    if (!name) {
      setErrorMsg("Vui lòng nhập tên đợt xét duyệt.");
      return;
    }
    if (newCycleDraft.deadline <= newCycleDraft.openAt) {
      setErrorMsg("Hạn chót nộp hồ sơ phải sau thời gian mở cổng.");
      return;
    }
    if (!Number.isFinite(parsedHours) || parsedHours < 24 || parsedHours > 168) {
      setErrorMsg("Thời hạn phúc khảo phải nằm trong khoảng 24 đến 168 giờ.");
      return;
    }
    setErrorMsg(null);
    const created = {
      id: `sv5t-${Date.now()}`,
      name,
      academicYear: newCycleDraft.academicYear.trim() || "2026–2027",
      status: newCycleDraft.status,
      openAt: newCycleDraft.openAt,
      deadline: newCycleDraft.deadline,
      appealHours: String(Math.round(parsedHours)),
      goalRegisteredCount: 0,
      autoReadyCount: 0,
      publishedAt: null,
      criteriaTree: cloneFreshCriteriaTree(),
      applications: []
    };
    setCycles((prev) => [created, ...prev]);
    setCreateDialogOpen(false);
    setNewCycleDraft({
      name: "",
      academicYear: "2026–2027",
      openAt: "2026-10-15T08:00",
      deadline: "2026-11-30T23:59",
      appealHours: "72",
      status: "DRAFT"
    });
    setBannerMsg(`Đã tạo đợt xét duyệt "${created.name}".`);
  };

  // Level 2 derived values (safe defaults when activeCycle is null)
  const applications = activeCycle?.applications ?? EMPTY_LIST;
  const criteriaTree = activeCycle?.criteriaTree ?? EMPTY_LIST;
  const honorRollPublished = activeCycle?.status === "PUBLISHED";

  const effectiveReviewerId = authUserId;

  const selectedCriterion = useMemo(
    () => criteriaTree.find((c) => c.key === selectedCritKey) ?? criteriaTree[0] ?? null,
    [criteriaTree, selectedCritKey]
  );

  const inspectApp = useMemo(
    () => applications.find((a) => a.id === inspectAppId) ?? null,
    [applications, inspectAppId]
  );

  const cohorts = useMemo(
    () => Array.from(new Set(applications.map((a) => a.cohort))).sort(),
    [applications]
  );

  const approvedCount = useMemo(
    () => applications.filter((a) => a.councilStatus === "APPROVED").length,
    [applications]
  );
  const pendingReviewCount = useMemo(
    () =>
      applications.filter(
        (a) => a.preliminaryStatus === "PENDING" || a.councilStatus === "PENDING"
      ).length,
    [applications]
  );
  const appealCount = useMemo(
    () => applications.filter((a) => a.appealStatus === "APPEAL_OPEN_72H").length,
    [applications]
  );
  const totalConditionsCount = useMemo(
    () => criteriaTree.reduce((sum, crit) => sum + crit.conditions.length, 0),
    [criteriaTree]
  );

  const cycleConfigDirty = activeCycle
    ? cycleNameDraft.trim() !== activeCycle.name ||
      cycleOpenAtDraft !== activeCycle.openAt ||
      cycleDeadlineDraft !== activeCycle.deadline ||
      appealHoursDraft.trim() !== activeCycle.appealHours
    : false;

  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      if (cohortFilter !== "ALL" && app.cohort !== cohortFilter) return false;
      if (statusFilter === "PENDING_PRELIM" && app.preliminaryStatus !== "PENDING") return false;
      if (
        statusFilter === "READY_FOR_COUNCIL" &&
        !(app.preliminaryStatus === "SCREENED_OK" && app.councilStatus === "PENDING")
      ) {
        return false;
      }
      if (statusFilter === "APPEAL_72H" && app.appealStatus !== "APPEAL_OPEN_72H") return false;
      if (statusFilter === "APPROVED" && app.councilStatus !== "APPROVED") return false;
      if (statusFilter === "NEEDS_SUPPLEMENT" && app.councilStatus !== "NEEDS_SUPPLEMENT") return false;
      if (statusFilter === "REJECTED" && app.councilStatus !== "REJECTED") return false;
      if (
        q &&
        !app.mssv.toLowerCase().includes(q) &&
        !app.fullName.toLowerCase().includes(q) &&
        !app.major.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [applications, searchQuery, statusFilter, cohortFilter]);

  const hasActiveFilters = searchQuery.trim() !== "" || statusFilter !== "ALL" || cohortFilter !== "ALL";

  const openInspectDialog = (app) => {
    setInspectAppId(app.id);
    setPrelimNoteDraft(app.preliminaryNote ?? "");
  };

  const handlePreliminaryDecision = (app, nextPreliminaryStatus, customNote) => {
    if ((Boolean(effectiveReviewerId) && app.userId === effectiveReviewerId) || honorRollPublished) return;
    setErrorMsg(null);
    const defaultNote =
      nextPreliminaryStatus === "SCREENED_OK"
        ? "Đã thẩm tra sơ bộ bởi Ban SV5T — Đủ điều kiện trình Hội đồng."
        : "Phát hiện minh chứng cần bổ sung trong vòng thẩm tra sơ bộ.";
    const noteText = (customNote ?? "").trim() || defaultNote;

    updateActiveCycle((cycle) => ({
      ...cycle,
      applications: cycle.applications.map((item) =>
        item.id === app.id
          ? {
              ...item,
              preliminaryStatus: nextPreliminaryStatus,
              preliminaryNote: noteText,
              appealStatus:
                nextPreliminaryStatus === "SCREENED_OK" && item.appealStatus === "APPEAL_OPEN_72H"
                  ? "APPEAL_RESOLVED"
                  : item.appealStatus
            }
          : item
      )
    }));

    setBannerMsg(
      nextPreliminaryStatus === "SCREENED_OK"
        ? `Đã xác nhận thẩm tra sơ bộ đạt cho hồ sơ ${app.mssv} · ${app.fullName}.`
        : `Đã đánh dấu thiếu minh chứng cho hồ sơ ${app.mssv} · ${app.fullName} và gửi yêu cầu bổ sung.`
    );
  };

  const handleSaveCycleConfig = () => {
    const parsedHours = Number(appealHoursDraft);
    if (!cycleNameDraft.trim()) {
      setErrorMsg("Tên đợt xét duyệt không được để trống.");
      return;
    }
    if (cycleDeadlineDraft <= cycleOpenAtDraft) {
      setErrorMsg("Hạn chót nộp hồ sơ phải sau thời gian mở cổng.");
      return;
    }
    if (!Number.isFinite(parsedHours) || parsedHours < 24 || parsedHours > 168) {
      setErrorMsg("Thời hạn phúc khảo phải nằm trong khoảng 24 đến 168 giờ (mặc định 72 giờ).");
      return;
    }
    setErrorMsg(null);
    const normalizedHours = String(Math.round(parsedHours));
    updateActiveCycle((cycle) => ({
      ...cycle,
      name: cycleNameDraft.trim(),
      openAt: cycleOpenAtDraft,
      deadline: cycleDeadlineDraft,
      appealHours: normalizedHours
    }));
    setAppealHoursDraft(normalizedHours);
    setBannerMsg(
      `Đã lưu cấu hình đợt xét "${cycleNameDraft.trim()}" (hạn nộp ${formatVietnameseDateTime(cycleDeadlineDraft, true)}).`
    );
  };

  const handleOpenDraftCycle = () => {
    if (!activeCycle || activeCycle.status !== "DRAFT") return;
    setErrorMsg(null);
    updateActiveCycle((cycle) => ({ ...cycle, status: "OPEN" }));
    setBannerMsg(`Đã mở cổng tiếp nhận hồ sơ cho đợt "${activeCycle.name}".`);
  };

  const handleAddCondition = () => {
    if (!newCondLabel.trim() || honorRollPublished || !selectedCriterion) return;
    setErrorMsg(null);
    const nextCondition = {
      id: `${selectedCritKey.toLowerCase()}-${Date.now()}`,
      label: newCondLabel.trim(),
      group: newCondGroup,
      source: "EXTERNAL_PROOF",
      achieved: false,
      attachedApplicationsCount: 0
    };

    updateActiveCycle((cycle) => ({
      ...cycle,
      criteriaTree: cycle.criteriaTree.map((crit) =>
        crit.key === selectedCritKey
          ? { ...crit, conditions: [...crit.conditions, nextCondition] }
          : crit
      )
    }));
    setNewCondLabel("");
    setBannerMsg(`Đã thêm điều kiện mới vào tiêu chí "${selectedCriterion.title}".`);
  };

  const startEditCondition = (cond) => {
    setEditingCondId(cond.id);
    setEditDraft({
      label: cond.label,
      group: cond.group
    });
  };

  const handleSaveEditCondition = (critKey, condId) => {
    if (!editDraft.label.trim()) {
      setErrorMsg("Nội dung điều kiện không được để trống.");
      return;
    }
    setErrorMsg(null);
    updateActiveCycle((cycle) => ({
      ...cycle,
      criteriaTree: cycle.criteriaTree.map((crit) => {
        if (crit.key !== critKey) return crit;
        const updatedConditions = crit.conditions.map((c) =>
          c.id === condId
            ? { ...c, label: editDraft.label.trim(), group: editDraft.group }
            : c
        );
        const optionalCount = updatedConditions.filter((c) => c.group === "OPTIONAL").length;
        return {
          ...crit,
          conditions: updatedConditions,
          optionalMinRequired: Math.min(crit.optionalMinRequired, optionalCount)
        };
      })
    }));
    setEditingCondId(null);
    setBannerMsg("Đã cập nhật nội dung điều kiện tiêu chí.");
  };

  const handleMoveCondition = (critKey, condId, direction) => {
    if (honorRollPublished) return;
    updateActiveCycle((cycle) => ({
      ...cycle,
      criteriaTree: cycle.criteriaTree.map((crit) => {
        if (crit.key !== critKey) return crit;
        const target = crit.conditions.find((c) => c.id === condId);
        if (!target) return crit;
        const sameGroupIds = crit.conditions
          .filter((c) => c.group === target.group)
          .map((c) => c.id);
        const pos = sameGroupIds.indexOf(condId);
        const swapPos = direction === "up" ? pos - 1 : pos + 1;
        if (pos < 0 || swapPos < 0 || swapPos >= sameGroupIds.length) return crit;

        const swapId = sameGroupIds[swapPos];
        const idxA = crit.conditions.findIndex((c) => c.id === condId);
        const idxB = crit.conditions.findIndex((c) => c.id === swapId);
        const nextConditions = [...crit.conditions];
        [nextConditions[idxA], nextConditions[idxB]] = [nextConditions[idxB], nextConditions[idxA]];
        return { ...crit, conditions: nextConditions };
      })
    }));
  };

  const handleDeleteCondition = (critKey, condId, attachedCount) => {
    setErrorMsg(null);
    if (honorRollPublished) {
      setErrorMsg("Đợt xét đã khóa sổ, không thể thay đổi cây tiêu chí.");
      return;
    }
    if (attachedCount > 0) {
      setErrorMsg(
        `Không thể xóa điều kiện này: hiện đã có ${attachedCount} hồ sơ sinh viên đính kèm minh chứng (theo quy tắc bảo toàn FR-AWD-01).`
      );
      return;
    }
    updateActiveCycle((cycle) => ({
      ...cycle,
      criteriaTree: cycle.criteriaTree.map((crit) => {
        if (crit.key !== critKey) return crit;
        const nextConditions = crit.conditions.filter((c) => c.id !== condId);
        const optionalCount = nextConditions.filter((c) => c.group === "OPTIONAL").length;
        return {
          ...crit,
          conditions: nextConditions,
          optionalMinRequired: Math.min(crit.optionalMinRequired, optionalCount)
        };
      })
    }));
    if (editingCondId === condId) setEditingCondId(null);
    setBannerMsg("Đã xóa điều kiện phụ chưa phát sinh hồ sơ đính kèm.");
  };

  const handleOptionalMinChange = (critKey, rawValue, maxOptional) => {
    const clamped = Math.max(0, Math.min(maxOptional, Number.isFinite(rawValue) ? rawValue : 0));
    updateActiveCycle((cycle) => ({
      ...cycle,
      criteriaTree: cycle.criteriaTree.map((crit) =>
        crit.key === critKey ? { ...crit, optionalMinRequired: clamped } : crit
      )
    }));
  };

  const handleExportApprovedCsv = () => {
    const approvedRows = applications.filter((a) => a.councilStatus === "APPROVED");
    if (approvedRows.length === 0) {
      setErrorMsg("Chưa có hồ sơ nào được Hội đồng chấm Đạt SV5T để xuất danh sách hành chính.");
      return;
    }
    setErrorMsg(null);
    const headers = [
      "STT",
      "MSSV",
      "Họ và tên",
      "Ngành học",
      "Khóa",
      "Số tiêu chí đạt",
      "Minh chứng tự động",
      "Minh chứng ngoài",
      "Kết quả Hội đồng"
    ];
    const lines = [
      headers.map(escapeCsvCell).join(","),
      ...approvedRows.map((row, index) =>
        [
          index + 1,
          row.mssv,
          row.fullName,
          row.major,
          row.cohort,
          `${row.criteriaMetCount}/5`,
          row.autoEvidenceCount,
          row.externalFilesCount,
          "Đạt SV5T"
        ]
          .map(escapeCsvCell)
          .join(",")
      )
    ];
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `danh-sach-sv5t-${activeCycle?.academicYear ?? "export"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBannerMsg(`Đã xuất danh sách hành chính CSV gồm ${approvedRows.length} sinh viên đạt danh hiệu SV5T.`);
  };

  // Level 1 columns: Award Cycles list
  const cycleColumns = [
    {
      key: "name",
      header: "Đợt xét duyệt & Năm học",
      render: (cycle) => {
        const condCount = (cycle.criteriaTree ?? []).reduce((s, c) => s + (c.conditions ?? []).length, 0);
        return (
          <div className="space-y-1">
            <div className="font-medium text-foreground">{cycle.name}</div>
            <div className="tabular-mono text-xs text-muted-foreground">
              Năm học {cycle.academicYear} · 5 tiêu chí · {condCount} điều kiện
            </div>
          </div>
        );
      }
    },
    {
      key: "schedule",
      header: "Thời gian mở & Hạn nộp",
      render: (cycle) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 text-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="tabular-mono">{formatVietnameseDateTime(cycle.openAt, true)}</span>
            <span className="text-muted-foreground">→</span>
            <span className="tabular-mono font-semibold">{formatVietnameseDateTime(cycle.deadline, true)}</span>
          </div>
          <div className="text-muted-foreground">
            Khung phúc khảo sau sơ khảo: <span className="tabular-mono font-medium text-foreground">{cycle.appealHours} giờ</span>
          </div>
        </div>
      )
    },
    {
      key: "stats",
      header: "Hồ sơ & Kết quả",
      render: (cycle) => {
        const cycleApps = cycle.applications ?? [];
        const approved = cycleApps.filter((a) => a.councilStatus === "APPROVED").length;
        const appeals = cycleApps.filter((a) => a.appealStatus === "APPEAL_OPEN_72H").length;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="tabular-mono">
              {cycleApps.length} hồ sơ
            </Badge>
            {approved > 0 && (
              <Badge variant="success" className="tabular-mono">
                {approved} đạt
              </Badge>
            )}
            {appeals > 0 && (
              <Badge variant="warning" className="tabular-mono">
                {appeals} phúc khảo
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (cycle) => {
        const meta = getCycleStatusMeta(cycle.status);
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      }
    },
    {
      key: "action",
      header: "Thao tác",
      align: "right",
      render: (cycle) => (
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant={cycle.status === "PUBLISHED" ? "outline" : "default"}
            className="rounded-full"
            onClick={() => enterCycle(cycle)}
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>{cycle.status === "PUBLISHED" ? "Xem lưu trữ" : "Điều hành đợt xét"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  // Level 2 columns: Applications review queue
  const appColumns = [
    {
      key: "student",
      header: "Ứng viên & Minh chứng",
      render: (row) => {
        const isSelf = Boolean(effectiveReviewerId) && row.userId === effectiveReviewerId;
        return (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="tabular-mono font-semibold text-foreground">{row.mssv}</span>
              <span className="font-medium text-foreground">{row.fullName}</span>
              {isSelf && (
                <Badge variant="danger">
                  <Lock className="h-3 w-3" />
                  <span>Khóa tự chấm</span>
                </Badge>
              )}
              {row.appealStatus === "APPEAL_OPEN_72H" && (
                <Badge variant="warning">
                  <Clock className="h-3 w-3" />
                  <span>Phúc khảo 72h</span>
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.major} ({row.cohort}) · Nộp <span className="tabular-mono">{row.submittedAt}</span> · Tự động:{" "}
              <span className="tabular-mono font-medium text-foreground">{row.autoEvidenceCount}</span> · Ngoài:{" "}
              <span className="tabular-mono font-medium text-foreground">{row.externalFilesCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">{row.preliminaryNote}</p>
            {row.appealNote && (
              <p className="text-xs font-medium text-status-warning">
                Giải trình phúc khảo: {row.appealNote}
              </p>
            )}
          </div>
        );
      }
    },
    {
      key: "criteria",
      header: "5 Tiêu chí",
      render: (row) => (
        <Badge
          variant={row.criteriaMetCount === 5 ? "success" : "warning"}
          className="tabular-mono"
        >
          {row.criteriaMetCount}/5 đạt
        </Badge>
      )
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
      header: "Thao tác",
      align: "right",
      render: (row) => {
        const isSelf = Boolean(effectiveReviewerId) && row.userId === effectiveReviewerId;
        if (isSelf) {
          return (
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => openInspectDialog(row)}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Xem hồ sơ</span>
              </Button>
              <span
                className="inline-flex items-center gap-1 rounded-full border border-status-danger/30 bg-status-danger/10 px-2.5 py-1 text-xs font-semibold text-status-danger"
                title="Chống xung đột lợi ích: không thể tự thẩm tra hoặc chấm duyệt hồ sơ của chính mình"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Đã khóa</span>
              </span>
            </div>
          );
        }

        return (
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={honorRollPublished ? "outline" : "default"}
              className="rounded-full"
              onClick={() => openInspectDialog(row)}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>{honorRollPublished ? "Xem hồ sơ" : "Xem & Thẩm định"}</span>
            </Button>

            {!honorRollPublished && row.preliminaryStatus === "PENDING" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => handlePreliminaryDecision(row, "SCREENED_OK")}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Đạt sơ bộ</span>
              </Button>
            )}

            {!honorRollPublished && row.councilStatus !== "REJECTED" && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                aria-label={`Từ chối hồ sơ ${row.mssv} ${row.fullName}`}
                title="Từ chối hồ sơ"
                onClick={() =>
                  setDecisionModal({
                    app: row,
                    nextStatus: "REJECTED",
                    label: "Từ chối hồ sơ"
                  })
                }
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  // ============================================================================
  // LEVEL 1: DANH SÁCH CÁC ĐỢT XÉT DUYỆT DANH HIỆU (MENU LỚN)
  // ============================================================================
  if (!activeCycle) {
    const hasCycleFilters = cycleSearch.trim() !== "" || cycleStatusFilter !== "ALL";
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-medium text-foreground">
              Các Đợt Xét duyệt Sinh viên 5 tốt
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Chọn một đợt xét duyệt để cấu hình cây 5 tiêu chí, thẩm tra hồ sơ, xử lý phúc khảo 72 giờ và chốt Bảng
              vàng vinh danh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="success" className="rounded-full px-3 py-1 tabular-mono">
              {openCyclesCount} đang mở cổng
            </Badge>
            <Badge variant="info" className="rounded-full px-3 py-1 tabular-mono">
              {publishedCyclesCount} đã công bố
            </Badge>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/public/honor-roll">
                <Trophy className="h-3.5 w-3.5" />
                <span>Bảng vàng Công khai</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-full px-4"
              onClick={() => {
                setErrorMsg(null);
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Tạo đợt xét duyệt mới</span>
            </Button>
          </div>
        </div>

        {bannerMsg && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-between gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{bannerMsg}</span>
            </span>
            <button
              type="button"
              onClick={() => setBannerMsg(null)}
              aria-label="Đóng thông báo thành công"
              className="shrink-0 px-1 py-0.5 underline"
            >
              Đóng
            </button>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="flex items-center justify-between gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-xs font-medium text-status-danger"
          >
            <span className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              aria-label="Đóng cảnh báo lỗi"
              className="shrink-0 px-1 py-0.5 underline"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/70 p-3.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={cycleSearch}
              onChange={(e) => setCycleSearch(e.target.value)}
              placeholder="Tìm theo tên đợt xét duyệt hoặc năm học..."
              aria-label="Tìm kiếm đợt xét duyệt SV5T"
              className="h-9 rounded-xl pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-48">
              <Select value={cycleStatusFilter} onValueChange={setCycleStatusFilter}>
                <SelectTrigger aria-label="Lọc theo trạng thái đợt xét" className="h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái ({cycles.length})</SelectItem>
                  <SelectItem value="OPEN">Đang mở cổng ({openCyclesCount})</SelectItem>
                  <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  <SelectItem value="PUBLISHED">Đã công bố ({publishedCyclesCount})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasCycleFilters && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-9 rounded-xl text-xs"
                onClick={() => {
                  setCycleSearch("");
                  setCycleStatusFilter("ALL");
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại</span>
              </Button>
            )}
          </div>
        </div>

        <DataTable
          columns={cycleColumns}
          data={filteredCycles}
          emptyTitle={
            hasCycleFilters
              ? "Không tìm thấy đợt xét duyệt khớp bộ lọc"
              : "Chưa có đợt xét chọn Sinh viên 5 tốt nào"
          }
          emptyDescription={
            hasCycleFilters
              ? "Thử xóa từ khóa hoặc đổi trạng thái lọc để xem toàn bộ danh sách."
              : "Tạo đợt xét duyệt mới để cấu hình bộ tiêu chí và mở cổng nhận hồ sơ sinh viên."
          }
          emptyAction={
            hasCycleFilters ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => {
                  setCycleSearch("");
                  setCycleStatusFilter("ALL");
                }}
              >
                Đặt lại bộ lọc
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Tạo đợt xét duyệt mới</span>
              </Button>
            )
          }
        />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldAlert className="h-4 w-4 shrink-0 text-status-warning" />
          <span>
            Chỉ Ban Thường vụ (BTV) có quyền mở đợt xét duyệt mới, công bố cây tiêu chí và khóa sổ Bảng vàng vinh danh.
          </span>
        </div>

        {/* Create New Award Cycle Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-medium">
                Tạo Đợt Xét duyệt Danh hiệu Mới
              </DialogTitle>
              <DialogDescription>
                Khởi tạo đợt xét mới với bộ 5 tiêu chí mặc định; bạn có thể tùy chỉnh chi tiết từng điều kiện ngay sau
                khi tạo.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="space-y-1.5 sm:col-span-8">
                  <Label htmlFor="new-cycle-name">Tên đợt xét duyệt</Label>
                  <Input
                    id="new-cycle-name"
                    value={newCycleDraft.name}
                    onChange={(e) => setNewCycleDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="VD: Sinh viên 5 tốt Khoa CNTT — Năm học 2026–2027"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-4">
                  <Label htmlFor="new-cycle-year">Năm học</Label>
                  <Input
                    id="new-cycle-year"
                    value={newCycleDraft.academicYear}
                    onChange={(e) => setNewCycleDraft((d) => ({ ...d, academicYear: e.target.value }))}
                    placeholder="2026–2027"
                    className="rounded-xl tabular-mono"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="new-cycle-open-at">Thời gian mở cổng</Label>
                  <DateTimePicker
                    id="new-cycle-open-at"
                    value={newCycleDraft.openAt}
                    onChange={(v) => setNewCycleDraft((d) => ({ ...d, openAt: v }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-cycle-deadline">Hạn chót nộp hồ sơ</Label>
                  <DateTimePicker
                    id="new-cycle-deadline"
                    value={newCycleDraft.deadline}
                    onChange={(v) => setNewCycleDraft((d) => ({ ...d, deadline: v }))}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="new-cycle-appeal-hours">Thời hạn phúc khảo (giờ)</Label>
                  <Input
                    id="new-cycle-appeal-hours"
                    type="number"
                    min={24}
                    max={168}
                    value={newCycleDraft.appealHours}
                    onChange={(e) => setNewCycleDraft((d) => ({ ...d, appealHours: e.target.value }))}
                    className="rounded-xl tabular-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-cycle-status">Trạng thái khởi tạo</Label>
                  <Select
                    value={newCycleDraft.status}
                    onValueChange={(v) => setNewCycleDraft((d) => ({ ...d, status: v }))}
                  >
                    <SelectTrigger id="new-cycle-status" className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Lưu bản nháp (chưa mở cổng)</SelectItem>
                      <SelectItem value="OPEN">Mở cổng nhận hồ sơ ngay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => setCreateDialogOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button type="button" className="rounded-full px-5" onClick={handleCreateCycle}>
                <Plus className="h-4 w-4" />
                <span>Tạo đợt xét duyệt</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============================================================================
  // LEVEL 2: KHÔNG GIAN ĐIỀU HÀNH CHI TIẾT CỦA 01 ĐỢT XÉT DUYỆT
  // ============================================================================
  const activeStatusMeta = getCycleStatusMeta(activeCycle.status);
  const mandatoryConditions = selectedCriterion
    ? selectedCriterion.conditions.filter((c) => c.group === "MANDATORY")
    : [];
  const optionalConditions = selectedCriterion
    ? selectedCriterion.conditions.filter((c) => c.group === "OPTIONAL")
    : [];

  const renderConditionGroup = (groupKey, heading, items) => (
    <section key={groupKey} className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {heading}
        </h3>
        <span className="tabular-mono text-xs text-muted-foreground">{items.length} điều kiện</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4 text-xs text-muted-foreground">
          Chưa có điều kiện nào trong nhóm này. Hãy thêm mới ở biểu mẫu bên dưới.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((cond, idx) => {
            const isEditing = editingCondId === cond.id;
            const isProtected = cond.attachedApplicationsCount > 0;

            if (isEditing) {
              return (
                <div
                  key={cond.id}
                  className="space-y-3 rounded-xl border border-primary/40 bg-primary/[0.04] p-3.5"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor={`edit-cond-${cond.id}`} className="text-xs">
                      Nội dung điều kiện cần đạt
                    </Label>
                    <Input
                      id={`edit-cond-${cond.id}`}
                      value={editDraft.label}
                      onChange={(e) => setEditDraft((d) => ({ ...d, label: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-full sm:w-60">
                      <Select
                        value={editDraft.group}
                        onValueChange={(v) => setEditDraft((d) => ({ ...d, group: v }))}
                      >
                        <SelectTrigger className="rounded-xl text-xs" aria-label="Nhóm tiêu chí">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MANDATORY">(a) Tiêu chí bắt buộc</SelectItem>
                          <SelectItem value="OPTIONAL">(b) Tiêu chí khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setEditingCondId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Hủy</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => handleSaveEditCondition(selectedCriterion.key, cond.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Lưu thay đổi</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={cond.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-muted/25 p-3.5 sm:flex-row sm:items-start"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={cond.group === "MANDATORY" ? "danger" : "info"}>
                      {cond.group === "MANDATORY" ? "(a) Bắt buộc" : "(b) Tiêu chí khác"}
                    </Badge>
                    {cond.linkedBenefit && (
                      <Badge variant="secondary">{cond.linkedBenefit}</Badge>
                    )}
                    <span className="tabular-mono text-[11px] text-muted-foreground">
                      {cond.attachedApplicationsCount} hồ sơ đính kèm
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{cond.label}</p>
                </div>

                <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={idx === 0 || honorRollPublished}
                    aria-label={`Đưa điều kiện "${cond.label}" lên trên`}
                    title="Đưa lên"
                    className="h-8 w-8 rounded-lg p-0"
                    onClick={() => handleMoveCondition(selectedCriterion.key, cond.id, "up")}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={idx === items.length - 1 || honorRollPublished}
                    aria-label={`Đưa điều kiện "${cond.label}" xuống dưới`}
                    title="Đưa xuống"
                    className="h-8 w-8 rounded-lg p-0"
                    onClick={() => handleMoveCondition(selectedCriterion.key, cond.id, "down")}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={honorRollPublished}
                    aria-label={`Chỉnh sửa điều kiện "${cond.label}"`}
                    title="Chỉnh sửa điều kiện"
                    className="h-8 w-8 rounded-lg p-0"
                    onClick={() => startEditCondition(cond)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={
                      isProtected
                        ? `Điều kiện đang có ${cond.attachedApplicationsCount} hồ sơ đính kèm, không thể xóa`
                        : `Xóa điều kiện "${cond.label}"`
                    }
                    title={
                      isProtected
                        ? `Đang có ${cond.attachedApplicationsCount} hồ sơ đính kèm — Bấm để xem lý do chặn xóa`
                        : "Xóa điều kiện"
                    }
                    onClick={() =>
                      handleDeleteCondition(
                        selectedCriterion.key,
                        cond.id,
                        cond.attachedApplicationsCount
                      )
                    }
                    className={cn(
                      "h-8 w-8 rounded-lg p-0",
                      isProtected
                        ? "text-muted-foreground hover:bg-muted"
                        : "text-brand-crimson hover:bg-brand-crimson/10 hover:text-brand-crimson"
                    )}
                  >
                    {isProtected ? <Lock className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      {/* Back to Cycles List + Cycle Header */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 rounded-full text-xs text-muted-foreground hover:text-foreground"
          onClick={leaveCycle}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại danh sách Đợt xét duyệt</span>
        </Button>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-medium text-foreground">
                {activeCycle.name}
              </h1>
              <Badge variant={activeStatusMeta.variant}>{activeStatusMeta.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Mở cổng:{" "}
              <span className="tabular-mono font-medium text-foreground">
                {formatVietnameseDateTime(activeCycle.openAt, true)}
              </span>{" "}
              · Hạn nộp:{" "}
              <span className="tabular-mono font-medium text-foreground">
                {formatVietnameseDateTime(activeCycle.deadline, true)}
              </span>{" "}
              · Phúc khảo{" "}
              <span className="tabular-mono font-medium text-foreground">{activeCycle.appealHours} giờ</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="success" className="rounded-full px-3 py-1 tabular-mono">
              {approvedCount} đạt SV5T
            </Badge>
            <Badge variant="warning" className="rounded-full px-3 py-1 tabular-mono">
              {pendingReviewCount} chờ xử lý
            </Badge>
            {appealCount > 0 && (
              <Badge variant="info" className="rounded-full px-3 py-1 tabular-mono">
                {appealCount} phúc khảo 72h
              </Badge>
            )}
            {activeCycle.status === "DRAFT" ? (
              <Button
                type="button"
                size="sm"
                className="rounded-full"
                onClick={handleOpenDraftCycle}
              >
                <PlayCircle className="h-3.5 w-3.5" />
                <span>Mở cổng nhận hồ sơ</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant={honorRollPublished ? "outline" : "default"}
                className="rounded-full"
                disabled={honorRollPublished}
                onClick={() => setPublishDialogOpen(true)}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>
                  {honorRollPublished ? "Đã công bố Bảng vàng" : "BTV Chốt & Công bố Bảng vàng"}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Live Status / Error Feedback */}
      {bannerMsg && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{bannerMsg}</span>
          </span>
          <button
            type="button"
            onClick={() => setBannerMsg(null)}
            aria-label="Đóng thông báo thành công"
            className="shrink-0 px-1 py-0.5 underline"
          >
            Đóng
          </button>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-xs font-medium text-status-danger"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            aria-label="Đóng cảnh báo lỗi"
            className="shrink-0 px-1 py-0.5 underline"
          >
            Đóng
          </button>
        </div>
      )}

      {honorRollPublished && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-navy/25 bg-brand-navy/[0.06] px-4 py-3 text-xs dark:border-brand-cyan/25 dark:bg-brand-cyan/10">
          <div className="flex flex-wrap items-center gap-2.5">
            <VerifiedBadge label="Đợt xét đã khóa sổ & công bố Bảng vàng" />
            <span className="text-foreground">
              Chốt lúc <strong className="tabular-mono">{activeCycle.publishedAt}</strong> · Đã phát hành tự động
              E-Certificate cho <strong className="tabular-mono">{approvedCount}</strong> sinh viên đạt danh hiệu.
            </span>
          </div>
          <Link
            to="/public/honor-roll"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <span>Mở Bảng vàng</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-h-[540px]">
        <TabsList className="justify-start">
          <TabsTrigger value="review">Thẩm tra &amp; Chấm duyệt ({applications.length})</TabsTrigger>
          <TabsTrigger value="criteria">Cấu hình Cây 5 Tiêu chí ({totalConditionsCount})</TabsTrigger>
          <TabsTrigger value="cohort">Tiến độ Toàn Khoa &amp; Chốt Bảng vàng</TabsTrigger>
        </TabsList>

        {/* TAB 1: FR-AWD-03 Review Queue */}
        <TabsContent value="review" className="mt-4 space-y-4">
          <div className="flex items-center gap-2.5 rounded-xl border border-brand-navy/20 bg-brand-navy/[0.05] px-4 py-2.5 text-xs text-foreground dark:border-brand-cyan/25 dark:bg-brand-cyan/10">
            <Lock className="h-4 w-4 shrink-0 text-brand-navy dark:text-brand-cyan" />
            <span>
              <strong>Chống xung đột lợi ích:</strong> Cán bộ{" "}
              <span className="tabular-mono font-semibold">
                {effectiveReviewerId || "đang đăng nhập"}
              </span>{" "}
              bị khóa thao tác tự thẩm tra và tự chấm duyệt trên hồ sơ cá nhân. Mọi quyết định Hội đồng bắt buộc nhập lý do vào{" "}
              <span className="tabular-mono font-semibold">Audit Log</span>.
            </span>
          </div>

          {/* Synchronized Filter Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/70 p-3.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo MSSV, họ tên hoặc ngành học..."
                aria-label="Tìm kiếm hồ sơ ứng viên SV5T"
                className="h-9 rounded-xl pl-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="w-52">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger aria-label="Lọc theo trạng thái hồ sơ" className="h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả trạng thái ({applications.length})</SelectItem>
                    <SelectItem value="PENDING_PRELIM">Chờ thẩm tra sơ bộ</SelectItem>
                    <SelectItem value="READY_FOR_COUNCIL">Chờ Hội đồng chấm</SelectItem>
                    <SelectItem value="APPEAL_72H">Có đơn phúc khảo 72h ({appealCount})</SelectItem>
                    <SelectItem value="APPROVED">Đạt SV5T ({approvedCount})</SelectItem>
                    <SelectItem value="NEEDS_SUPPLEMENT">Cần bổ sung</SelectItem>
                    <SelectItem value="REJECTED">Không đạt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select value={cohortFilter} onValueChange={setCohortFilter}>
                  <SelectTrigger aria-label="Lọc theo khóa" className="h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Khóa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả khóa</SelectItem>
                    {cohorts.map((cohort) => (
                      <SelectItem key={cohort} value={cohort}>
                        Khóa {cohort}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 rounded-xl text-xs"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setCohortFilter("ALL");
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Đặt lại</span>
                </Button>
              )}
            </div>
          </div>

          <DataTable
            columns={appColumns}
            data={filteredApplications}
            emptyTitle={hasActiveFilters ? "Không có hồ sơ khớp bộ lọc" : "Chưa có hồ sơ nộp trong đợt này"}
            emptyDescription={
              hasActiveFilters
                ? "Thử xóa từ khóa hoặc đặt lại bộ lọc trạng thái để xem toàn bộ danh sách."
                : "Khi sinh viên nộp hồ sơ xét duyệt SV5T, danh sách sẽ hiển thị tại đây."
            }
            emptyAction={
              hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                    setCohortFilter("ALL");
                  }}
                >
                  Đặt lại bộ lọc
                </Button>
              ) : undefined
            }
          />
        </TabsContent>

        {/* TAB 2: FR-AWD-01 Criteria Tree CRUD */}
        <TabsContent value="criteria" className="mt-4 space-y-5">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Thông tin Đợt Xét duyệt Danh hiệu</CardTitle>
                <CardDescription>
                  Chỉ Ban Thường vụ (BTV) có quyền cấu hình thời gian mở/đóng cổng, hạn phúc khảo và công bố bộ tiêu
                  chí.
                </CardDescription>
              </div>
              <Badge variant={activeStatusMeta.variant} className="self-start sm:self-center">
                {activeStatusMeta.label}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-12">
                <div className="space-y-1.5 md:col-span-12">
                  <Label htmlFor="cycle-name">Tên đợt xét duyệt</Label>
                  <Input
                    id="cycle-name"
                    value={cycleNameDraft}
                    disabled={honorRollPublished}
                    onChange={(e) => setCycleNameDraft(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-5">
                  <Label htmlFor="cycle-open-at">Thời gian mở cổng nộp hồ sơ</Label>
                  <DateTimePicker
                    id="cycle-open-at"
                    value={cycleOpenAtDraft}
                    disabled={honorRollPublished}
                    onChange={setCycleOpenAtDraft}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-5">
                  <Label htmlFor="cycle-deadline">Hạn chót nộp hồ sơ</Label>
                  <DateTimePicker
                    id="cycle-deadline"
                    value={cycleDeadlineDraft}
                    disabled={honorRollPublished}
                    onChange={setCycleDeadlineDraft}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="appeal-hours">Phúc khảo (giờ)</Label>
                  <Input
                    id="appeal-hours"
                    type="number"
                    min={24}
                    max={168}
                    disabled={honorRollPublished}
                    value={appealHoursDraft}
                    onChange={(e) => setAppealHoursDraft(e.target.value)}
                    className="h-10 rounded-xl tabular-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  {cycleConfigDirty
                    ? "Có thay đổi chưa lưu trong thông tin đợt xét."
                    : `Đang áp dụng: ${formatVietnameseDateTime(activeCycle.openAt, true)} → ${formatVietnameseDateTime(activeCycle.deadline, true)} · Phúc khảo ${activeCycle.appealHours} giờ.`}
                </span>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-xl"
                  disabled={!cycleConfigDirty || honorRollPublished}
                  onClick={handleSaveCycleConfig}
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Lưu cấu hình đợt</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedCriterion && (
            <div className="grid items-start gap-5 lg:grid-cols-12">
              {/* Left selector of 5 criteria */}
              <nav
                aria-label="Chọn tiêu chí SV5T để cấu hình"
                className="space-y-2 lg:col-span-4 lg:sticky lg:top-20"
              >
                {criteriaTree.map((crit, idx) => {
                  const active = crit.key === selectedCritKey;
                  const mandCount = crit.conditions.filter((c) => c.group === "MANDATORY").length;
                  const optCount = crit.conditions.filter((c) => c.group === "OPTIONAL").length;
                  return (
                    <button
                      key={crit.key}
                      type="button"
                      onClick={() => {
                        setSelectedCritKey(crit.key);
                        setEditingCondId(null);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary bg-primary/[0.08] text-foreground"
                          : "border-border bg-card text-foreground/85 hover:bg-muted/50"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-mono",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div
                            className={cn(
                              "truncate text-sm",
                              active ? "font-semibold text-primary" : "font-medium text-foreground"
                            )}
                          >
                            {crit.title}
                          </div>
                          <div className="tabular-mono text-[11px] text-muted-foreground">
                            {mandCount} bắt buộc · {optCount} khác (tối thiểu {crit.optionalMinRequired})
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Right CRUD editor */}
              <Card className="lg:col-span-8">
                <CardHeader className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Điều kiện cần đạt — {selectedCriterion.title}</CardTitle>
                    <CardDescription>
                      Bắt buộc đạt 100% nhóm (a) và tối thiểu n điều kiện ở nhóm (b). Chặn xóa điều kiện đã có hồ sơ
                      đính kèm.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Label htmlFor="min-opt" className="whitespace-nowrap text-xs">
                      Nhóm (b) tối thiểu:
                    </Label>
                    <Input
                      id="min-opt"
                      type="number"
                      min={0}
                      max={optionalConditions.length}
                      disabled={honorRollPublished}
                      value={selectedCriterion.optionalMinRequired}
                      onChange={(e) =>
                        handleOptionalMinChange(
                          selectedCriterion.key,
                          Number(e.target.value),
                          optionalConditions.length
                        )
                      }
                      className="h-9 w-16 rounded-xl text-center tabular-mono"
                    />
                    <span className="tabular-mono text-xs text-muted-foreground">
                      / {optionalConditions.length}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-5">
                  {renderConditionGroup(
                    "MANDATORY",
                    "(a) Tiêu chí bắt buộc — Phải đạt toàn bộ",
                    mandatoryConditions
                  )}
                  {renderConditionGroup(
                    "OPTIONAL",
                    `(b) Tiêu chí khác — Đạt tối thiểu ${selectedCriterion.optionalMinRequired}/${optionalConditions.length}`,
                    optionalConditions
                  )}

                  {/* Add new condition form (streamlined: label + group only) */}
                  <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
                    <div className="text-xs font-semibold text-foreground">
                      Thêm điều kiện mới vào {selectedCriterion.title}
                    </div>
                    <Input
                      value={newCondLabel}
                      disabled={honorRollPublished}
                      onChange={(e) => setNewCondLabel(e.target.value)}
                      placeholder="VD: Tham gia ít nhất 01 Hội thảo chuyên đề AI / An toàn thông tin cấp Khoa"
                      aria-label="Nội dung điều kiện mới"
                      className="rounded-xl"
                    />
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="w-full sm:w-64">
                        <Select
                          value={newCondGroup}
                          disabled={honorRollPublished}
                          onValueChange={setNewCondGroup}
                        >
                          <SelectTrigger aria-label="Chọn nhóm điều kiện mới" className="h-10 rounded-xl text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MANDATORY">(a) Tiêu chí bắt buộc</SelectItem>
                            <SelectItem value="OPTIONAL">(b) Tiêu chí khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        className="h-10 rounded-xl"
                        disabled={!newCondLabel.trim() || honorRollPublished}
                        onClick={handleAddCondition}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Thêm điều kiện</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* TAB 3: FR-AWD-04 & FR-AWD-05 Cohort Progress & Publish */}
        <TabsContent value="cohort" className="mt-4 space-y-5">
          {/* Unified Operational Metrics Strip */}
          <div className="grid divide-y divide-border overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
            <div className="p-4">
              <div className="text-xs font-semibold text-muted-foreground">Đăng ký mục tiêu đầu năm</div>
              <div className="mt-1.5 tabular-mono text-2xl font-semibold text-foreground">
                {activeCycle.goalRegisteredCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Sinh viên đang theo dõi tiến độ</div>
            </div>
            <div className="p-4">
              <div className="text-xs font-semibold text-muted-foreground">Đạt ≥ 3 tiêu chí tự động</div>
              <div className="mt-1.5 tabular-mono text-2xl font-semibold text-status-info">
                {activeCycle.autoReadyCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Đang chờ bổ sung minh chứng ngoài</div>
            </div>
            <div className="p-4">
              <div className="text-xs font-semibold text-muted-foreground">Hồ sơ đã nộp xét duyệt</div>
              <div className="mt-1.5 tabular-mono text-2xl font-semibold text-foreground">
                {applications.length}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {pendingReviewCount} đang chờ thẩm tra / chấm duyệt
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs font-semibold text-muted-foreground">Hội đồng chấm Đạt SV5T</div>
              <div className="mt-1.5 tabular-mono text-2xl font-semibold text-status-success">
                {approvedCount}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Sẵn sàng xuất danh sách &amp; E-Cert</div>
            </div>
          </div>

          {/* Honest 5-Criteria Cohort Progress Breakdown (FR-AWD-05) */}
          <Card>
            <CardHeader>
              <CardTitle>Tiến độ Phong trào theo 5 Tiêu chí (Dữ liệu đồng bộ YITZone)</CardTitle>
              <CardDescription>
                Chỉ tính phần trăm tự động cho các tiêu chí có dữ liệu sự kiện trên YITZone; tiêu chí cần GPA, Thể lực
                hoặc Ngoại ngữ hiển thị rõ trạng thái Chờ minh chứng ngoài.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {COHORT_CRITERIA_PROGRESS.map((item) => {
                const total = activeCycle.goalRegisteredCount ?? 0;
                const achievedCount = activeCycle.criteriaStats?.[item.key] ?? 0;
                const pct = total > 0 ? Math.round((achievedCount / total) * 100) : 0;
                return (
                  <div
                    key={item.key}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{item.title}</span>
                        {item.mode === "AUTO" ? (
                          <Badge variant="success">Tự động YITZone</Badge>
                        ) : (
                          <Badge variant="warning">
                            <HelpCircle className="h-3 w-3" />
                            <span>Chờ minh chứng ngoài</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.note}</p>
                    </div>

                    <div className="w-full shrink-0 sm:w-56">
                      {item.mode === "AUTO" ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs tabular-mono">
                            <span className="font-medium text-foreground">
                              {achievedCount}/{total} SV
                            </span>
                            <span className="font-semibold text-status-success">{pct}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-status-success transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-lg border border-status-warning/25 bg-status-warning/[0.06] px-3 py-2 text-xs">
                          <span className="text-muted-foreground">Đã có minh chứng phụ:</span>
                          <span className="tabular-mono font-semibold text-foreground">
                            {achievedCount} SV
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Governance Actions & Publishing (FR-AWD-04) */}
          <Card>
            <CardHeader>
              <CardTitle>Điều phối Phong trào, Xuất Danh sách &amp; Chốt Bảng vàng</CardTitle>
              <CardDescription>
                Ban SV5T gửi thông báo nhắc bổ sung tiêu chí còn thiếu; xuất danh sách hành chính đạt chuẩn và duy nhất
                BTV có quyền khóa sổ công bố Bảng vàng.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={activeCycle.autoReadyCount === 0}
                onClick={() => {
                  setErrorMsg(null);
                  setBannerMsg(
                    `Đã gửi thông báo đẩy (Web Push + In-app) nhắc ${activeCycle.autoReadyCount} sinh viên bổ sung minh chứng ngoài trước hạn.`
                  );
                }}
              >
                <BellRing className="h-4 w-4" />
                <span>Nhắc nhở sinh viên thiếu tiêu chí</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={handleExportApprovedCsv}
              >
                <Download className="h-4 w-4" />
                <span>Xuất danh sách hành chính ({approvedCount} SV)</span>
              </Button>

              <Button
                type="button"
                className="rounded-full"
                disabled={honorRollPublished || activeCycle.status === "DRAFT"}
                onClick={() => setPublishDialogOpen(true)}
              >
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

      {/* Application Inspection & Two-Step Review Sheet (FR-AWD-03) */}
      <Dialog
        open={Boolean(inspectApp)}
        onOpenChange={(open) => {
          if (!open) setInspectAppId(null);
        }}
      >
        {inspectApp && (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            {(() => {
              const isSelf = Boolean(effectiveReviewerId) && inspectApp.userId === effectiveReviewerId;
              const isLocked = isSelf || honorRollPublished;
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex flex-wrap items-center gap-2 font-display text-xl font-medium">
                      <span>Hồ sơ Ứng viên SV5T</span>
                      <span className="tabular-mono text-base text-muted-foreground">
                        {inspectApp.mssv}
                      </span>
                    </DialogTitle>
                    <DialogDescription>
                      {inspectApp.fullName} · {inspectApp.major} ({inspectApp.cohort}) · Nộp lúc{" "}
                      <span className="tabular-mono">{inspectApp.submittedAt}</span>
                    </DialogDescription>
                  </DialogHeader>

                  {isSelf && (
                    <div className="flex items-start gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-3.5 py-2.5 text-xs font-medium text-status-danger">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Bạn đang xem hồ sơ của chính mình. Hệ thống chỉ cho phép xem ở chế độ chỉ đọc và khóa toàn bộ
                        thao tác thẩm tra / chấm duyệt để chống xung đột lợi ích.
                      </span>
                    </div>
                  )}

                  {/* 5 Criteria Evidence Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>Đối chiếu 5 tiêu chí &amp; minh chứng đính kèm</span>
                      <span className="tabular-mono text-foreground">
                        Tự động: {inspectApp.autoEvidenceCount} · Ngoài: {inspectApp.externalFilesCount}
                      </span>
                    </div>

                    <div className="divide-y divide-border rounded-xl border border-border text-sm">
                      {(inspectApp.criteriaReview ?? []).map((item) => (
                        <div
                          key={item.key}
                          className="flex flex-col justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center"
                        >
                          <div className="space-y-0.5">
                            <div className="font-medium text-foreground">{item.title}</div>
                            <div className="text-xs text-muted-foreground">{item.summary}</div>
                          </div>
                          <Badge
                            variant={item.status === "OK" ? "success" : "warning"}
                            className="shrink-0 self-start sm:self-center"
                          >
                            {item.status === "OK" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Đủ minh chứng</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3" />
                                <span>Thiếu / Chờ bổ sung</span>
                              </>
                            )}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 72h Appeal Context if present */}
                  {inspectApp.appealNote && (
                    <div className="rounded-xl border border-status-warning/35 bg-status-warning/10 p-3.5 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-status-warning">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Đơn phúc khảo trong khung {activeCycle.appealHours} giờ</span>
                      </div>
                      <p className="mt-1 leading-relaxed text-foreground">{inspectApp.appealNote}</p>
                    </div>
                  )}

                  {/* Step 1: Ban SV5T Preliminary Screening */}
                  <div className="space-y-2.5 rounded-xl border border-border bg-muted/25 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label htmlFor="prelim-note-input" className="text-xs font-semibold text-foreground">
                        Bước 1 · Ghi chú thẩm tra sơ bộ (Ban SV5T)
                      </Label>
                      <Badge
                        variant={
                          inspectApp.preliminaryStatus === "SCREENED_OK"
                            ? "success"
                            : inspectApp.preliminaryStatus === "MISSING_DOCS"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {inspectApp.preliminaryStatus === "SCREENED_OK"
                          ? "Đã thẩm tra đạt"
                          : inspectApp.preliminaryStatus === "MISSING_DOCS"
                            ? "Thiếu minh chứng"
                            : "Chờ thẩm tra"}
                      </Badge>
                    </div>

                    <Textarea
                      id="prelim-note-input"
                      rows={2}
                      disabled={isLocked}
                      value={prelimNoteDraft}
                      onChange={(e) => setPrelimNoteDraft(e.target.value)}
                      placeholder="Nhập nhận xét rà soát minh chứng sơ bộ hoặc mục cần sinh viên bổ sung..."
                    />

                    {!isLocked && (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => {
                            handlePreliminaryDecision(inspectApp, "MISSING_DOCS", prelimNoteDraft);
                            setInspectAppId(null);
                          }}
                        >
                          <AlertCircle className="h-3.5 w-3.5 text-status-warning" />
                          <span>Báo thiếu minh chứng</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => {
                            handlePreliminaryDecision(inspectApp, "SCREENED_OK", prelimNoteDraft);
                            setInspectAppId(null);
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                          <span>Xác nhận đạt sơ bộ</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Council Decision Footer -> AuditActionDialog */}
                  <DialogFooter className="flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
                    {isLocked ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setInspectAppId(null)}
                      >
                        Đóng cửa sổ
                      </Button>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full text-status-danger hover:text-status-danger"
                            onClick={() => {
                              const target = inspectApp;
                              setInspectAppId(null);
                              setDecisionModal({
                                app: target,
                                nextStatus: "REJECTED",
                                label: "Từ chối hồ sơ"
                              });
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Từ chối</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => {
                              const target = inspectApp;
                              setInspectAppId(null);
                              setDecisionModal({
                                app: target,
                                nextStatus: "NEEDS_SUPPLEMENT",
                                label: "Yêu cầu bổ sung"
                              });
                            }}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Yêu cầu bổ sung</span>
                          </Button>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full px-5"
                          onClick={() => {
                            const target = inspectApp;
                            setInspectAppId(null);
                            setDecisionModal({
                              app: target,
                              nextStatus: "APPROVED",
                              label: "Chấm Đạt SV5T"
                            });
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Chấm Đạt SV5T</span>
                        </Button>
                      </>
                    )}
                  </DialogFooter>
                </>
              );
            })()}
          </DialogContent>
        )}
      </Dialog>

      {/* Audit Dialog for Council Decision (FR-AWD-03) */}
      <AuditActionDialog
        open={Boolean(decisionModal)}
        onOpenChange={(o) => !o && setDecisionModal(null)}
        title={decisionModal?.label ?? "Chấm duyệt Hồ sơ SV5T"}
        description="Quyết định của Hội đồng (BCH/BTV) sẽ được lưu vào Audit Log bất biến và gửi thông báo tới ứng viên."
        targetSummary={
          decisionModal ? `${decisionModal.app.mssv} · ${decisionModal.app.fullName}` : ""
        }
        actionCode={`SV5T_COUNCIL_${decisionModal?.nextStatus ?? "DECISION"}`}
        destructive={decisionModal?.nextStatus === "REJECTED"}
        confirmLabel="Xác nhận quyết định & Ghi Audit Log"
        onConfirm={(reason) => {
          if (!decisionModal) return;
          updateActiveCycle((cycle) => ({
            ...cycle,
            applications: cycle.applications.map((a) =>
              a.id === decisionModal.app.id
                ? {
                    ...a,
                    councilStatus: decisionModal.nextStatus,
                    preliminaryNote:
                      decisionModal.nextStatus === "NEEDS_SUPPLEMENT"
                        ? `Hội đồng yêu cầu bổ sung: ${reason}`
                        : a.preliminaryNote,
                    appealStatus:
                      a.appealStatus === "APPEAL_OPEN_72H" ? "APPEAL_RESOLVED" : a.appealStatus
                  }
                : a
            )
          }));
          setBannerMsg(
            `Đã cập nhật kết quả "${decisionModal.label}" cho ${decisionModal.app.mssv} và ghi Audit Log.`
          );
          setDecisionModal(null);
        }}
      />

      {/* Audit Dialog for BTV Final Lock & Publish (FR-AWD-04) */}
      <AuditActionDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        title="BTV Chốt Kết quả & Công bố Bảng vàng SV5T"
        description="Hành động này khóa sổ đợt xét, công bố công khai trên /public/honor-roll, gắn huy hiệu E-Portfolio và tự động phát hành E-Certificate có mã QR xác thực."
        targetSummary={`${activeCycle.name} (${approvedCount} hồ sơ đạt)`}
        actionCode="SV5T_FINALIZE_AND_PUBLISH_HONOR_ROLL"
        destructive={false}
        confirmLabel="Chốt sổ & Công bố Bảng vàng"
        onConfirm={() => {
          const now = new Date();
          const formatted = now.toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
          });
          updateActiveCycle((cycle) => ({
            ...cycle,
            status: "PUBLISHED",
            publishedAt: formatted
          }));
          setBannerMsg(
            `Đã chốt kết quả đợt xét SV5T, công bố Bảng vàng /public/honor-roll và phát hành tự động E-Certificate cho ${approvedCount} sinh viên.`
          );
        }}
      />

      {/* Governance Footnote */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="h-4 w-4 shrink-0 text-status-warning" />
        <span>
          Chỉ Ban Thường vụ (BTV) có quyền cấu hình cây tiêu chí và khóa sổ công bố Bảng vàng; mọi thành viên BCH/BTV/Ban
          SV5T bị tự động khóa chấm duyệt trên hồ sơ cá nhân.
        </span>
      </div>
    </div>
  );
}
