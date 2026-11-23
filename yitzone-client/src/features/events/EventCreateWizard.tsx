import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Gamepad2,
  ImagePlus,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  Users,
  Vote,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  RegistrationFormBuilder,
  type RegistrationFormField
} from "@/features/events/RegistrationFormBuilder";
import { cn } from "@/lib/utils";
import {
  createDefaultSessionActivities,
  DEFAULT_BTC_ROLES,
  useEventStore,
  type SessionActivityConfig,
  type StoredEventRecord,
  type WizardSessionDraft
} from "@/stores/event-store";
import { useSurveyStore } from "@/stores/survey-store";
import { createEvent } from "./api";

export interface CreatedEventSummary {
  id: string;
  title: string;
  scope: "FACULTY" | "DEPT_INTERNAL";
  sessionsCount: number;
  btcRolesCount: number;
  capacity: number;
  benefits: string[];
  hasExam: boolean;
  isTeamCompetition: boolean;
  minTeamSize?: number;
  maxTeamSize?: number;
  qualifyTopN?: number;
  status: "DRAFT" | "PENDING_BTV";
  summaryNotice: string;
}

const COVER_PRESETS = [
  { label: "Khuôn viên FIT", url: "/images/hero-campus.jpg" },
  { label: "Hackathon / Học thuật", url: "/images/card-hackathon.jpg" },
  { label: "Gala & SV5T", url: "/images/card-sv5t.jpg" }
] as const;

const BENEFIT_OPTIONS = [
  { code: "DRL", label: "Cộng ĐRL" },
  { code: "CTXH", label: "Cộng CTXH" },
  { code: "CDDN", label: "Cộng CĐDN" }
] as const;

const WIZARD_STEPS = [
  { id: 1, title: "Thông tin & Quyền lợi", short: "Cơ bản" },
  { id: 2, title: "Lịch trình & Thể thức", short: "Buổi / Đội" },
  { id: 3, title: "Biểu mẫu Đăng ký", short: "Form động" },
  { id: 4, title: "Ban Tổ chức", short: "Vị trí BTC" },
  { id: 5, title: "Xem lại & Gửi duyệt", short: "Xác nhận" }
] as const;

type WizardStepId = 1 | 2 | 3 | 4 | 5;
type TemplateKind = "seminar" | "competition" | "internal";

