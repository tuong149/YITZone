import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BellRing,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Info,
  KeyRound,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ADVANCED_PROGRAM_FACULTY_NAME,
  FACULTY_LIST,
  FIT_FACULTY_NAME,
  buildClassPlaceholder,
  findCatalogEntry,
  formatFacultyDisplayName,
  getMajorsByFaculty,
  resolveMajorCandidatesByMssv
} from "@/features/iam/data/faculty-major-catalog";
import { recordPrivacyConsent } from "@/features/iam/api";
import { loadOnboardingState, saveOnboardingState } from "@/features/iam/data/onboarding-storage";
import { cn } from "@/lib/utils";
import { getOrCreateDeviceKeyPair } from "@/lib/webcrypto";
import { AUTH_REDIRECT_STORAGE_KEY, useAuthStore } from "@/stores/auth-store";

function evaluatePasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  if (score <= 1) return { score: 25, label: "Yếu (cần ≥ 8 ký tự, chữ hoa, số, ký tự đặc biệt)", colorClass: "bg-status-danger" };
  if (score === 2) return { score: 50, label: "Trung bình", colorClass: "bg-status-warning" };
  if (score === 3) return { score: 75, label: "Khá mạnh", colorClass: "bg-brand-cyan" };
  return { score: 100, label: "Mạnh (an toàn)", colorClass: "bg-status-success" };
}

const INTEREST_OPTIONS = [
  { id: "faculty-events", label: "Sự kiện Khoa & Hội thảo" },
  { id: "academic-oj", label: "Học thuật & Online Judge" },
  { id: "sv5t", label: "Sinh viên 5 tốt" },
  { id: "arts-clubs", label: "Văn nghệ & CLB" },
  { id: "fundraising-store", label: "Cửa hàng Gây quỹ" },
  { id: "volunteer-ctxh", label: "Tình nguyện & CTXH" }
];

const URGENT_PATH_PREFIXES = ["/scanner", "/attendance", "/live-qa", "/minigame", "/voting"];

function isUrgentRedirect(target) {
  if (!target || typeof target !== "string") return false;
  return URGENT_PATH_PREFIXES.some((prefix) => target.startsWith(prefix));
}

function parseCleanName(rawName) {
  const value = (rawName || "").trim();
  const match = value.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : value || "Sinh viên YITZone";
}

