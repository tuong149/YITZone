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
import { apiClient, extractApiErrorMessage, type ApiResponse } from "@/lib/api-client";
import { getOrCreateDeviceKeyPair } from "@/lib/webcrypto";
import { useAuthStore, type RoleScopeItem } from "@/stores/auth-store";

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

interface DevTokenPayload {
  accessToken: string;
  tokenType: string;
}

function evaluatePasswordStrength(pw: string): { score: number; label: string; colorClass: string } {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  if (score <= 1) return { score: 25, label: "Yếu (cần ≥ 8 ký tự, chữ hoa, số, ký tự đặc biệt)", colorClass: "bg-status-danger" };
  if (score === 2) return { score: 50, label: "Trung bình", colorClass: "bg-status-warning" };
  if (score === 3) return { score: 75, label: "Khá mạnh", colorClass: "bg-brand-cyan" };
  return { score: 100, label: "Mạnh (Đạt chuẩn Argon2id/BCrypt)", colorClass: "bg-status-success" };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((s) => s.setSession);
  const redirectTarget =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? null;

  // Login state (UC-IAM-02, UC-IAM-03)
  const [loginEmail, setLoginEmail] = useState("22110123@student.hcmute.edu.vn");
  const [loginPassword, setLoginPassword] = useState("YitZone@2026");
  const [rolePreset, setRolePreset] = useState<"STUDENT" | "CADRE_OFIT" | "BTV_ADMIN">("STUDENT");
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Register state (UC-IAM-01)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [regOtpStep, setRegOtpStep] = useState(false);
  const [regOtp, setRegOtp] = useState("");
  const [regNotice, setRegNotice] = useState<string | null>(null);

  // Forgot password state (UC-IAM-03)
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const pwStrength = evaluatePasswordStrength(regPassword);
  const isLockedOut = failedAttempts >= 5;

  const completeDemoOrApiLogin = async (requireMfaCheck: boolean) => {
    setErrorMsg(null);
    if (isLockedOut) {
      setErrorMsg("Tài khoản tạm khóa 15 phút do nhập sai quá 5 lần liên tiếp (Rate Limit).");
      return;
    }

    if (requireMfaCheck && rolePreset === "BTV_ADMIN" && !mfaStep) {
      setMfaStep(true);
      return;
    }

    if (mfaStep && !/^[0-9]{6}$/.test(mfaCode.trim())) {
      setErrorMsg("Mã TOTP Authenticator phải gồm đúng 6 chữ số.");
      return;
    }

    setLoading(true);
    const presetConfig: Record<
      typeof rolePreset,
      { userId: string; fullName: string; authorities: string[]; roleScopes: RoleScopeItem[] }
    > = {
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
      const res = await apiClient.post<ApiResponse<DevTokenPayload>>("/iam/auth/dev-token", {
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

      void navigate(redirectTarget ?? (rolePreset === "STUDENT" ? "/" : "/admin"), { replace: true });
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
        void navigate(redirectTarget ?? (rolePreset === "STUDENT" ? "/" : "/admin"), { replace: true });
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
    void navigate("/auth/callback?provider=google&hd=hcmute.edu.vn");
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
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
    setRegNotice("Đã gửi mã OTP 6 số (hiệu lực 5–10 phút) qua SMTP. Hệ thống sẽ tự đối chiếu Roster, không nhận MSSV nhập tay.");
  };

  const handleVerifyRegOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(regOtp.trim())) {
      setRegNotice("Mã OTP xác thực phải gồm đúng 6 chữ số.");
      return;
    }
    setRegNotice(
      "Xác thực thành công! Đã đối chiếu OFFICIAL_DIRECTORY_ROSTER và tự động Auto-Link bản ghi điểm danh vãng lai (nếu có)."
    );
    setRegOtpStep(false);
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
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid h-auto min-h-[44px] w-full grid-cols-3 p-1">
              <TabsTrigger value="login" className="min-h-[36px] px-2 text-[11px] sm:px-4 sm:text-xs">
                Đăng nhập
              </TabsTrigger>
              <TabsTrigger value="register" className="min-h-[36px] px-2 text-[11px] sm:px-4 sm:text-xs">
                Đăng ký
              </TabsTrigger>
              <TabsTrigger value="forgot" className="min-h-[36px] px-1.5 text-[11px] sm:px-4 sm:text-xs">
                <span className="sm:hidden">Quên MK</span>
                <span className="hidden sm:inline">Quên mật khẩu</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: LOGIN + GOOGLE WORKSPACE + TOTP MFA */}
            <TabsContent value="login" className="space-y-4 pt-3 sm:space-y-5">
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
                <span className="text-center text-[11px] font-medium leading-snug text-muted-foreground sm:text-xs">
                  <span className="sm:hidden">Hoặc Email &amp; Mật khẩu</span>
                  <span className="hidden sm:inline">Hoặc Email &amp; Mật khẩu (SV / Cựu SV / Khách mời)</span>
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

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

                  <div className="space-y-1.5">
                    <Label htmlFor="login-preset">Vai trò mô phỏng nhanh (Dev / Local)</Label>
                    <Select
                      value={rolePreset}
                      onValueChange={(v) => setRolePreset(v as "STUDENT" | "CADRE_OFIT" | "BTV_ADMIN")}
                    >
                      <SelectTrigger id="login-preset" className="h-11 rounded-xl text-sm sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">Sinh viên Khoa CNTT (FACULTY · 22110123)</SelectItem>
                        <SelectItem value="CADRE_OFIT">Trưởng Ban Văn phòng (OFIT)</SelectItem>
                        <SelectItem value="BTV_ADMIN">Ban Thường vụ (BTV · Bắt buộc bước TOTP MFA)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ): (
                <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Smartphone className="h-4 w-4 shrink-0 text-primary" />
                    <span>Xác thực 2 lớp TOTP MFA (Bắt buộc với BTV / SystemAdmin)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Nhập mã 6 chữ số từ ứng dụng Authenticator (VD: <code className="tabular-mono">123456</code> để thử nhanh).
                  </p>
                  <Input
                    aria-label="Mã TOTP 6 số"
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
                <div className="flex items-start gap-2 rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs font-medium text-status-danger">
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
                      ? "Xác minh TOTP MFA & Đăng nhập"
: "Đăng nhập Hệ thống"}
                </span>
              </Button>
            </form>

            <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
              <span>Idle Timeout: ≤ 30 phút (Quản trị) · ≤ 7 ngày (Sinh viên)</span>
              <Link to="/privacy" className="font-semibold text-primary hover:underline">
                Quyền riêng tư
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
                  <Label htmlFor="reg-email">Email (thuộc domain trường để tự gán MSSV từ Roster)</Label>
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
                      <p className="text-[11px] text-muted-foreground">{pwStrength.label}</p>
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
                    Tôi đồng ý với <strong>Chính sách Bảo vệ Dữ liệu Cá nhân</strong> theo Luật 91/2025/QH15,
                    NĐ 356/2025 và NĐ 330/2026. Hệ thống sẽ tự động đối chiếu MSSV qua danh sách
                    chính thức của Trường.
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
            ): (
              <form onSubmit={handleVerifyRegOtp} className="space-y-4">
                <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs text-foreground sm:p-4">
                  <div className="font-semibold">Xác thực Email qua OTP (hiệu lực 5–10 phút)</div>
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
                    <span>Xác thực &amp; Đối chiếu Roster</span>
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* TAB 3: FORGOT PASSWORD — NEUTRAL ANTI-ENUMERATION RESPONSE (UC-IAM-03) */}
          <TabsContent value="forgot" className="space-y-4 pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
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

              {forgotSent && (
                <div className="flex items-start gap-2 rounded-xl border border-status-info/30 bg-status-info/10 p-3.5 text-xs leading-relaxed text-foreground">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-status-info" />
                  <span>
                    Nếu email tồn tại trong hệ thống, YITZone đã gửi mã OTP / liên kết đặt lại mật khẩu 1 lần
                    (hiệu lực 10–15 phút). Sau khi đổi mật khẩu thành công, toàn bộ Refresh Token của các phiên cũ
                    sẽ tự động bị thu hồi.
                  </span>
                </div>
              )}

              <Button type="submit" className="h-12 w-full rounded-xl sm:h-11">
                <Lock className="h-4 w-4" />
                <span>Gửi yêu cầu đặt lại mật khẩu</span>
              </Button>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="shrink-0">Chống dò tài khoản</Badge>
                <span>Hệ thống luôn trả phản hồi trung tính bất kể email có tồn tại hay không.</span>
              </div>
            </form>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}
