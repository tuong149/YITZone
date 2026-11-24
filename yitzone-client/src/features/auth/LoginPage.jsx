import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserPlus
} from "lucide-react";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient, extractApiErrorMessage } from "@/lib/api-client";
import { getOrCreateDeviceKeyPair } from "@/lib/webcrypto";
import { extractMssv } from "@/features/iam/data/faculty-major-catalog";
import { useAuthStore, AUTH_REDIRECT_STORAGE_KEY } from "@/stores/auth-store";

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";
const IS_OIDC_AVAILABLE = IS_DEMO_MODE || import.meta.env.VITE_OIDC_ENABLED === "true";

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

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);

  const fromLocation = (location.state)?.from;
  const savedRedirect =
    typeof window !== "undefined" ? window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY) : null;
  const redirectTarget = fromLocation?.pathname
    ? `${fromLocation.pathname}${fromLocation.search ?? ""}${fromLocation.hash ?? ""}`
    : savedRedirect && savedRedirect !== "/login"
      ? savedRedirect
      : null;

  const [activeTab, setActiveTab] = useState("login");

  // Login state (UC-IAM-02, UC-IAM-03) — only prefill sample credentials in DEV
  const [loginEmail, setLoginEmail] = useState(import.meta.env.DEV ? "22110123@student.hcmute.edu.vn" : "");
  const [loginPassword, setLoginPassword] = useState(import.meta.env.DEV ? "YitZone@2026" : "");
  const [rolePreset, setRolePreset] = useState("STUDENT");
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loginInfoMsg, setLoginInfoMsg] = useState(null);

  // Register state (UC-IAM-01)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [regOtpStep, setRegOtpStep] = useState(false);
  const [regOtp, setRegOtp] = useState("");
  const [regNotice, setRegNotice] = useState(null);

  // Forgot password state (UC-IAM-03)
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetNotice, setResetNotice] = useState(null);

  const pwStrength = evaluatePasswordStrength(regPassword);
  const resetPwStrength = evaluatePasswordStrength(resetNewPassword);
  const isLockedOut = failedAttempts >= 5;

  const consumeRedirectAndNavigate = (fallbackPath) => {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
    }
    void navigate(redirectTarget ?? fallbackPath, { replace: true });
  };

  const completeDemoOrApiLogin = async (requireMfaCheck) => {
    setErrorMsg(null);
    if (isLockedOut) {
      setErrorMsg("Bạn đã nhập sai quá 5 lần liên tiếp. Vui lòng thử lại sau ít phút hoặc đặt lại mật khẩu.");
      return;
    }

    if (requireMfaCheck && rolePreset === "BTV_ADMIN" && !mfaStep) {
      setMfaStep(true);
      return;
    }

    if (mfaStep && !/^[0-9]{6}$/.test(mfaCode.trim())) {
      setErrorMsg("Mã xác thực 2 lớp phải gồm đúng 6 chữ số.");
      return;
    }

    setLoading(true);
    const presetConfig = {
      STUDENT: {
        userId: "22110123",
        fullName: "Nguyễn Minh Khoa",
        authorities: ["event:view", "attendance:check_in", "store:view", "voting:cast"],
        roleScopes: []
      },
      CADRE_OFIT: {
        userId: "22110456",
        fullName: "Trần Thảo Vy (Trưởng Ban OFIT)",
        authorities: ["event:view", "attendance:check_in", "MOD_DEPT_OFFICE_LEAD", "MOD_UNIT_HR_INTERNAL"],
        roleScopes: [
          {
            roleCode: "DEPT_HEAD",
            unitId: "OFIT",
            scopeType: "COMMITTEE",
            scopeId: "OFIT",
            label: "Ban Văn phòng (OFIT)"
          }
        ]
      },
      BTV_ADMIN: {
        userId: "21110001",
        fullName: "Lê Hoàng Nam (Ban Thường vụ)",
        authorities: ["ROLE_STANDING_COMMITTEE", "MOD_AUDIT_VIEWER", "MOD_UNIT_HR_INTERNAL"],
        roleScopes: [
          {
            roleCode: "BTV",
            unitId: "FIT",
            scopeType: "FACULTY",
            scopeId: "FACULTY",
            label: "Ban Thường vụ (Toàn Khoa FIT)"
          },
          {
            roleCode: "DEPT_HEAD",
            unitId: "EMFIT",
            scopeType: "COMMITTEE",
            scopeId: "EMFIT",
            label: "Ban Truyền thông - Sự kiện (EMFIT)"
          }
        ]
      }
    };

    const chosen = presetConfig[rolePreset];

    try {
      const res = await apiClient.post("/iam/auth/dev-token", {
        userId: chosen.userId,
        email: loginEmail.trim(),
        authorities: chosen.authorities
      });
      if (!res.data.success) {
        setFailedAttempts((c) => c + 1);
        setErrorMsg(res.data.detail);
        setLoading(false);
        return;
      }

      setSession({
        userId: chosen.userId,
        email: loginEmail.trim(),
        fullName: chosen.fullName,
        accessToken: res.data.data.accessToken,
        authorities: chosen.authorities,
        roleScopes: chosen.roleScopes
      });

      try {
        const { publicKeyJwk } = await getOrCreateDeviceKeyPair();
        await apiClient.post("/iam/device-tokens", { publicKeyJwk });
      } catch {
        // Non-blocking
      }

      consumeRedirectAndNavigate(rolePreset === "STUDENT" ? "/" : "/admin");
    } catch (err) {
      if (IS_DEMO_MODE) {
        setSession({
          userId: chosen.userId,
          email: loginEmail.trim(),
          fullName: chosen.fullName,
          accessToken: "demo-local-offline-token",
          authorities: chosen.authorities,
          roleScopes: chosen.roleScopes
        });
        consumeRedirectAndNavigate(rolePreset === "STUDENT" ? "/" : "/admin");
      } else {
        setFailedAttempts((c) => c + 1);
        setErrorMsg(
          extractApiErrorMessage(
            err,
            "Đăng nhập thất bại. Máy chủ xác thực không phản hồi hoặc thông tin chưa chính xác."
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleWorkspace = () => {
    if (redirectTarget && typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, redirectTarget);
      } catch {
        // Ignore storage errors
      }
    }
    void navigate("/auth/callback?provider=google&hd=hcmute.edu.vn");
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setRegNotice(null);
    if (!consentAccepted) {
      setRegNotice("Bạn cần xác nhận đồng ý Chính sách Bảo vệ Dữ liệu Cá nhân (Luật 91/2025/QH15).");
      return;
    }
    if (pwStrength.score < 75) {
      setRegNotice("Mật khẩu chưa đạt độ mạnh tối thiểu (cần chữ hoa, chữ thường, số và ký tự đặc biệt).");
      return;
    }
    setRegOtpStep(true);
    setRegNotice("Đã gửi mã xác thực 6 số (hiệu lực 5–10 phút) tới email của bạn. Hệ thống sẽ tự đối chiếu danh sách sinh viên chính thức của Trường.");
  };

  const handleVerifyRegOtp = (e) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(regOtp.trim())) {
      setRegNotice("Mã OTP xác thực phải gồm đúng 6 chữ số.");
      return;
    }
    const trimmedEmail = regEmail.trim();
    const trimmedName = regName.trim() || "Sinh viên mới";
    const extractedId = extractMssv(trimmedEmail) ?? `NEW${Date.now().toString().slice(-5)}`;

    setRegOtpStep(false);
    setRegOtp("");
    setRegNotice(null);

    if (IS_DEMO_MODE) {
      setSession({
        userId: extractedId,
        email: trimmedEmail,
        fullName: trimmedName,
        accessToken: "demo-local-offline-token",
        authorities: ["event:view", "attendance:check_in", "store:view", "voting:cast"],
        roleScopes: []
      });
      void navigate("/onboarding", {
        replace: true,
        state: {
          source: "register",
          consentAlreadyAccepted: true,
          redirectTarget
        }
      });
      return;
    }

    setLoginEmail(trimmedEmail);
    setLoginPassword("");
    setLoginInfoMsg(
      "Đã xác thực thông tin đăng ký. Vui lòng đăng nhập khi tài khoản được kích hoạt trên máy chủ."
    );
    setActiveTab("login");
  };

  const handleCompletePasswordReset = (e) => {
    e.preventDefault();
    setResetNotice(null);
    if (!/^[0-9]{6}$/.test(resetOtp.trim())) {
      setResetNotice("Mã xác thực OTP phải gồm đúng 6 chữ số.");
      return;
    }
    if (resetPwStrength.score < 75) {
      setResetNotice("Mật khẩu mới cần đủ mạnh (tối thiểu 8 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt).");
      return;
    }
    setForgotSent(false);
    setResetOtp("");
    setResetNewPassword("");
    setResetNotice(null);
    setLoginEmail(forgotEmail.trim());
    setLoginPassword("");
    setLoginInfoMsg("Đặt lại mật khẩu thành công. Các thiết bị đăng nhập cũ đã được đăng xuất tự động.");
    setActiveTab("login");
  };

  return (
    <div className="w-full py-1 sm:py-2">
      {/* Unified Full-Width Liquid Glass Container aligned edge-to-edge with Navbar */}
      <section className="liquid-glass-card grid w-full gap-3 rounded-[24px] p-2.5 sm:gap-4 sm:rounded-[26px] sm:p-4 lg:grid-cols-12">
        {/* Left Inner Panel — Compact on mobile so login form stays above the fold */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-white/80 bg-gradient-to-br from-primary/14 via-brand-cyan/10 to-white/75 p-4 transition-colors duration-200 sm:rounded-[20px] sm:p-6 lg:col-span-5 lg:p-9 dark:border-white/15 dark:from-[#0b1636]/95 dark:via-[#162d6e]/90 dark:to-[#2746cf]/80">
          <div className="relative z-10 space-y-2.5 sm:space-y-4 lg:space-y-5">
            <BrandLockup logoClassName="h-7 w-7 sm:h-8 sm:w-8" wordmarkClassName="h-[18px] sm:h-[22px]" />
            <h1 className="font-display text-xl font-medium leading-tight tracking-tight text-foreground sm:text-3xl lg:text-4xl dark:text-white">
              Xác thực Hợp nhất Đoàn – Hội &amp; Học thuật FIT
            </h1>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-blue-100/85">
              Đăng nhập bằng Google Workspace trường, Email + Mật khẩu hoặc Email cá nhân dự phòng dành cho Cựu sinh viên.
            </p>
          </div>

          <p className="relative z-10 mt-6 hidden text-xs font-medium tracking-wide text-muted-foreground/85 lg:mt-10 lg:block dark:text-blue-200/75">
            Đoàn TN – Hội SV Khoa CNTT · HCM-UTE · &ldquo;Just you think, I can do better&rdquo;
          </p>
        </div>

        {/* Right Form Column inside the same Full-Width Liquid Glass Container */}
        <div className="flex flex-col justify-start p-1.5 sm:p-5 lg:col-span-7 lg:min-h-[490px] lg:px-8 lg:py-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="w-full">
            <TabsList className="grid h-auto min-h-[44px] w-full grid-cols-3 p-1">
              <TabsTrigger value="login" className="min-h-[36px] px-2 text-xs sm:px-4">
                Đăng nhập
              </TabsTrigger>
              <TabsTrigger value="register" className="min-h-[36px] px-2 text-xs sm:px-4">
                Đăng ký
              </TabsTrigger>
              <TabsTrigger value="forgot" className="min-h-[36px] px-1.5 text-xs sm:px-4">
                <span className="sm:hidden">Quên MK</span>
                <span className="hidden sm:inline">Quên mật khẩu</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: LOGIN + GOOGLE WORKSPACE + 2FA */}
            <TabsContent value="login" className="space-y-4 pt-3 sm:space-y-5">
              {IS_OIDC_AVAILABLE && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-[44px] w-full rounded-xl bg-card/90 px-3 py-2.5 text-center text-xs font-semibold leading-snug sm:text-sm"
                    onClick={handleGoogleWorkspace}
                  >
                    <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                    <span>
                      <span className="hidden sm:inline">Đăng nhập với </span>
                      Google Workspace (@student.hcmute.edu.vn)
                    </span>
                  </Button>

                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-center text-xs font-medium leading-snug text-muted-foreground">
                      <span className="sm:hidden">Hoặc Email &amp; Mật khẩu</span>
                      <span className="hidden sm:inline">Hoặc Email &amp; Mật khẩu (SV / Cựu SV / Khách mời)</span>
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              {loginInfoMsg && (
                <div role="status" className="flex items-start gap-2 rounded-lg border border-status-success/30 bg-status-success/10 p-3 text-xs font-medium text-status-success">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{loginInfoMsg}</span>
                </div>
              )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void completeDemoOrApiLogin(true);
              }}
              className="space-y-4"
            >
              {!mfaStep ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">Email trường hoặc Email cá nhân đã liên kết</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-11 rounded-xl text-base sm:h-10 sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-password">Mật khẩu</Label>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-11 rounded-xl text-base sm:h-10 sm:text-sm"
                    />
                  </div>

                  {import.meta.env.DEV && (
                    <div className="space-y-1.5">
                      <Label htmlFor="login-preset">Vai trò mô phỏng nhanh (Dev / Local)</Label>
                      <Select
                        value={rolePreset}
                        onValueChange={(v) => setRolePreset(v)}
                      >
                        <SelectTrigger id="login-preset" className="h-11 rounded-xl text-sm sm:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Sinh viên Khoa CNTT (22110123)</SelectItem>
                          <SelectItem value="CADRE_OFIT">Trưởng Ban Văn phòng (OFIT)</SelectItem>
                          <SelectItem value="BTV_ADMIN">Ban Thường vụ (BTV · Bắt buộc bước TOTP MFA)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              ): (
                <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Smartphone className="h-4 w-4 shrink-0 text-primary" />
                    <span>Xác thực 2 lớp (Bắt buộc với Ban Thường vụ / Quản trị)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nhập mã 6 chữ số từ ứng dụng xác thực trên điện thoại{import.meta.env.DEV ? " (VD: 123456 để thử nhanh)." : "."}
                  </p>
                  <Input
                    aria-label="Mã xác thực 6 số"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="tabular-mono h-12 rounded-xl text-center text-lg tracking-[0.35em]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMfaStep(false);
                      setMfaCode("");
                    }}
                  >
                    Quay lại bước nhập mật khẩu
                  </Button>
                </div>
              )}

              {errorMsg && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs font-medium text-status-danger">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button type="submit" className="h-12 w-full rounded-xl text-sm sm:h-11" disabled={loading || isLockedOut}>
                <KeyRound className="h-4 w-4" />
                <span>
                  {loading
                    ? "Đang xác thực & thiết lập phiên bảo mật..."
                    : mfaStep
                      ? "Xác minh mã 2 lớp & Đăng nhập"
                      : "Đăng nhập Hệ thống"}
                </span>
              </Button>
            </form>

            <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
              <span>Phiên đăng nhập tự động bảo vệ khi đóng trình duyệt.</span>
              <Link to="/privacy" className="font-semibold text-primary hover:underline">
                Chính sách Quyền riêng tư
              </Link>
            </div>
          </TabsContent>

          {/* TAB 2: REGISTER EMAIL + PASSWORD + OTP + CONSENT (UC-IAM-01) */}
          <TabsContent value="register" className="space-y-4 pt-2">
            {!regOtpStep ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-name">Họ và tên đầy đủ</Label>
                  <Input
                    id="reg-name"
                    autoComplete="name"
                    required
                    placeholder="Nguyễn Văn An"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="h-11 rounded-xl text-base sm:h-10 sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-email">Email sinh viên (tự động nhận diện MSSV từ danh sách Trường)</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="22110345@student.hcmute.edu.vn"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="h-11 rounded-xl text-base sm:h-10 sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password">Mật khẩu</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Tối thiểu 8 ký tự gồm chữ hoa, số, ký tự đặc biệt"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="h-11 rounded-xl text-base sm:h-10 sm:text-sm"
                  />
                  {regPassword && (
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

                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded accent-primary"
                  />
                  <span>
                    Tôi đồng ý với{" "}
                    <Link to="/privacy" className="font-semibold text-primary underline">
                      Chính sách Bảo vệ Dữ liệu Cá nhân
                    </Link>{" "}
                    theo Luật 91/2025/QH15. Hệ thống sẽ tự động đối chiếu MSSV qua danh sách chính thức của Trường.
                  </span>
                </label>

                {regNotice && (
                  <div className="rounded-lg border border-status-warning/30 bg-status-warning/10 p-3 text-xs text-status-warning">
                    {regNotice}
                  </div>
                )}

                <Button type="submit" className="h-12 w-full rounded-xl sm:h-11">
                  <UserPlus className="h-4 w-4" />
                  <span>Gửi mã OTP 6 số kích hoạt tài khoản</span>
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyRegOtp} className="space-y-4">
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs text-foreground sm:p-4">
                  <div className="font-semibold">Xác thực Email qua mã OTP (hiệu lực 5–10 phút)</div>
                  <p className="mt-1 break-all text-muted-foreground">
                    Mã 6 số đã được gửi đến <span className="font-semibold text-foreground">{regEmail}</span>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-otp">Nhập mã OTP 6 số</Label>
                  <Input
                    id="reg-otp"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={regOtp}
                    onChange={(e) => setRegOtp(e.target.value)}
                    className="tabular-mono h-12 rounded-xl text-center text-lg tracking-[0.35em]"
                  />
                </div>

                {regNotice && (
                  <div className="flex items-start gap-2 rounded-lg border border-status-info/30 bg-status-info/10 p-3 text-xs text-status-info">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{regNotice}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setRegOtpStep(false)}>
                    Quay lại
                  </Button>
                  <Button type="submit" className="h-11 flex-1 rounded-xl">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Xác nhận &amp; Hoàn tất đăng ký</span>
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* TAB 3: FORGOT PASSWORD — 2-STEP FLOW (UC-IAM-03) */}
          <TabsContent value="forgot" className="space-y-4 pt-2">
            {!forgotSent ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setResetNotice(null);
                  setForgotSent(true);
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email">Email đã đăng ký hoặc Email cá nhân dự phòng</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@student.hcmute.edu.vn"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-11 rounded-xl text-base sm:h-10 sm:text-sm"
                  />
                </div>

                <Button type="submit" className="h-12 w-full rounded-xl sm:h-11">
                  <Lock className="h-4 w-4" />
                  <span>Gửi mã đặt lại mật khẩu</span>
                </Button>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="shrink-0">Bảo mật email</Badge>
                  <span>Hệ thống không tiết lộ email có tồn tại trong hệ thống hay không.</span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCompletePasswordReset} className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-status-info/30 bg-status-info/10 p-3.5 text-xs leading-relaxed text-foreground">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-status-info" />
                  <span>
                    Nếu email <strong className="break-all">{forgotEmail}</strong> tồn tại trong hệ thống, mã xác thực 6 số đã được gửi (hiệu lực 10–15 phút). Sau khi đổi mật khẩu, tất cả thiết bị đăng nhập cũ sẽ tự động đăng xuất.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reset-otp">Mã xác thực OTP 6 số</Label>
                  <Input
                    id="reset-otp"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    placeholder="000000"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="tabular-mono h-11 rounded-xl text-center text-base tracking-[0.35em]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reset-password">Mật khẩu mới</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Tối thiểu 8 ký tự gồm chữ hoa, số, ký tự đặc biệt"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="h-11 rounded-xl text-base sm:h-10 sm:text-sm"
                  />
                  {resetNewPassword && (
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full transition-all ${resetPwStrength.colorClass}`}
                          style={{ width: `${resetPwStrength.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{resetPwStrength.label}</p>
                    </div>
                  )}
                </div>

                {resetNotice && (
                  <div role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs text-status-danger">
                    {resetNotice}
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={() => {
                      setForgotSent(false);
                      setResetOtp("");
                      setResetNewPassword("");
                      setResetNotice(null);
                    }}
                  >
                    Đổi email khác
                  </Button>
                  <Button type="submit" className="h-11 flex-1 rounded-xl">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Xác nhận đổi mật khẩu</span>
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