export function OnboardingWizardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const userId = useAuthStore((s) => s.userId) ?? "";
  const email = useAuthStore((s) => s.email) ?? "";
  const rawFullName = useAuthStore((s) => s.fullName) ?? "";
  const roleScopes = useAuthStore((s) => s.roleScopes);
  const authProvider = useAuthStore((s) => s.authProvider);
  const fullName = parseCleanName(rawFullName);

  const routeState = location.state ?? {};
  const isGoogleSignIn = routeState.source === "google" || authProvider === "google";
  const wizardSteps = useMemo(
    () =>
      isGoogleSignIn
        ? [
            { key: "identity", label: "Xác nhận định danh & Khoa", optional: false },
            { key: "password", label: "Đặt mật khẩu độc lập", optional: true },
            { key: "contact", label: "Liên hệ & Email dự phòng", optional: true },
            { key: "pwa", label: "Sẵn sàng điểm danh PWA", optional: false }
          ]
        : [
            { key: "identity", label: "Xác nhận định danh & Khoa", optional: false },
            { key: "contact", label: "Liên hệ & Email dự phòng", optional: true },
            { key: "pwa", label: "Sẵn sàng điểm danh PWA", optional: false }
          ],
    [isGoogleSignIn]
  );

  const savedRedirect =
    typeof window !== "undefined" ? window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY) : null;
  const redirectTarget =
    routeState.redirectTarget || (savedRedirect && savedRedirect !== "/login" && savedRedirect !== "/onboarding" ? savedRedirect : null);
  const urgentFieldFlow = isUrgentRedirect(redirectTarget);

  const existingState = useMemo(() => loadOnboardingState(userId), [userId]);
  const resolution = useMemo(
    () =>
      resolveMajorCandidatesByMssv(userId) ||
      resolveMajorCandidatesByMssv(email) || {
        mssv: null,
        majorCode: null,
        candidates: []
      },
    [userId, email]
  );

  const { mssv, majorCode: detectedMajorCode, candidates } = resolution;
  const hasMultipleCandidates = candidates.length > 1;
  const hasSingleCandidate = candidates.length === 1;

  // Step state (0-based index into wizardSteps)
  const [stepIndex, setStepIndex] = useState(0);
  const activeStepKey = wizardSteps[stepIndex]?.key ?? "identity";

  // Google Workspace optional password setup state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordConfigured, setPasswordConfigured] = useState(
    Boolean(existingState?.hasPassword) || !isGoogleSignIn
  );
  const [passwordError, setPasswordError] = useState(null);
  const pwStrength = evaluatePasswordStrength(newPassword);

  // Step 1: Academic Identity (Khoa – Ngành) + Consent
  const initialEntry = useMemo(() => {
    if (existingState?.academicIdentity && !existingState.academicIdentity.isGuestOrAlumni) {
      return findCatalogEntry(
        existingState.academicIdentity.facultyName,
        existingState.academicIdentity.majorCode
      );
    }
    if (hasSingleCandidate) return candidates[0];
    return null;
  }, [existingState, hasSingleCandidate, candidates]);

  const [selectedEntryId, setSelectedEntryId] = useState(initialEntry?.id ?? "");
  const [manualMode, setManualMode] = useState(
    Boolean(
      candidates.length === 0 ||
        (initialEntry && !candidates.some((c) => c.id === initialEntry.id))
    )
  );
  const [isGuestOrAlumni, setIsGuestOrAlumni] = useState(
    Boolean(existingState?.academicIdentity?.isGuestOrAlumni)
  );
  const [manualFaculty, setManualFaculty] = useState(
    initialEntry?.facultyName ?? candidates[0]?.facultyName ?? FIT_FACULTY_NAME
  );
  const [manualMajorCode, setManualMajorCode] = useState(
    initialEntry?.majorCode ?? candidates[0]?.majorCode ?? "110"
  );

  const consentAlreadyAccepted = Boolean(
    routeState.consentAlreadyAccepted || existingState?.consents?.pdplBasic
  );
  const [pdplBasic, setPdplBasic] = useState(consentAlreadyAccepted);
  const [photoCheckinConsent, setPhotoCheckinConsent] = useState(
    existingState?.consents?.photoCheckin ?? true
  );
  const [yitbotConsent, setYitbotConsent] = useState(
    existingState?.consents?.yitbotDeidentified ?? true
  );
  const [showOptionalConsents, setShowOptionalConsents] = useState(!consentAlreadyAccepted);
  const [step1Error, setStep1Error] = useState(null);

  // Step 2: Contact & Alumni Lifecycle
  const [className, setClassName] = useState(existingState?.unionProfile?.className ?? "");
  const [unionBranch, setUnionBranch] = useState(existingState?.unionProfile?.unionBranch ?? "");
  const [unionBranchTouched, setUnionBranchTouched] = useState(
    Boolean(existingState?.unionProfile?.unionBranch)
  );
  const [phone, setPhone] = useState(existingState?.unionProfile?.phone ?? "");
  const [backupEmail, setBackupEmail] = useState(existingState?.backupEmail ?? "");
  const [step2Error, setStep2Error] = useState(null);

  // Step 3: PWA Readiness & Interests
  const [deviceReady, setDeviceReady] = useState("checking"); // "checking" | "ready" | "fallback"
  const [pushEnabled, setPushEnabled] = useState(Boolean(existingState?.pushEnabled));
  const [pushFeedback, setPushFeedback] = useState(null);
  const [interests, setInterests] = useState(
    existingState?.interests?.length ? existingState.interests : ["faculty-events"]
  );

  useEffect(() => {
    let active = true;
    void getOrCreateDeviceKeyPair()
      .then(() => {
        if (active) setDeviceReady("ready");
      })
      .catch(() => {
        if (active) setDeviceReady("fallback");
      });
    return () => {
      active = false;
    };
  }, []);

  const majorsInManualFaculty = useMemo(
    () => getMajorsByFaculty(manualFaculty),
    [manualFaculty]
  );

  const resolvedSelectedEntry = useMemo(() => {
    if (isGuestOrAlumni) return null;
    if (!manualMode) {
      return candidates.find((c) => c.id === selectedEntryId) ?? null;
    }
    return findCatalogEntry(manualFaculty, manualMajorCode);
  }, [isGuestOrAlumni, manualMode, candidates, selectedEntryId, manualFaculty, manualMajorCode]);

  const differsFromMssvMajor = Boolean(
    !isGuestOrAlumni &&
      detectedMajorCode &&
      resolvedSelectedEntry &&
      resolvedSelectedEntry.majorCode !== detectedMajorCode
  );

  const handleManualFacultyChange = (nextFaculty) => {
    setManualFaculty(nextFaculty);
    const list = getMajorsByFaculty(nextFaculty);
    const sameCode = list.find((m) => m.majorCode === manualMajorCode);
    setManualMajorCode(sameCode ? sameCode.majorCode : (list[0]?.majorCode ?? ""));
    setStep1Error(null);
  };

  const handleClassChange = (value) => {
    setClassName(value);
    if (!unionBranchTouched) {
      setUnionBranch(value.trim() ? `Chi đoàn ${value.trim().toUpperCase()}` : "");
    }
    setStep2Error(null);
  };

  const handleStep1Next = () => {
    setStep1Error(null);
    if (!isGuestOrAlumni && !resolvedSelectedEntry) {
      setStep1Error(
        hasMultipleCandidates
          ? `Vui lòng chọn đúng Khoa quản lý cho mã ngành ${detectedMajorCode} trước khi tiếp tục.`
          : "Vui lòng chọn Khoa quản lý và Ngành học của bạn."
      );
      return;
    }
    if (!pdplBasic) {
      setStep1Error(
        "Bạn cần xác nhận đồng ý Chính sách Bảo vệ Dữ liệu Cá nhân (Luật 91/2025/QH15) để tiếp tục."
      );
      return;
    }
    setStepIndex((idx) => Math.min(idx + 1, wizardSteps.length - 1));
  };

  const handlePasswordStepNext = (skipPassword = false) => {
    setPasswordError(null);
    if (skipPassword) {
      setPasswordConfigured(Boolean(existingState?.hasPassword));
      setStepIndex((idx) => Math.min(idx + 1, wizardSteps.length - 1));
      return;
    }
    if (!newPassword) {
      setPasswordError("Vui lòng nhập mật khẩu mới hoặc chọn \"Bỏ qua bước này\" nếu muốn thiết lập sau.");
      return;
    }
    if (pwStrength.score < 75) {
      setPasswordError("Mật khẩu chưa đủ mạnh (cần tối thiểu 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt).");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.");
      return;
    }
    setPasswordConfigured(true);
    setStepIndex((idx) => Math.min(idx + 1, wizardSteps.length - 1));
  };

  const handleStep2Next = (skipValidation = false) => {
    setStep2Error(null);
    if (!skipValidation) {
      const trimmedPhone = phone.trim();
      if (trimmedPhone && !/^0[0-9]{9}$/.test(trimmedPhone)) {
        setStep2Error("Số điện thoại liên hệ phải gồm đúng 10 chữ số bắt đầu bằng số 0.");
        return;
      }
      const trimmedBackup = backupEmail.trim();
      if (trimmedBackup) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedBackup)) {
          setStep2Error("Email cá nhân dự phòng chưa đúng định dạng (VD: tenban@gmail.com).");
          return;
        }
        if (email && trimmedBackup.toLowerCase() === email.toLowerCase()) {
          setStep2Error("Email dự phòng phải khác Email trường để vẫn đăng nhập được sau tốt nghiệp.");
          return;
        }
      }
    }
    setStepIndex((idx) => Math.min(idx + 1, wizardSteps.length - 1));
  };

  const handleTogglePush = async () => {
    setPushFeedback(null);
    if (pushEnabled) {
      setPushEnabled(false);
      return;
    }
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        if (window.Notification.permission === "denied") {
          setPushFeedback(
            "Trình duyệt đang chặn thông báo. Bạn có thể bật lại trong Cài đặt trình duyệt hoặc mục Ứng dụng & Thông báo."
          );
          return;
        }
        if (window.Notification.permission === "default") {
          const perm = await window.Notification.requestPermission();
          if (perm !== "granted") {
            setPushFeedback("Bạn chưa cấp quyền thông báo trên trình duyệt này. Có thể bật lại sau bất cứ lúc nào.");
            return;
          }
        }
      } catch {
        // Fallback smoothly in restricted environments
      }
    }
    setPushEnabled(true);
  };

  const handleToggleInterest = (id) => {
    setInterests((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const consumeRedirectAndExit = () => {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
    const fallbackPath = roleScopes.length > 0 ? "/admin" : "/";
    void navigate(redirectTarget ?? fallbackPath, { replace: true });
  };

  const persistOnboarding = ({ skipped = false }) => {
    const academicIdentity = isGuestOrAlumni
      ? {
          facultyName: null,
          majorCode: null,
          majorName: null,
          fitFaculty: false,
          confirmedFromRoster: false,
          isGuestOrAlumni: true
        }
      : resolvedSelectedEntry
        ? {
            facultyName: resolvedSelectedEntry.facultyName,
            majorCode: resolvedSelectedEntry.majorCode,
            majorName: resolvedSelectedEntry.majorName,
            fitFaculty: resolvedSelectedEntry.fitFaculty,
            confirmedFromRoster: !differsFromMssvMajor,
            isGuestOrAlumni: false
          }
        : null;

    saveOnboardingState(userId, {
      completed: !skipped,
      skippedAt: skipped ? new Date().toISOString() : null,
      completedAt: skipped ? null : new Date().toISOString(),
      academicIdentity,
      unionProfile: {
        className: className.trim(),
        unionBranch: unionBranch.trim(),
        phone: phone.trim()
      },
      backupEmail: backupEmail.trim(),
      hasPassword: isGoogleSignIn ? passwordConfigured : true,
      pushEnabled,
      interests,
      consents: {
        pdplBasic,
        photoCheckin: photoCheckinConsent,
        yitbotDeidentified: yitbotConsent
      }
    });

    if (!skipped && pdplBasic) {
      void recordPrivacyConsent("PDPL_BASIC", true).catch(() => {});
    }
  };

  const handleSkipAll = () => {
    persistOnboarding({ skipped: true });
    consumeRedirectAndExit();
  };

  const handleFinish = () => {
    persistOnboarding({ skipped: false });
    consumeRedirectAndExit();
  };

  const classPlaceholder = buildClassPlaceholder(
    mssv,
    resolvedSelectedEntry?.facultyName,
    resolvedSelectedEntry?.majorCode
  );

  return (
    <div className="w-full py-1 sm:py-2">
      {/* Unified Full-Width Liquid Glass Container (matches LoginPage layout) */}
      <section className="liquid-glass-card grid w-full gap-3 rounded-[24px] p-2.5 sm:gap-4 sm:rounded-[26px] sm:p-4 lg:grid-cols-12">
        {/* Left Tinted Panel: Brand + Vertical Timeline Stepper (AWS-style) */}
        <aside className="relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-white/80 bg-gradient-to-br from-primary/14 via-brand-cyan/10 to-white/75 p-4 transition-colors duration-200 sm:rounded-[20px] sm:p-6 lg:col-span-4 lg:p-8 dark:border-white/15 dark:from-[#0b1636]/95 dark:via-[#162d6e]/90 dark:to-[#2746cf]/80">
          <div className="relative z-10 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <BrandLockup logoClassName="h-7 w-7 sm:h-8 sm:w-8" wordmarkClassName="h-[18px] sm:h-[22px]" />
              <Button
                type="button"
                variant={urgentFieldFlow ? "default" : "ghost"}
                size="sm"
                className="rounded-full lg:hidden"
                onClick={handleSkipAll}
              >
                {urgentFieldFlow ? "Bỏ qua & Điểm danh" : "Để sau"}
              </Button>
            </div>

            <div className="space-y-1">
              <h2 className="font-display text-lg font-medium leading-snug tracking-tight text-foreground sm:text-xl dark:text-white">
                Thiết lập tài khoản mới
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground dark:text-blue-100/80">
                Hoàn tất nhanh trong dưới 1 phút để đồng bộ quyền lợi và sẵn sàng điểm danh sự kiện.
              </p>
            </div>

            {/* Mobile Compact Progress Strip (< lg) */}
            <div className="space-y-2 lg:hidden">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary dark:text-white">
                  Bước {stepIndex + 1}/{wizardSteps.length}: {wizardSteps[stepIndex]?.label}
                </span>
                {wizardSteps[stepIndex]?.optional && (
                  <span className="italic text-muted-foreground dark:text-blue-200/80">Tùy chọn</span>
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/80 dark:bg-white/15">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-200 dark:bg-white"
                  style={{ width: `${((stepIndex + 1) / wizardSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Desktop Vertical Timeline Stepper (>= lg) */}
            <nav aria-label="Tiến trình thiết lập tài khoản" className="hidden pt-2 lg:block">
              <ol className="space-y-0">
                {wizardSteps.map((item, idx) => {
                  const isCurrent = stepIndex === idx;
                  const isDone = stepIndex > idx;
                  const isLast = idx === wizardSteps.length - 1;

                  return (
                    <li key={item.key} className="relative flex gap-3.5 pb-6 last:pb-0">
                      {/* Vertical Connecting Line */}
                      {!isLast && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute left-[9px] top-5 bottom-0 w-[2px] transition-colors duration-200",
                            isDone
                              ? "bg-foreground/45 dark:bg-white/45"
                              : "bg-border/90 dark:bg-white/20"
                          )}
                        />
                      )}

                      {/* Node Circle */}
                      <div className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                        {isCurrent ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-card shadow-sm dark:border-white dark:bg-[#0e1b40]">
                            <span className="h-2.5 w-2.5 rounded-full bg-primary dark:bg-white" />
                          </span>
                        ) : isDone ? (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-foreground/80 text-background dark:bg-white dark:text-[#0b1636]">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="h-3.5 w-3.5 rounded-full bg-foreground/35 dark:bg-white/35" />
                        )}
                      </div>

                      {/* Two-Line Step Label */}
                      <button
                        type="button"
                        disabled={!isDone}
                        onClick={() => {
                          if (isDone) setStepIndex(idx);
                        }}
                        className={cn(
                          "min-w-0 flex-1 text-left transition-colors",
                          isDone ? "cursor-pointer hover:opacity-80" : "cursor-default"
                        )}
                      >
                        <div className="text-xs leading-tight text-muted-foreground dark:text-blue-200/75">
                          <span>Bước {idx + 1}</span>
                          {item.optional && <span className="italic"> - tùy chọn</span>}
                        </div>
                        <div
                          className={cn(
                            "mt-0.5 text-sm leading-snug",
                            isCurrent
                              ? "font-semibold text-primary dark:text-white"
                              : isDone
                                ? "font-medium text-foreground dark:text-blue-50"
                                : "font-normal text-foreground/75 dark:text-blue-100/75"
                          )}
                        >
                          {item.label}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>

          <div className="relative z-10 mt-8 hidden items-center justify-between gap-2 border-t border-border/60 pt-4 lg:flex dark:border-white/15">
            <span className="text-xs font-medium text-muted-foreground dark:text-blue-200/75">
              Đoàn TN – Hội SV Khoa CNTT
            </span>
            <Button
              type="button"
              variant={urgentFieldFlow ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-full px-3 text-xs dark:text-blue-100 dark:hover:bg-white/10"
              onClick={handleSkipAll}
            >
              {urgentFieldFlow ? "Bỏ qua & Điểm danh" : "Để sau"}
            </Button>
          </div>
        </aside>

        {/* Right Form Column inside the same Unified Liquid Glass Container */}
        <main className="flex flex-col justify-start p-2 sm:p-5 lg:col-span-8 lg:min-h-[540px] lg:px-8 lg:py-6">
        {/* ================= STEP 1: IDENTITY & FACULTY-MAJOR ================= */}
        {activeStepKey === "identity" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                Xác nhận định danh &amp; Khoa quản lý
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Chào <strong className="font-semibold text-foreground">{fullName}</strong>. Chọn đúng Khoa quản lý giúp hệ thống ghi nhận chính xác quyền lợi ĐRL, CTXH và Chuyên đề doanh nghiệp (CĐDN).
              </p>
            </div>

            {/* Compact Read-Only Identity Strip */}
            <dl className="grid gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Họ và tên</dt>
                <dd className="mt-0.5 font-medium text-foreground">{fullName}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">MSSV / Định danh</dt>
                <dd className="mt-0.5 tabular-mono font-semibold text-foreground">{mssv || userId || "—"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs font-medium text-muted-foreground">Email tài khoản</dt>
                <dd className="mt-0.5 truncate text-foreground" title={email || undefined}>
                  {email || "—"}
                </dd>
              </div>
            </dl>

            {/* Academic Faculty–Major Disambiguation */}
            <section className="space-y-3" aria-labelledby="faculty-major-heading">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="faculty-major-heading" className="font-display text-lg font-medium text-foreground">
                  Khoa quản lý &amp; Ngành học
                </h2>
                {detectedMajorCode && !isGuestOrAlumni && (
                  <span className="tabular-mono rounded-sm border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                    Mã ngành từ MSSV: {detectedMajorCode}
                  </span>
                )}
              </div>

              {/* CASE A: 2 matching faculties (13 overlapping major codes in khoa_nganh.csv) */}
              {!manualMode && !isGuestOrAlumni && hasMultipleCandidates && (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Mã ngành <strong className="tabular-mono text-foreground">{detectedMajorCode}</strong> ({candidates[0].majorName}) hiện có ở <strong>2 Khoa quản lý khác nhau</strong>. Vui lòng chọn đúng Khoa ghi trên thẻ sinh viên hoặc Cổng thông tin Đào tạo của bạn.
                  </p>

                  <div
                    role="radiogroup"
                    aria-label="Chọn Khoa quản lý"
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    {candidates.map((item) => {
                      const isSelected = selectedEntryId === item.id;
                      const isAdvanced = item.facultyName === ADVANCED_PROGRAM_FACULTY_NAME;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            setSelectedEntryId(item.id);
                            setStep1Error(null);
                          }}
                          className={cn(
                            "flex flex-col justify-between gap-3 rounded-xl border p-4 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                            isSelected
                              ? "border-primary bg-primary/[0.05] shadow-sm"
                              : "border-border bg-card hover:border-primary/45 hover:bg-muted/30"
                          )}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                                <span>{formatFacultyDisplayName(item.facultyName)}</span>
                              </span>
                              <span
                                className={cn(
                                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card"
                                )}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Ngành {item.majorName} · <span className="tabular-mono">{item.majorCode}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {isAdvanced
                                ? "Hệ Đào tạo tiên tiến / Chất lượng cao."
                                : item.fitFaculty
                                  ? "Hệ đại trà trực thuộc Khoa Công nghệ Thông tin."
                                  : `Hệ đại trà trực thuộc ${formatFacultyDisplayName(item.facultyName)}.`}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CASE B: Unique 1-to-1 major code */}
              {!manualMode && !isGuestOrAlumni && hasSingleCandidate && (
                <div className="rounded-xl border border-status-success/35 bg-status-success/[0.06] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <GraduationCap className="h-4 w-4 text-status-success" />
                        <span>{formatFacultyDisplayName(candidates[0].facultyName)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ngành <strong className="text-foreground">{candidates[0].majorName}</strong> · Mã ngành{" "}
                        <span className="tabular-mono font-semibold text-foreground">{candidates[0].majorCode}</span>
                      </p>
                    </div>
                    <Badge variant="success">Tự động khớp từ MSSV</Badge>
                  </div>
                </div>
              )}

              {/* CASE C: Manual 2-level selection or Guest/Alumni */}
              {(manualMode || isGuestOrAlumni) && (
                <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                  {!isGuestOrAlumni && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="onb-faculty">Khoa / Viện quản lý</Label>
                        <Select value={manualFaculty} onValueChange={handleManualFacultyChange}>
                          <SelectTrigger id="onb-faculty" className="h-11 rounded-xl sm:h-10">
                            <SelectValue placeholder="Chọn Khoa quản lý" />
                          </SelectTrigger>
                          <SelectContent>
                            {FACULTY_LIST.map((fac) => (
                              <SelectItem key={fac} value={fac}>
                                {formatFacultyDisplayName(fac)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="onb-major">Ngành học</Label>
                        <Select
                          value={manualMajorCode}
                          onValueChange={(code) => {
                            setManualMajorCode(code);
                            setStep1Error(null);
                          }}
                        >
                          <SelectTrigger id="onb-major" className="h-11 rounded-xl sm:h-10">
                            <SelectValue placeholder="Chọn Ngành học" />
                          </SelectTrigger>
                          <SelectContent>
                            {majorsInManualFaculty.map((m) => (
                              <SelectItem key={m.id} value={m.majorCode}>
                                <span className="tabular-mono mr-1.5 font-semibold">{m.majorCode}</span>
                                {m.majorName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {differsFromMssvMajor && (
                    <div className="flex items-start gap-2 rounded-lg border border-status-warning/35 bg-status-warning/10 p-3 text-xs text-status-warning">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Mã ngành bạn chọn (<span className="tabular-mono font-semibold">{resolvedSelectedEntry.majorCode}</span>) khác mã ngành tách từ MSSV (<span className="tabular-mono font-semibold">{detectedMajorCode}</span>). Tài khoản vẫn hoạt động bình thường và sẽ được gắn trạng thái <strong>Chờ đối chiếu Roster</strong>.
                      </span>
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={isGuestOrAlumni}
                      onChange={(e) => {
                        setIsGuestOrAlumni(e.target.checked);
                        setStep1Error(null);
                      }}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    <span>Tôi là Cựu sinh viên hoặc Khách mời ngoài trường (không thuộc diện xét ĐRL/CĐDN)</span>
                  </label>
                </div>
              )}

              {/* Subtle Toggle between Auto-Match & Manual Override */}
              {candidates.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGuestOrAlumni(false);
                      setManualMode((v) => !v);
                      setStep1Error(null);
                    }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {manualMode
                      ? "Quay lại gợi ý tự động theo MSSV"
                      : "Tôi đã chuyển ngành / không thấy đúng Khoa quản lý?"}
                  </button>
                  <span className="text-muted-foreground">
                    Sau khi chốt, việc đổi Khoa – Ngành sẽ gửi qua BCH để đảm bảo minh bạch.
                  </span>
                </div>
              )}
            </section>

            {/* PDPL Consent Section (Luật 91/2025/QH15) */}
            <section className="space-y-3 border-t border-border pt-5" aria-label="Đồng ý xử lý dữ liệu cá nhân">
              {consentAlreadyAccepted ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-status-success/30 bg-status-success/[0.06] px-4 py-3 text-xs">
                  <div className="flex items-center gap-2 font-medium text-status-success">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Đã xác nhận Chính sách Bảo vệ Dữ liệu Cá nhân (Luật 91/2025/QH15)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOptionalConsents((v) => !v)}
                    className="font-semibold text-primary hover:underline"
                  >
                    {showOptionalConsents ? "Ẩn tùy chọn" : "Tùy chọn nâng cao"}
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3.5 text-xs leading-relaxed text-foreground">
                  <input
                    type="checkbox"
                    checked={pdplBasic}
                    onChange={(e) => {
                      setPdplBasic(e.target.checked);
                      setStep1Error(null);
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded accent-primary"
                  />
                  <span>
                    Tôi đồng ý với{" "}
                    <Link to="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-primary underline">
                      Chính sách Bảo vệ Dữ liệu Cá nhân
                    </Link>{" "}
                    theo Luật 91/2025/QH15 để phục vụ định danh MSSV, điểm danh sự kiện và cấp E-Certificate.
                  </span>
                </label>
              )}

              {showOptionalConsents && (
                <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs text-muted-foreground">
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={photoCheckinConsent}
                      onChange={(e) => setPhotoCheckinConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded accent-primary"
                    />
                    <span>
                      <strong className="font-medium text-foreground">Đối chiếu ảnh thẻ tại quầy soát vé</strong> — Chỉ hiển thị cho Lễ tân được phân quyền khi kiểm tra thẻ sinh viên vật lý.
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={yitbotConsent}
                      onChange={(e) => setYitbotConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded accent-primary"
                    />
                    <span>
                      <strong className="font-medium text-foreground">Hỏi đáp Trợ lý ảo YITBot (Khử định danh)</strong> — Mọi dữ liệu cá nhân đều được ẩn trước khi gửi bộ xử lý AI.
                    </span>
                  </label>
                </div>
              )}
            </section>

            {step1Error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-status-danger/35 bg-status-danger/10 p-3 text-xs font-medium text-status-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{step1Error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" className="h-12 w-full rounded-xl sm:h-11 sm:w-auto sm:px-6" onClick={handleStep1Next}>
                <span>Xác nhận &amp; Tiếp tục</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ================= OPTIONAL GOOGLE STEP: SET LOCAL PASSWORD ================= */}
        {activeStepKey === "password" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                Đặt mật khẩu đăng nhập độc lập
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Bạn đang đăng nhập qua Google Workspace. Đặt thêm mật khẩu giúp bạn đăng nhập linh hoạt bằng <strong>Email + Mật khẩu</strong> bất cứ lúc nào.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-status-info/30 bg-status-info/[0.07] p-4 text-xs leading-relaxed text-foreground">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-status-info" />
              <div className="space-y-1">
                <div className="font-semibold">Đăng nhập song song bằng Email + Mật khẩu</div>
                <p className="text-muted-foreground">
                  Sau khi thiết lập, bạn có thể dùng <strong className="text-foreground">{email}</strong> (hoặc Email cá nhân dự phòng sau khi tốt nghiệp) kèm mật khẩu này để đăng nhập trực tiếp mà không phụ thuộc vào Google Workspace.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="onb-password">Mật khẩu mới</Label>
                <div className="relative">
                  <Input
                    id="onb-password"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Tối thiểu 8 ký tự gồm chữ hoa, số và ký tự đặc biệt"
                    className="h-11 rounded-xl pr-11 sm:h-10"
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all ${pwStrength.colorClass}`}
                        style={{ width: `${pwStrength.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{pwStrength.label}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onb-password-confirm">Nhập lại mật khẩu</Label>
                <Input
                  id="onb-password-confirm"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="Nhập lại mật khẩu vừa tạo"
                  className="h-11 rounded-xl sm:h-10"
                />
              </div>
            </div>

            {passwordError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-status-danger/35 bg-status-danger/10 p-3 text-xs font-medium text-status-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => setStepIndex((idx) => Math.max(idx - 1, 0))}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại</span>
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl"
                  onClick={() => handlePasswordStepNext(true)}
                >
                  Bỏ qua bước này
                </Button>
                <Button
                  type="button"
                  className="h-11 rounded-xl px-6"
                  onClick={() => handlePasswordStepNext(false)}
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Lưu mật khẩu &amp; Tiếp tục</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP: CONTACT & ALUMNI LIFECYCLE ================= */}
        {activeStepKey === "contact" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                Liên hệ nhanh &amp; Bảo vệ tài khoản sau tốt nghiệp
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Bước này không bắt buộc — bạn có thể điền nhanh bây giờ hoặc bổ sung sau trong trang Hồ sơ cá nhân.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="onb-class">Lớp sinh viên</Label>
                <Input
                  id="onb-class"
                  value={className}
                  onChange={(e) => handleClassChange(e.target.value)}
                  placeholder={classPlaceholder}
                  className="h-11 rounded-xl sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onb-branch">Chi đoàn / Chi hội</Label>
                <Input
                  id="onb-branch"
                  value={unionBranch}
                  onChange={(e) => {
                    setUnionBranchTouched(true);
                    setUnionBranch(e.target.value);
                  }}
                  placeholder="Tự gợi ý theo Lớp sinh viên"
                  className="h-11 rounded-xl sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onb-phone">Số điện thoại liên hệ</Label>
                <Input
                  id="onb-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setStep2Error(null);
                  }}
                  placeholder="09xxxxxxxx"
                  className="tabular-mono h-11 rounded-xl sm:h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Dùng khi BTC liên hệ nhận vật phẩm gây quỹ hoặc hỗ trợ sự kiện.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onb-backup-email">Email cá nhân dự phòng</Label>
                <Input
                  id="onb-backup-email"
                  type="email"
                  value={backupEmail}
                  onChange={(e) => {
                    setBackupEmail(e.target.value);
                    setStep2Error(null);
                  }}
                  placeholder="tenban@gmail.com"
                  className="h-11 rounded-xl sm:h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Giữ quyền truy cập E-Certificate &amp; E-Portfolio khi email trường bị thu hồi. Bạn có thể xác thực OTP sau trong Hồ sơ.
                </p>
              </div>
            </div>

            {/* Role Context Callout for Cadres / CTVs */}
            {roleScopes.length > 0 && (
              <div className="rounded-xl border border-primary/30 bg-primary/[0.05] p-4 text-xs leading-relaxed text-foreground">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>Tài khoản của bạn đã được phân công {roleScopes.length} vai trò Đoàn – Hội</span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Sử dụng <strong>Bộ chuyển ngữ cảnh (Context Switcher)</strong> trên thanh điều hướng để chuyển nhanh giữa <em>Cổng Sinh viên</em> và <em>Không gian Quản trị</em> theo đúng đơn vị mà không cần đăng xuất.
                </p>
              </div>
            )}

            {step2Error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-status-danger/35 bg-status-danger/10 p-3 text-xs font-medium text-status-danger"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{step2Error}</span>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => setStepIndex((idx) => Math.max(idx - 1, 0))}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại</span>
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 rounded-xl"
                  onClick={() => handleStep2Next(true)}
                >
                  Bỏ qua bước này
                </Button>
                <Button
                  type="button"
                  className="h-11 rounded-xl px-6"
                  onClick={() => handleStep2Next(false)}
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= FINAL STEP: PWA READINESS & INTERESTS ================= */}
        {activeStepKey === "pwa" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                Sẵn sàng điểm danh &amp; nhận thông báo
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Hoàn tất thiết lập thiết bị PWA để quét mã QR hội trường mượt mà và theo dõi đúng hoạt động bạn quan tâm.
              </p>
            </div>

            {/* Device Readiness & Web Push Rows */}
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-status-success/12 text-status-success">
                    <Smartphone className="h-4 w-4" />
                  </span>
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-foreground">
                      Khóa thiết bị điểm danh chống gian lận
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {deviceReady === "ready"
                        ? "Đã khởi tạo khóa bảo mật ECDSA P-256 trên trình duyệt này. Sẵn sàng quét QR động 10s."
                        : deviceReady === "checking"
                          ? "Đang khởi tạo khóa bảo mật cho thiết bị..."
                          : "Trình duyệt hiện chưa hỗ trợ WebCrypto — bạn vẫn có thể điểm danh bằng thẻ sinh viên tại quầy."}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={deviceReady === "ready" ? "success" : "secondary"}
                  className="shrink-0 self-start sm:self-center"
                >
                  {deviceReady === "ready" ? "Sẵn sàng" : deviceReady === "checking" ? "Đang thiết lập" : "Dự phòng"}
                </Badge>
              </div>

              <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BellRing className="h-4 w-4" />
                  </span>
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-foreground">
                      Thông báo đẩy Web Push (PWA)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nhận nhắc giờ sự kiện, thông báo đôn danh sách chờ Waitlist và phản hồi từ BCH.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={pushEnabled}
                  onCheckedChange={() => void handleTogglePush()}
                  aria-label="Bật hoặc tắt Thông báo đẩy Web Push"
                  className="self-start sm:self-center"
                />
              </div>
            </div>

            {pushFeedback && (
              <p className="text-xs text-muted-foreground">{pushFeedback}</p>
            )}

            {/* Interest Chips */}
            <section className="space-y-2.5" aria-labelledby="interests-heading">
              <div className="flex items-center justify-between gap-2">
                <h2 id="interests-heading" className="text-sm font-semibold text-foreground">
                  Hoạt động bạn quan tâm nhất (chọn tối đa 3)
                </h2>
                <span className="tabular-mono text-xs text-muted-foreground">{interests.length}/3</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((opt) => {
                  const active = interests.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handleToggleInterest(opt.id)}
                      className={cn(
                        "inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/45 hover:bg-muted/40"
                      )}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Concise Final Recap */}
            <div className="rounded-xl border border-border bg-muted/35 p-4 text-xs">
              <div className="font-semibold text-foreground">Tóm tắt hồ sơ vừa thiết lập</div>
              <ul className="mt-2 space-y-1.5 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>
                    {isGuestOrAlumni
                      ? "Cựu sinh viên / Khách mời ngoài trường"
                      : resolvedSelectedEntry
                        ? `${formatFacultyDisplayName(resolvedSelectedEntry.facultyName)} · ${resolvedSelectedEntry.majorName} (${resolvedSelectedEntry.majorCode})`
                        : "Chưa chọn Khoa – Ngành"}
                  </span>
                </li>
                {isGoogleSignIn && (
                  <li className="flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>
                      {passwordConfigured
                        ? "Đã đặt mật khẩu độc lập · Có thể đăng nhập song song bằng Email + Mật khẩu"
                        : "Chưa đặt mật khẩu độc lập (có thể thiết lập sau trong mục Bảo mật & Mật khẩu)"}
                    </span>
                  </li>
                )}
                {backupEmail.trim() && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>Email dự phòng: {backupEmail.trim()} (xác thực OTP bất cứ lúc nào trong Hồ sơ)</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => setStepIndex((idx) => Math.max(idx - 1, 0))}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại</span>
              </Button>
              <Button
                type="button"
                className="h-12 rounded-xl px-6 sm:h-11"
                onClick={handleFinish}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {urgentFieldFlow
                    ? "Hoàn tất & Tiếp tục điểm danh"
                    : redirectTarget
                      ? "Hoàn tất & Về trang trước đó"
                      : "Hoàn tất & Vào YITZone"}
                </span>
              </Button>
            </div>
          </div>
        )}
        </main>
      </section>
    </div>
  );
}