export function EventCreateWizard({
  onCreated
}: {
  onCreated: (created: CreatedEventSummary) => void;
}) {
  const draft = useEventStore((s) => s.wizardDraft);
  const updateDraft = useEventStore((s) => s.updateWizardDraft);
  const resetDraft = useEventStore((s) => s.resetWizardDraft);
  const addEvent = useEventStore((s) => s.addEvent);
  const surveyTemplates = useSurveyStore((s) => s.templates);
  const createSurvey = useSurveyStore((s) => s.createSurvey);

  const [stepError, setStepError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [newBtcRoleTitle, setNewBtcRoleTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<TemplateKind | null>(null);
  const [postEventSurveyTemplateId, setPostEventSurveyTemplateId] = useState<string>(
    () => surveyTemplates[0]?.id ?? "NONE"
  );
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const {
    step,
    coverImage,
    title,
    scope,
    capacity,
    registrationCloseAt,
    description,
    selectedBenefits,
    sessions,
    enableTeamRounds,
    minTeamSize,
    maxTeamSize,
    allowExternal,
    formMode,
    formFields,
    btcRoles
  } = draft;

  const activeBtcRoles = btcRoles.filter((r) => r.enabled);
  const effectiveBenefits = scope === "DEPT_INTERNAL" ? [] : selectedBenefits;
  const requiresBtvApproval = scope === "FACULTY" || effectiveBenefits.length > 0;
  const anySessionHasExam = sessions.some((s) => s.activities.quizExam);
  const anySessionHasLiveQa = sessions.some((s) => s.activities.liveQa);
  const anySessionHasLiveVoting = sessions.some((s) => s.activities.liveVoting);
  const anySessionHasMinigame = sessions.some((s) => s.activities.minigame);
  const firstExamSession = sessions.find((s) => s.activities.quizExam);
  const parsedCapacityNum = Math.max(0, Number(capacity) || 0);
  const isUnlimitedCapacity = parsedCapacityNum === 0;
  const capacityDisplay = isUnlimitedCapacity
    ? "Không giới hạn"
    : `${parsedCapacityNum} ${enableTeamRounds ? "đội" : "người"}`;
  const formattedCloseAt = registrationCloseAt
    ? formatVietnameseDateTime(registrationCloseAt, true)
    : "Chưa đặt hạn";

  const commitTemplate = (kind: TemplateKind) => {
    setStepError(null);
    if (kind === "seminar") {
      updateDraft({
        title: title.trim() || "Hội thảo Chuyên đề Công nghệ 2026",
        scope: "FACULTY",
        coverImage: "/images/hero-campus.jpg",
        capacity: "200",
        registrationCloseAt: "2026-12-09T23:59",
        selectedBenefits: ["Cộng ĐRL", "Cộng CĐDN"],
        enableTeamRounds: false,
        formMode: "ONE_TAP",
        formFields: [],
        sessions: [
          {
            id: "sem-ses-1",
            name: "Buổi 1 · Khai mạc & Chuyên đề chính",
            date: "2026-12-10",
            timeRange: "08:00 – 11:30",
            location: "Hội trường Lớn Khu A",
            activities: createDefaultSessionActivities({
              liveQa: true,
              minigame: true,
              quizExam: true,
              quizMinutes: 20,
              quizPassRate: 70
            })
          }
        ]
      });
    } else if (kind === "competition") {
      const presetFields: RegistrationFormField[] = [
        {
          id: "fld-preset-zalo",
          type: "SHORT_TEXT",
          label: "Số điện thoại Zalo liên hệ khẩn",
          placeholder: "VD: 0901 234 567",
          required: true,
          scope: "PARTICIPANT",
          options: []
        },
        {
          id: "fld-preset-consent",
          type: "CHECKBOX_CONSENT",
          label: "Tôi cam kết tuân thủ quy chế thi đấu và trung thực trong mọi vòng thi",
          required: true,
          scope: "PARTICIPANT",
          options: []
        }
      ];
      updateDraft({
        title: title.trim() || "Cuộc thi Học thuật theo Đội 2026",
        scope: "FACULTY",
        coverImage: "/images/card-hackathon.jpg",
        capacity: "0",
        registrationCloseAt: "2026-12-04T23:59",
        selectedBenefits: ["Cộng ĐRL", "Cộng CĐDN"],
        enableTeamRounds: true,
        minTeamSize: "3",
        maxTeamSize: "5",
        allowExternal: true,
        formMode: "CUSTOM_FORM",
        formFields: presetFields,
        sessions: [
          {
            id: "comp-ses-1",
            name: "Vòng loại (Thi cá nhân gộp điểm đội)",
            date: "2026-12-06",
            timeRange: "08:30 – 10:00",
            location: "Phòng thi trực tuyến YITZone",
            activities: createDefaultSessionActivities({
              quizExam: true,
              quizMinutes: 60,
              quizPassRate: 50,
              quizTeamScoringMode: "SUM_OF_MEMBERS",
              quizQualifyTopN: 5
            })
          },
          {
            id: "comp-ses-2",
            name: "Vòng Chung kết Sân khấu (Top n đội)",
            date: "2026-12-19",
            timeRange: "18:00 – 21:30",
            location: "Hội trường Lớn Khu A",
            activities: createDefaultSessionActivities({
              liveVoting: true,
              liveQa: true,
              minigame: true
            })
          }
        ]
      });
    } else {
      updateDraft({
        title: title.trim() || "Tập huấn Nghiệp vụ CTV Nội bộ Ban",
        scope: "DEPT_INTERNAL",
        coverImage: "/images/card-sv5t.jpg",
        capacity: "40",
        selectedBenefits: [],
        enableTeamRounds: false,
        formMode: "ONE_TAP",
        formFields: [],
        sessions: [
          {
            id: "int-ses-1",
            name: "Buổi 1 · Hướng dẫn quy trình & thực hành",
            date: "2026-12-12",
            timeRange: "17:30 – 19:30",
            location: "Văn phòng Đoàn - Hội FIT",
            activities: createDefaultSessionActivities()
          }
        ]
      });
    }
  };

  const requestApplyTemplate = (kind: TemplateKind) => {
    const hasUserEdits =
      title.trim().length > 0 ||
      description.trim().length > 0 ||
      formFields.length > 0 ||
      sessions.length > 1;
    if (hasUserEdits) {
      setPendingTemplate(kind);
      return;
    }
    commitTemplate(kind);
  };

  const toggleBenefit = (label: string) => {
    if (scope === "DEPT_INTERNAL") return;
    const next = selectedBenefits.includes(label)
      ? selectedBenefits.filter((item) => item !== label)
      : [...selectedBenefits, label];
    updateDraft({ selectedBenefits: next });
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoverError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCoverError("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("Ảnh bìa vượt quá 5MB. Vui lòng chọn ảnh nhẹ hơn.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") updateDraft({ coverImage: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleAddSession = () => {
    const nextIdx = sessions.length + 1;
    updateDraft({
      sessions: [
        ...sessions,
        {
          id: `ses-${Date.now()}`,
          name: `Buổi ${nextIdx} · Phiên tiếp theo`,
          date: sessions[sessions.length - 1]?.date ?? "2026-12-10",
          timeRange: "13:30 – 16:30",
          location: "Phòng Lab A4-202",
          activities: createDefaultSessionActivities()
        }
      ]
    });
  };

  const handleUpdateSession = (id: string, patch: Partial<WizardSessionDraft>) => {
    updateDraft({
      sessions: sessions.map((s) => (s.id === id ? { ...s, ...patch } : s))
    });
  };

  const handleUpdateSessionActivities = (
    id: string,
    patch: Partial<SessionActivityConfig>
  ) => {
    updateDraft({
      sessions: sessions.map((s) =>
        s.id === id ? { ...s, activities: { ...s.activities, ...patch } } : s
      )
    });
  };

  const handleRemoveSession = (id: string) => {
    if (sessions.length <= 1) return;
    updateDraft({ sessions: sessions.filter((s) => s.id !== id) });
  };

  const handleAddBtcRole = () => {
    const trimmed = newBtcRoleTitle.trim();
    if (!trimmed) return;
    updateDraft({
      btcRoles: [...btcRoles, { id: `btc-${Date.now()}`, title: trimmed, enabled: true }]
    });
    setNewBtcRoleTitle("");
  };

  const validateAndGoTo = (target: WizardStepId) => {
    setStepError(null);
    if (target > 1 && !title.trim()) {
      setStepError("Vui lòng nhập tên sự kiện trước khi chuyển sang bước tiếp theo.");
      updateDraft({ step: 1 });
      return;
    }
    if (target > 2) {
      if (sessions.some((s) => !s.name.trim() || !s.location.trim())) {
        setStepError("Mỗi buổi trong lịch trình cần có đầy đủ tên buổi và địa điểm.");
        updateDraft({ step: 2 });
        return;
      }
      if (enableTeamRounds && Number(minTeamSize) > Number(maxTeamSize)) {
        setStepError("Số sinh viên tối thiểu/đội không thể lớn hơn số tối đa.");
        updateDraft({ step: 2 });
        return;
      }
    }
    if (target > 3 && formMode === "CUSTOM_FORM" && formFields.length === 0) {
      setStepError(
        "Bạn đang chọn Biểu mẫu tùy chỉnh nhưng chưa thêm câu hỏi nào. Hãy thêm ít nhất 1 câu hỏi hoặc chuyển về Đăng ký 1 chạm."
      );
      updateDraft({ step: 3 });
      return;
    }
    updateDraft({ step: target });
  };

  const handleSubmit = async (saveAsDraft: boolean) => {
    const trimmed = title.trim();
    if (!trimmed) {
      setStepError("Vui lòng nhập tên sự kiện trước khi lưu.");
      updateDraft({ step: 1 });
      return;
    }

    setSubmitting(true);
    const parsedCapacity = Math.max(0, Number(capacity) || 0);
    const parsedMinSize = Math.max(2, Number(minTeamSize) || 3);
    const parsedMaxSize = Math.max(parsedMinSize, Number(maxTeamSize) || parsedMinSize);
    const parsedTopN = firstExamSession?.activities.quizQualifyTopN ?? undefined;
    const derivedScoringMode = firstExamSession?.activities.quizTeamScoringMode ?? "SUM_OF_MEMBERS";
    const teamSizeLabel =
      parsedMinSize === parsedMaxSize ? `${parsedMinSize}` : `${parsedMinSize}–${parsedMaxSize}`;
    const targetStatus: "DRAFT" | "PENDING_BTV" = saveAsDraft ? "DRAFT" : "PENDING_BTV";

    let createdId = draft.editingEventId ?? `EVT-${Date.now().toString().slice(-4)}`;
    let savedLocallyOnly = false;
    const isEditing = Boolean(draft.editingEventId);
    if (!isEditing) {
      try {
        const created = await createEvent({
          title: trimmed,
          description: description.trim() || undefined,
          visibility: scope === "DEPT_INTERNAL" ? "INTERNAL_CTV" : "PUBLIC_FACULTY",
          benefitTypes: effectiveBenefits.map((label) =>
            label.includes("ĐRL") ? "DRL" : label.includes("CTXH") ? "CTXH" : "CDDN"
          )
        });
        createdId = created.id;
      } catch {
        savedLocallyOnly = true;
      }
    }
    setSubmitting(false);

    const firstSession = sessions[0];
    const firstDateParts = firstSession?.date?.split("-") ?? ["2026", "12", "10"];
    const dayStr = firstDateParts[2] ?? "10";
    const monthStr = `TH${Number(firstDateParts[1] ?? "12")}`;

    const storedRecord: StoredEventRecord = {
      id: createdId,
      title: trimmed,
      subtitle:
        description.trim() ||
        "Chương trình chính thức do Đoàn – Hội Khoa CNTT HCM-UTE tổ chức.",
      coverImage: coverImage || "/images/hero-campus.jpg",
      day: dayStr,
      month: monthStr,
      dateSummary: firstSession
        ? `${formatVietnameseDateTime(firstSession.date, false)} · ${firstSession.timeRange}`
        : "Đang cập nhật lịch trình",
      timeShort: firstSession?.timeRange ?? "08:00",
      location: firstSession?.location ?? "Khoa CNTT HCM-UTE",
      lockNote: `Đóng đăng ký: ${formattedCloseAt}`,
      closeAt: registrationCloseAt,
      scope,
      visibility: scope === "DEPT_INTERNAL" ? "INTERNAL_CTV" : "PUBLIC_FACULTY",
      status: targetStatus,
      benefits: effectiveBenefits,
      registeredCount: 0,
      waitlistCount: 0,
      capacity: parsedCapacity,
      highlights: [
        description.trim() || "Hoạt động chính thức dành cho sinh viên Khoa CNTT HCM-UTE.",
        `${sessions.length} buổi tổ chức tại ${firstSession?.location ?? "HCM-UTE"}.`,
        formMode === "CUSTOM_FORM"
          ? `Biểu mẫu đăng ký gồm ${formFields.length} câu hỏi bổ sung (tự điền hồ sơ YITZone).`
          : "Hỗ trợ đăng ký 1 chạm bằng hồ sơ YITZone đã xác thực."
      ],
      sessions: sessions.map((s, idx) => ({
        id: s.id,
        step: String(idx + 1).padStart(2, "0"),
        name: s.name,
        date: s.date,
        timeRange: s.timeRange,
        location: s.location,
        topic: description.trim() || "Nội dung chi tiết được cập nhật bởi Ban Tổ chức.",
        checkIn: `${s.location} (QR / Thẻ SV)`,
        checkOut: `${s.location} (Check-out cuối buổi)`,
        activities: { ...s.activities }
      })),
      btcRoles: activeBtcRoles.map((r) => r.title),
      formMode,
      formFields,
      hasExam: anySessionHasExam,
      examMinutes: firstExamSession?.activities.quizMinutes ?? 20,
      examPassRate: firstExamSession?.activities.quizPassRate ?? 70,
      examPath: anySessionHasExam ? `/exam/exam-${createdId.toLowerCase()}` : undefined,
      isTeamCompetition: enableTeamRounds,
      minTeamSize: enableTeamRounds ? parsedMinSize : undefined,
      maxTeamSize: enableTeamRounds ? parsedMaxSize : undefined,
      qualifyTopN: enableTeamRounds ? parsedTopN : undefined,
      scoringMode: enableTeamRounds ? derivedScoringMode : undefined,
      allowExternal: enableTeamRounds ? allowExternal : undefined
    };

    addEvent(storedRecord);
    if (postEventSurveyTemplateId !== "NONE") {
      createSurvey({
        title: `Khảo sát sau sự kiện — ${trimmed}`,
        scope: "Sau sự kiện",
        mode: "IDENTIFIED",
        templateId: postEventSurveyTemplateId
      });
    }
    resetDraft();
    setStepError(null);

    const modeSummary = enableTeamRounds
      ? ` · Đăng ký theo đội (${teamSizeLabel} SV/đội${parsedTopN ? ` · Top ${parsedTopN}` : ""}${allowExternal ? ", mở ngoài trường" : ""})`
      : "";
    const activeModules = [
      anySessionHasLiveQa && "Live Q&A",
      anySessionHasLiveVoting && "Live Voting",
      anySessionHasExam && "Thi trắc nghiệm",
      anySessionHasMinigame && "Minigame"
    ].filter(Boolean);
    const moduleSummary = activeModules.length > 0 ? ` · ${activeModules.join(", ")}` : "";
    const syncNote = savedLocallyOnly ? "" : "";

    onCreated({
      id: createdId,
      title: trimmed,
      scope,
      sessionsCount: sessions.length,
      btcRolesCount: activeBtcRoles.length,
      capacity: parsedCapacity,
      benefits: effectiveBenefits,
      hasExam: anySessionHasExam,
      isTeamCompetition: enableTeamRounds,
      minTeamSize: enableTeamRounds ? parsedMinSize : undefined,
      maxTeamSize: enableTeamRounds ? parsedMaxSize : undefined,
      qualifyTopN: enableTeamRounds ? parsedTopN : undefined,
      status: targetStatus,
      summaryNotice: `${
        saveAsDraft
          ? isEditing
            ? "Đã cập nhật bản nháp"
            : "Đã lưu bản nháp"
          : requiresBtvApproval
            ? isEditing
              ? "Đã cập nhật & gửi lại BTV thẩm định"
              : "Đã gửi BTV thẩm định"
            : "Đã gửi Trưởng Ban duyệt"
      } "${trimmed}" (${sessions.length} buổi · ${activeBtcRoles.length} vị trí BTC${modeSummary}${moduleSummary})${syncNote}.`
    });
  };

  return (
    <div className="space-y-5">
      {/* Horizontal 5-Step Progress Bar */}
      <nav
        aria-label="Các bước khởi tạo sự kiện"
        className="rounded-2xl border border-border bg-card p-3 sm:p-4"
      >
        <ol className="grid gap-2 sm:grid-cols-5">
          {WIZARD_STEPS.map((item) => {
            const isActive = step === item.id;
            const isCompleted = step > item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => validateAndGoTo(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "border-primary bg-primary/8 text-foreground"
                      : isCompleted
                        ? "border-status-success/30 bg-status-success/5 text-foreground hover:border-status-success/50"
                        : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full tabular-mono text-xs font-semibold",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-status-success text-white"
                          : "border border-border bg-card text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : item.id}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-foreground sm:text-sm">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {isCompleted ? "Đã hoàn tất" : isActive ? "Đang thiết lập" : item.short}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {stepError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-2.5 text-xs font-medium text-status-danger"
        >
          <span>{stepError}</span>
          <button type="button" onClick={() => setStepError(null)} className="underline">
            Đóng
          </button>
        </div>
      )}

      {/* Main 12-Col Split: Step Form (8 cols) + Live Preview Rail (4 cols) */}
      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* Active Step Container */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 lg:col-span-8">
          {/* STEP 1: BASIC INFO & BENEFITS */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-medium text-foreground">
                    Thông tin cơ bản &amp; Quyền lợi
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Chọn nhanh mẫu khởi tạo hoặc điền thông tin sự kiện. Sửa quyền lợi hoặc sức chứa sau khi duyệt sẽ yêu cầu BTV thẩm định lại.
                  </p>
                </div>
              </div>

              {/* Quick Template Selector */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Mẫu khởi tạo nhanh</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => requestApplyTemplate("seminar")}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <div className="font-semibold text-foreground">Hội thảo / Workshop</div>
                      <div className="text-[11px] text-muted-foreground">Cá nhân · ĐRL &amp; CĐDN</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => requestApplyTemplate("competition")}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <Trophy className="h-4 w-4 shrink-0 text-cal-exam" />
                    <div>
                      <div className="font-semibold text-foreground">Cuộc thi theo Đội</div>
                      <div className="text-[11px] text-muted-foreground">Đa vòng · Chọn Top n</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => requestApplyTemplate("internal")}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-left text-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <Users className="h-4 w-4 shrink-0 text-cal-dept" />
                    <div>
                      <div className="font-semibold text-foreground">Nội bộ Ban / CTV</div>
                      <div className="text-[11px] text-muted-foreground">Không quyền lợi · TB duyệt</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Basic fields */}
              <div className="grid gap-4 sm:grid-cols-12">
                <div className="space-y-1.5 sm:col-span-8">
                  <Label htmlFor="wiz-title">Tên sự kiện *</Label>
                  <Input
                    id="wiz-title"
                    placeholder="VD: Cuộc thi Học thuật CNTT 2026 hoặc Hội thảo Chuyên đề"
                    value={title}
                    onChange={(e) => {
                      updateDraft({ title: e.target.value });
                      if (stepError) setStepError(null);
                    }}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-4">
                  <Label htmlFor="wiz-scope">Phạm vi hiển thị</Label>
                  <Select
                    value={scope}
                    onValueChange={(v) => {
                      const next = v as "FACULTY" | "DEPT_INTERNAL";
                      if (next === "DEPT_INTERNAL") {
                        updateDraft({
                          scope: next,
                          selectedBenefits: [],
                          enableTeamRounds: false
                        });
                      } else {
                        updateDraft({
                          scope: next,
                          selectedBenefits:
                            selectedBenefits.length === 0 ? ["Cộng ĐRL"] : selectedBenefits
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="wiz-scope" className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FACULTY">Công khai Toàn Khoa</SelectItem>
                      <SelectItem value="DEPT_INTERNAL">Nội bộ Ban / CTV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-12">
                <div className="space-y-1.5 sm:col-span-6">
                  <Label htmlFor="wiz-capacity">
                    {enableTeamRounds ? "Trần số đội đăng ký" : "Sức chứa tối đa (người)"}
                  </Label>
                  <Input
                    id="wiz-capacity"
                    type="number"
                    min={0}
                    max={5000}
                    value={capacity}
                    onChange={(e) => updateDraft({ capacity: e.target.value })}
                    className="tabular-mono h-10 rounded-xl"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Nhập <span className="tabular-mono font-semibold text-foreground">0</span> để không giới hạn
                    {isUnlimitedCapacity && (
                      <span className="ml-1.5 font-medium text-primary">· Đang bật: Không giới hạn</span>
                    )}
                  </p>
                </div>
                <div className="space-y-1.5 sm:col-span-6">
                  <Label htmlFor="wiz-close-at">Thời điểm đóng đăng ký &amp; khóa danh sách</Label>
                  <DateTimePicker
                    id="wiz-close-at"
                    mode="datetime"
                    value={registrationCloseAt}
                    onChange={(val) => updateDraft({ registrationCloseAt: val })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Sau mốc này hệ thống khóa đăng ký, hủy suất và chốt danh sách chính thức.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wiz-desc">Mô tả ngắn gọn</Label>
                <Textarea
                  id="wiz-desc"
                  rows={2}
                  placeholder="Tóm tắt mục tiêu, đối tượng tham gia hoặc nội dung chính..."
                  value={description}
                  onChange={(e) => updateDraft({ description: e.target.value })}
                  className="rounded-xl text-sm"
                />
              </div>

              {/* Benefit Chips */}
              <div className="space-y-2">
                <Label>Quyền lợi tham dự (chỉ ghi nhận có cộng, không liệt kê số điểm)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {BENEFIT_OPTIONS.map((opt) => {
                    const active = selectedBenefits.includes(opt.label);
                    return (
                      <button
                        key={opt.code}
                        type="button"
                        disabled={scope === "DEPT_INTERNAL"}
                        onClick={() => toggleBenefit(opt.label)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                          active
                            ? "border-primary bg-primary/12 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {active && <CheckCircle2 className="h-3.5 w-3.5" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                  {scope === "DEPT_INTERNAL" && (
                    <span className="text-xs text-muted-foreground">
                      Sự kiện nội bộ Ban/CTV không gắn quyền lợi ĐRL / CTXH / CĐDN.
                    </span>
                  )}
                </div>
              </div>

              {/* Post-Event Survey Template Selector (B13) */}
              <div className="space-y-1.5 border-t border-border/70 pt-4">
                <Label htmlFor="wiz-survey-tpl">
                  Khảo sát sau sự kiện (Mở khóa E-Certificate sau khi điểm danh)
                </Label>
                <Select value={postEventSurveyTemplateId} onValueChange={setPostEventSurveyTemplateId}>
                  <SelectTrigger id="wiz-survey-tpl" className="h-10 rounded-xl">
                    <SelectValue placeholder="Chọn mẫu khảo sát đính kèm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Không đính kèm khảo sát tự động</SelectItem>
                    {surveyTemplates.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.name} ({tpl.questions.length} câu hỏi chuẩn)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Hệ thống tự động khởi tạo biểu mẫu khảo sát từ mẫu đã chọn để sinh viên đánh giá trong vòng 24 giờ sau khi check-out.
                </p>
              </div>

              {/* Cover Image */}
              <div className="space-y-2 border-t border-border/70 pt-4">
                <Label>Ảnh bìa 16:9 (≤ 5MB)</Label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Tải lên ảnh bìa sự kiện"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-full"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Tải ảnh lên</span>
                  </Button>
                  {COVER_PRESETS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => {
                        updateDraft({ coverImage: preset.url });
                        setCoverError(null);
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        coverImage === preset.url
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                {coverError && (
                  <p role="alert" className="text-xs font-medium text-status-danger">
                    {coverError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: SESSIONS, TEAM ROUNDS & EXAM */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-4">
                <div>
                  <h2 className="font-display text-xl font-medium text-foreground">
                    Hình thức Đăng ký &amp; Lịch trình Đa buổi
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Chọn đăng ký Cá nhân hay Theo Đội, sau đó thiết lập các buổi và bật hoạt động tương tác (Live Q&amp;A, Live Voting, Thi trắc nghiệm, Minigame) cho từng buổi.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={handleAddSession}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm buổi</span>
                </Button>
              </div>

              {/* Tier 1: Event-level Registration Format (Individual vs Team) */}
              <div
                className={cn(
                  "space-y-4 rounded-xl border p-4 transition-colors",
                  enableTeamRounds
                    ? "border-primary/35 bg-primary/[0.03]"
                    : "border-border bg-muted/25"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                        enableTeamRounds
                          ? "bg-primary/12 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Đăng ký tham gia theo Đội
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        Dùng cho Hackathon, Cuộc thi học thuật. Nếu có vòng loại gộp điểm đội, hãy bật <strong>Thi trắc nghiệm</strong> ngay trong buổi tương ứng bên dưới.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enableTeamRounds}
                    aria-label="Bật chế độ Đăng ký tham gia theo Đội"
                    disabled={scope === "DEPT_INTERNAL"}
                    onClick={() => updateDraft({ enableTeamRounds: !enableTeamRounds })}
                    className={cn(
                      "relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-45",
                      enableTeamRounds ? "bg-primary" : "bg-border"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                        enableTeamRounds ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {enableTeamRounds && (
                  <div className="grid gap-3 border-t border-border/70 pt-3.5 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="wiz-team-min" className="text-xs text-muted-foreground">
                        Tối thiểu / đội
                      </Label>
                      <div className="relative">
                        <Input
                          id="wiz-team-min"
                          type="number"
                          min={2}
                          max={10}
                          value={minTeamSize}
                          onChange={(e) => updateDraft({ minTeamSize: e.target.value })}
                          className="tabular-mono h-10 rounded-md bg-card pr-11"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                          SV
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="wiz-team-max" className="text-xs text-muted-foreground">
                        Tối đa / đội
                      </Label>
                      <div className="relative">
                        <Input
                          id="wiz-team-max"
                          type="number"
                          min={2}
                          max={10}
                          value={maxTeamSize}
                          onChange={(e) => updateDraft({ maxTeamSize: e.target.value })}
                          className="tabular-mono h-10 rounded-md bg-card pr-11"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                          SV
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-xs font-medium text-muted-foreground">
                        Đối tượng dự thi
                      </span>
                      <label className="flex h-10 cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-card px-3 text-xs font-medium text-foreground transition-colors hover:border-primary/40">
                        <span className="truncate">SV ngoài trường (OTP)</span>
                        <input
                          type="checkbox"
                          checked={allowExternal}
                          onChange={(e) => updateDraft({ allowExternal: e.target.checked })}
                          className="h-4 w-4 shrink-0 accent-primary"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Sessions list with per-session interactive modules */}
              <div className="space-y-3">
                {sessions.map((ses, idx) => {
                  const hasNextSession = idx < sessions.length - 1;
                  const topNValue = ses.activities.quizQualifyTopN ?? 0;

                  return (
                  <div
                    key={ses.id}
                    className="space-y-3 rounded-xl border border-border bg-muted/25 p-4"
                  >
                    <div className="grid gap-2.5 sm:grid-cols-12">
                      <div className="sm:col-span-6">
                        <Label htmlFor={`ses-name-${ses.id}`} className="text-[11px] text-muted-foreground">
                          Buổi {idx + 1}
                        </Label>
                        <Input
                          id={`ses-name-${ses.id}`}
                          value={ses.name}
                          onChange={(e) => handleUpdateSession(ses.id, { name: e.target.value })}
                          className="mt-1 h-9 rounded-md bg-card text-xs"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <Label htmlFor={`ses-loc-${ses.id}`} className="text-[11px] text-muted-foreground">
                          Địa điểm
                        </Label>
                        <Input
                          id={`ses-loc-${ses.id}`}
                          value={ses.location}
                          onChange={(e) => handleUpdateSession(ses.id, { location: e.target.value })}
                          className="mt-1 h-9 rounded-md bg-card text-xs"
                        />
                      </div>
                      <div className="flex items-end justify-end sm:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={sessions.length <= 1}
                          onClick={() => handleRemoveSession(ses.id)}
                          aria-label={`Xóa buổi ${idx + 1}`}
                          className="h-9 w-9 rounded-full text-muted-foreground hover:text-status-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="sm:col-span-6">
                        <Label className="text-[11px] text-muted-foreground">Ngày tổ chức</Label>
                        <div className="mt-1">
                          <DateTimePicker
                            mode="date"
                            value={ses.date}
                            onChange={(nextDate) => handleUpdateSession(ses.id, { date: nextDate })}
                            className="h-9 rounded-md px-3 text-xs"
                          />
                        </div>
                      </div>
                      <div className="sm:col-span-6">
                        <Label htmlFor={`ses-time-${ses.id}`} className="text-[11px] text-muted-foreground">
                          Khung giờ
                        </Label>
                        <Input
                          id={`ses-time-${ses.id}`}
                          value={ses.timeRange}
                          onChange={(e) => handleUpdateSession(ses.id, { timeRange: e.target.value })}
                          className="tabular-mono mt-1 h-9 rounded-md bg-card text-xs"
                        />
                      </div>
                    </div>

                    {/* Per-Session Interactive Activity Toggles */}
                    <div className="space-y-2.5 border-t border-border/70 pt-3">
                      <div className="text-[11px] font-semibold text-muted-foreground">
                        Hoạt động tương tác trong Buổi {idx + 1}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-pressed={ses.activities.liveQa}
                          onClick={() =>
                            handleUpdateSessionActivities(ses.id, {
                              liveQa: !ses.activities.liveQa
                            })
                          }
                          className={cn(
                            "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                            ses.activities.liveQa
                              ? "border-primary bg-primary/12 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Live Q&amp;A</span>
                        </button>

                        <button
                          type="button"
                          aria-pressed={ses.activities.liveVoting}
                          onClick={() =>
                            handleUpdateSessionActivities(ses.id, {
                              liveVoting: !ses.activities.liveVoting
                            })
                          }
                          className={cn(
                            "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                            ses.activities.liveVoting
                              ? "border-primary bg-primary/12 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          )}
                        >
                          <Vote className="h-3.5 w-3.5" />
                          <span>Live Voting</span>
                        </button>

                        <button
                          type="button"
                          aria-pressed={ses.activities.quizExam}
                          onClick={() =>
                            handleUpdateSessionActivities(ses.id, {
                              quizExam: !ses.activities.quizExam
                            })
                          }
                          className={cn(
                            "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                            ses.activities.quizExam
                              ? "border-primary bg-primary/12 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          )}
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          <span>Thi trắc nghiệm</span>
                        </button>

                        <button
                          type="button"
                          aria-pressed={ses.activities.minigame}
                          onClick={() =>
                            handleUpdateSessionActivities(ses.id, {
                              minigame: !ses.activities.minigame
                            })
                          }
                          className={cn(
                            "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                            ses.activities.minigame
                              ? "border-primary bg-primary/12 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          )}
                        >
                          <Gamepad2 className="h-3.5 w-3.5" />
                          <span>Minigame</span>
                        </button>
                      </div>

                      {/* Progressive disclosure: Quiz settings for this session (+ Team Qualifying rules when Team mode is ON) */}
                      {ses.activities.quizExam && (
                        <div className="space-y-3 rounded-lg border border-border/80 bg-card p-3.5">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                              <Label
                                htmlFor={`ses-quiz-mins-${ses.id}`}
                                className="text-[11px] text-muted-foreground"
                              >
                                Thời lượng bài thi Buổi {idx + 1}
                              </Label>
                              <div className="relative">
                                <Input
                                  id={`ses-quiz-mins-${ses.id}`}
                                  type="number"
                                  min={5}
                                  max={120}
                                  value={ses.activities.quizMinutes ?? 20}
                                  onChange={(e) =>
                                    handleUpdateSessionActivities(ses.id, {
                                      quizMinutes: Math.max(5, Number(e.target.value) || 20)
                                    })
                                  }
                                  className="tabular-mono h-9 rounded-md pr-12 text-xs"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                                  phút
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label
                                htmlFor={`ses-quiz-pass-${ses.id}`}
                                className="text-[11px] text-muted-foreground"
                              >
                                Điểm sàn đạt
                              </Label>
                              <div className="relative">
                                <Input
                                  id={`ses-quiz-pass-${ses.id}`}
                                  type="number"
                                  min={10}
                                  max={100}
                                  value={ses.activities.quizPassRate ?? 70}
                                  onChange={(e) =>
                                    handleUpdateSessionActivities(ses.id, {
                                      quizPassRate: Math.min(100, Math.max(10, Number(e.target.value) || 70))
                                    })
                                  }
                                  className="tabular-mono h-9 rounded-md pr-9 text-xs"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                                  %
                                </span>
                              </div>
                            </div>
                          </div>

                          {enableTeamRounds && (
                            <div className="grid gap-3 border-t border-border/70 pt-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label
                                  htmlFor={`ses-quiz-score-${ses.id}`}
                                  className="text-[11px] text-muted-foreground"
                                >
                                  {hasNextSession
                                    ? "Cách gộp điểm Đội (Vòng loại)"
                                    : "Cách tính điểm xếp hạng Đội"}
                                </Label>
                                <Select
                                  value={ses.activities.quizTeamScoringMode ?? "SUM_OF_MEMBERS"}
                                  onValueChange={(v) =>
                                    handleUpdateSessionActivities(ses.id, {
                                      quizTeamScoringMode: v as "SUM_OF_MEMBERS" | "AVG_OF_MEMBERS"
                                    })
                                  }
                                >
                                  <SelectTrigger
                                    id={`ses-quiz-score-${ses.id}`}
                                    className="h-9 rounded-md bg-card text-xs"
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="SUM_OF_MEMBERS">Tổng điểm thành viên (SUM)</SelectItem>
                                    <SelectItem value="AVG_OF_MEMBERS">Điểm trung bình đội (AVG)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {hasNextSession ? (
                                <div className="space-y-1">
                                  <Label
                                    htmlFor={`ses-quiz-topn-${ses.id}`}
                                    className="text-[11px] text-muted-foreground"
                                  >
                                    Chọn vào Buổi {idx + 2} (0 = không lọc)
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id={`ses-quiz-topn-${ses.id}`}
                                      type="number"
                                      min={0}
                                      max={50}
                                      value={topNValue}
                                      onChange={(e) =>
                                        handleUpdateSessionActivities(ses.id, {
                                          quizQualifyTopN: Math.max(0, Number(e.target.value) || 0)
                                        })
                                      }
                                      className="tabular-mono h-9 rounded-md pr-11 text-xs"
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">
                                      đội
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="block text-[11px] font-medium text-muted-foreground">
                                    Kết quả vòng thi
                                  </span>
                                  <div className="flex h-9 items-center rounded-md border border-dashed border-border bg-muted/40 px-3 text-xs text-muted-foreground">
                                    Xếp hạng chung cuộc (1 vòng duy nhất)
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Progressive disclosure: Secret ballot option for Live Voting */}
                      {ses.activities.liveVoting && (
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/80 bg-card px-3 py-2 text-xs text-foreground">
                          <input
                            type="checkbox"
                            checked={Boolean(ses.activities.liveVotingSecret)}
                            onChange={(e) =>
                              handleUpdateSessionActivities(ses.id, {
                                liveVotingSecret: e.target.checked
                              })
                            }
                            className="h-4 w-4 accent-primary"
                          />
                          <span>
                            Bật chế độ <strong>Bỏ phiếu kín</strong> cho Live Voting Buổi {idx + 1} (ẩn tỷ lệ kiểm phiếu trực tiếp, chỉ hiển thị tổng lượt bỏ phiếu)
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: DYNAMIC REGISTRATION FORM BUILDER */}
          {step === 3 && (
            <RegistrationFormBuilder
              mode={formMode}
              onModeChange={(nextMode) => updateDraft({ formMode: nextMode })}
              fields={formFields}
              onFieldsChange={(nextFields) => updateDraft({ formFields: nextFields })}
              isTeamEvent={enableTeamRounds}
            />
          )}

          {/* STEP 4: BTC ROLES */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-4">
                <div>
                  <h2 className="font-display text-xl font-medium text-foreground">
                    Vị trí Tuyển Ban Tổ chức ({activeBtcRoles.length}/{btcRoles.length} đang mở)
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Bật/tắt từ 7 vị trí mẫu hoặc thêm vị trí mới. Không giới hạn số lượng ứng tuyển — Trưởng BTC duyệt theo NV1/NV2.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => updateDraft({ btcRoles: DEFAULT_BTC_ROLES.map((r) => ({ ...r })) })}
                >
                  Khôi phục 7 mẫu
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {btcRoles.map((role) => (
                  <div
                    key={role.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border py-1.5 pl-3.5 pr-2 text-xs font-medium transition-colors",
                      role.enabled
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-muted/40 text-muted-foreground"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft({
                          btcRoles: btcRoles.map((r) =>
                            r.id === role.id ? { ...r, enabled: !r.enabled } : r
                          )
                        })
                      }
                      aria-pressed={role.enabled}
                      className="inline-flex items-center gap-1.5"
                    >
                      {role.enabled && <CheckCircle2 className="h-3.5 w-3.5" />}
                      <span>{role.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft({ btcRoles: btcRoles.filter((r) => r.id !== role.id) })
                      }
                      aria-label={`Xóa vị trí ${role.title}`}
                      className="rounded-full p-1 text-muted-foreground hover:bg-background hover:text-status-danger"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  aria-label="Tên vị trí Ban Tổ chức mới"
                  value={newBtcRoleTitle}
                  onChange={(e) => setNewBtcRoleTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddBtcRole();
                    }
                  }}
                  placeholder="Thêm vị trí BTC tùy chỉnh (VD: Hỗ trợ Phòng máy, Điều phối BGK)..."
                  className="h-10 flex-1 rounded-xl text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-full px-5"
                  disabled={!newBtcRoleTitle.trim()}
                  onClick={handleAddBtcRole}
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm vị trí</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & SUBMIT */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="border-b border-border/70 pb-4">
                <h2 className="font-display text-xl font-medium text-foreground">
                  Xem lại Kế hoạch &amp; Gửi Thẩm định
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Kiểm tra toàn bộ thông số sự kiện trước khi lưu bản nháp hoặc gửi phê duyệt xuất bản.
                </p>
              </div>

              <div className="divide-y divide-border rounded-xl border border-border text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="text-xs font-semibold text-muted-foreground">Tên sự kiện</span>
                  <span className="font-medium text-foreground">{title}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="text-xs font-semibold text-muted-foreground">Phạm vi &amp; Sức chứa</span>
                  <span className="tabular-mono text-xs text-foreground">
                    {scope === "FACULTY" ? "Công khai Toàn Khoa" : "Nội bộ Ban / CTV"} · {capacityDisplay} · Đóng ĐK: {formattedCloseAt}
                  </span>
                </div>
                <div className="space-y-2 px-4 py-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Lịch trình &amp; Hoạt động theo buổi ({sessions.length} buổi)
                  </span>
                  <ul className="space-y-2 text-xs text-foreground">
                    {sessions.map((s, idx) => (
                      <li key={s.id} className="space-y-1 rounded-lg bg-muted/35 p-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">
                            {idx + 1}. {s.name}
                          </span>
                          <span className="tabular-mono text-muted-foreground">
                            {formatVietnameseDateTime(s.date, false)} · {s.timeRange} · {s.location}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {s.activities.liveQa && <Badge variant="info">Live Q&amp;A</Badge>}
                          {s.activities.liveVoting && (
                            <Badge variant="default">
                              Live Voting{s.activities.liveVotingSecret ? " (Phiếu kín)" : ""}
                            </Badge>
                          )}
                          {s.activities.quizExam && (
                            <Badge variant="calExam">
                              Thi trắc nghiệm ({s.activities.quizMinutes ?? 20}p · ≥ {s.activities.quizPassRate ?? 70}%
                              {enableTeamRounds
                                ? ` · ${s.activities.quizTeamScoringMode === "AVG_OF_MEMBERS" ? "AVG" : "SUM"}${
                                    idx < sessions.length - 1 && (s.activities.quizQualifyTopN ?? 0) > 0
                                      ? ` · Top ${s.activities.quizQualifyTopN} đội`
                                      : " · Chung cuộc"
                                  }`
                                : ""}
                              )
                            </Badge>
                          )}
                          {s.activities.minigame && <Badge variant="calArts">Minigame</Badge>}
                          {!s.activities.liveQa &&
                            !s.activities.liveVoting &&
                            !s.activities.quizExam &&
                            !s.activities.minigame && (
                              <span className="text-[11px] text-muted-foreground">
                                Chỉ điểm danh tham dự
                              </span>
                            )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="text-xs font-semibold text-muted-foreground">Hình thức đăng ký</span>
                  <div className="flex flex-wrap gap-1.5">
                    {enableTeamRounds ? (
                      <Badge variant="calExam">
                        Đăng ký theo đội ({minTeamSize === maxTeamSize ? minTeamSize : `${minTeamSize}–${maxTeamSize}`} SV)
                        {allowExternal ? " · Mở SV ngoài trường (OTP)" : ""}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Đăng ký cá nhân</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="text-xs font-semibold text-muted-foreground">Biểu mẫu đăng ký</span>
                  <span className="text-xs text-foreground">
                    {formMode === "ONE_TAP"
                      ? "Đăng ký 1 chạm (tự lấy hồ sơ YITZone)"
                      : `Biểu mẫu tùy chỉnh (${formFields.length} câu hỏi · ${formFields.filter((f) => f.required).length} bắt buộc)`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <span className="text-xs font-semibold text-muted-foreground">Vị trí BTC đang mở</span>
                  <span className="text-xs text-foreground">
                    {activeBtcRoles.map((r) => r.title).join(", ") || "Không tuyển thêm BTC"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-status-info/30 bg-status-info/10 px-4 py-3 text-xs leading-relaxed text-status-info">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {requiresBtvApproval
                    ? "Sự kiện cấp Khoa hoặc có gắn quyền lợi sẽ chuyển vào hàng chờ Ban Thường vụ (BTV) thẩm định và phê duyệt xuất bản."
                    : "Sự kiện nội bộ Ban/CTV không gắn quyền lợi có thể được Trưởng Ban tương ứng trực tiếp phê duyệt công bố."}
                </span>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full px-4"
              disabled={step === 1}
              onClick={() => updateDraft({ step: Math.max(1, step - 1) as WizardStepId })}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại</span>
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {title.trim() && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full px-4"
                  disabled={submitting}
                  onClick={() => void handleSubmit(true)}
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Lưu bản nháp</span>
                </Button>
              )}

              {step < 5 ? (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full px-5"
                  onClick={() => validateAndGoTo((step + 1) as WizardStepId)}
                >
                  <span>Bước tiếp theo</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full px-5"
                  disabled={submitting}
                  onClick={() => void handleSubmit(false)}
                >
                  {submitting
                    ? "Đang lưu..."
                    : requiresBtvApproval
                      ? "Lưu & Gửi BTV Thẩm định"
                      : "Lưu & Gửi Trưởng Ban Duyệt"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Live Preview Rail (4 cols) */}
        <aside className="rounded-2xl border border-border bg-card lg:sticky lg:top-20 lg:col-span-4">
          <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-muted">
            {coverImage ? (
              <img
                src={coverImage}
                alt="Xem trước thẻ sự kiện"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                <ImagePlus className="h-6 w-6 text-primary/60" />
                <span>Chưa có ảnh bìa</span>
              </div>
            )}
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <Badge variant={scope === "FACULTY" ? "calFaculty" : "calDept"}>
                {scope === "FACULTY" ? "Toàn Khoa" : "Nội bộ CTV"}
              </Badge>
              {enableTeamRounds && (
                <Badge variant="calExam">
                  Cuộc thi theo đội ({minTeamSize === maxTeamSize ? minTeamSize : `${minTeamSize}–${maxTeamSize}`} SV)
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div>
              <h3 className="font-display text-base font-medium leading-snug text-foreground">
                {title.trim() || "Tên sự kiện sẽ hiển thị tại đây"}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {description.trim() ||
                  "Bản xem trước thời gian thực giúp BTC rà soát nhanh thông tin hiển thị trên Cổng Sự kiện."}
              </p>
            </div>

            {effectiveBenefits.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {effectiveBenefits.map((b) => (
                  <Badge key={b} variant="success">
                    {b}
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-1.5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="tabular-mono">
                  {sessions[0]?.date ? formatVietnameseDateTime(sessions[0].date, false) : "—"} · {sessions[0]?.timeRange ?? "—"} ({sessions.length} buổi)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{sessions[0]?.location ?? "Chưa nhập địa điểm"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="tabular-mono">
                  Sức chứa: {capacityDisplay} · {activeBtcRoles.length} vị trí BTC
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  {formMode === "ONE_TAP"
                    ? "Đăng ký 1 chạm"
                    : `Form tùy chỉnh (${formFields.length} câu hỏi)`}
                </span>
              </div>
              {(anySessionHasLiveQa ||
                anySessionHasLiveVoting ||
                anySessionHasExam ||
                anySessionHasMinigame) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {anySessionHasLiveQa && <Badge variant="info">Live Q&amp;A</Badge>}
                  {anySessionHasLiveVoting && <Badge variant="default">Live Voting</Badge>}
                  {anySessionHasExam && <Badge variant="calExam">Thi trắc nghiệm</Badge>}
                  {anySessionHasMinigame && <Badge variant="calArts">Minigame</Badge>}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Safe Template Overwrite Confirmation */}
      <Dialog
        open={Boolean(pendingTemplate)}
        onOpenChange={(open) => {
          if (!open) setPendingTemplate(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-lg font-medium">
              <AlertTriangle className="h-5 w-5 text-status-warning" />
              <span>Áp dụng mẫu khởi tạo mới?</span>
            </DialogTitle>
            <DialogDescription>
              Bạn đã nhập một số thông tin cho sự kiện hiện tại. Áp dụng mẫu mới sẽ thay thế cấu hình lịch trình, quyền lợi và biểu mẫu đăng ký (tên sự kiện vẫn được giữ lại).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setPendingTemplate(null)}
            >
              Giữ nguyên dữ liệu hiện tại
            </Button>
            <Button
              type="button"
              className="rounded-full"
              onClick={() => {
                if (pendingTemplate) commitTemplate(pendingTemplate);
                setPendingTemplate(null);
              }}
            >
              Áp dụng mẫu này
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
