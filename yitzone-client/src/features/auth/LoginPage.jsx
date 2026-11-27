import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  UserPlus
} from "lucide-react";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient, extractApiErrorMessage } from "@/lib/api-client";
import { canAccessAdminWorkspace } from "@/lib/permissions";
import { getOrCreateDeviceKeyPair } from "@/lib/webcrypto";
import { useAuthStore, AUTH_REDIRECT_STORAGE_KEY } from "@/stores/auth-store";
import { pushAppToast } from "@/stores/toast-store";

const IS_OIDC_AVAILABLE = import.meta.env.VITE_OIDC_ENABLED !== "false";

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46a5.52 5.52 0 0 1-2.39 3.62v3.01h3.87c2.26-2.08 3.55-5.15 3.55-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3.01c-1.07.72-2.44 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </svg>
  );
}

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

  const fromLocation = location.state?.from;
  const savedRedirect =
    typeof window !== "undefined" ? window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY) : null;
  const redirectTarget = fromLocation?.pathname
    ? `${fromLocation.pathname}${fromLocation.search ?? ""}${fromLocation.hash ?? ""}`
    : savedRedirect && savedRedirect !== "/login"
      ? savedRedirect
      : null;

  const [activeTab, setActiveTab] = useState("login");

  // Login state (UC-IAM-02, UC-IAM-03)
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
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
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regNotice, setRegNotice] = useState(null);
  const [regError, setRegError] = useState(null);

  // Forgot password state (UC-IAM-03)
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetNotice, setResetNotice] = useState(null);

  const pwStrength = evaluatePasswordStrength(regPassword);
  const resetPwStrength = evaluatePasswordStrength(resetNewPassword);

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

  const finalizeAuthenticatedSession = async (authPayload, fallbackEmail) => {
    const authorities = Array.isArray(authPayload.authorities) ? authPayload.authorities : [];
    const roleScopes = Array.isArray(authPayload.roleScopes) ? authPayload.roleScopes : [];

    setSession({
      userId: authPayload.userId,
      email: authPayload.email ?? fallbackEmail,
      fullName: authPayload.fullName ?? null,
      accessToken: authPayload.accessToken,
      authorities,
      roleScopes,
      authProvider: authPayload.authProvider ?? "password"
    });

    try {
      const { publicKeyJwk } = await getOrCreateDeviceKeyPair();
      await apiClient.post("/iam/device-tokens", { publicKeyJwk });
    } catch {
      // Non-blocking if device token endpoint is unavailable
    }

    const displayName = authPayload.fullName ?? authPayload.email ?? fallbackEmail;
    pushAppToast({
      variant: "success",
      title: "Đăng nhập thành công",
      description: displayName
        ? `Chào mừng ${displayName} quay trở lại YITZone.`
        : "Phiên tài khoản YITZone đã được kích hoạt.",
      durationMs: 4000
    });

    const defaultLanding = canAccessAdminWorkspace(true, authorities) ? "/admin" : "/";
    consumeRedirectAndNavigate(defaultLanding);
  };

  const handleLoginSubmit = async () => {
    setErrorMsg(null);
    setLoginInfoMsg(null);

    if (mfaStep) {
      if (!/^[0-9]{6}$/.test(mfaCode.trim())) {
        setErrorMsg("Mã xác thực 2 lớp phải gồm đúng 6 chữ số.");
        return;
      }
      setLoading(true);
      try {
        const res = await apiClient.post("/iam/auth/mfa/verify", {
          mfaChallengeToken,
          code: mfaCode.trim()
        });
        if (!res.data?.success || !res.data?.data?.accessToken) {
          setErrorMsg(res.data?.detail ?? "Mã xác thực 2 lớp không chính xác hoặc đã hết hạn.");
          return;
        }
        await finalizeAuthenticatedSession(res.data.data, loginEmail.trim());
      } catch (err) {
        setErrorMsg(
          extractApiErrorMessage(err, "Không thể xác minh mã 2 lớp. Vui lòng kiểm tra lại và thử lại.")
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/iam/auth/login", {
        email: loginEmail.trim(),
        password: loginPassword
      });

      if (!res.data?.success) {
        setErrorMsg(res.data?.detail ?? "Thông tin đăng nhập chưa chính xác.");
        return;
      }

      const payload = res.data.data ?? {};
      if (payload.mfaRequired) {
        setMfaChallengeToken(payload.mfaChallengeToken ?? null);
        setMfaStep(true);
        return;
      }

      if (!payload.accessToken) {
        setErrorMsg("Máy chủ xác thực không trả về phiên hợp lệ.");
        return;
      }

      await finalizeAuthenticatedSession(payload, loginEmail.trim());
    } catch (err) {
      setErrorMsg(
        extractApiErrorMessage(
          err,
          "Đăng nhập thất bại. Máy chủ xác thực chưa sẵn sàng hoặc thông tin chưa chính xác."
        )
      );
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
    window.location.assign("/oauth2/authorization/google");
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError(null);
    setRegNotice(null);

    if (!consentAccepted) {
      setRegError("Bạn cần xác nhận đồng ý Chính sách Bảo vệ Dữ liệu Cá nhân (Luật 91/2025/QH15).");
      return;
    }
    if (pwStrength.score < 75) {
      setRegError("Mật khẩu chưa đạt độ mạnh tối thiểu (cần chữ hoa, chữ thường, số và ký tự đặc biệt).");
      return;
    }

    setRegSubmitting(true);
    try {
      const res = await apiClient.post("/iam/auth/register", {
        fullName: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        consentAccepted: true
      });
      if (res.data && res.data.success === false) {
        setRegError(res.data.detail ?? "Không thể khởi tạo đăng ký tài khoản.");
        return;
      }
      setRegOtpStep(true);
      setRegNotice(
        "Đã gửi mã xác thực 6 số (hiệu lực 5–10 phút) tới email của bạn. Hệ thống sẽ tự đối chiếu danh sách sinh viên chính thức của Trường."
      );
      pushAppToast({
        variant: "info",
        title: "Đã gửi mã OTP xác thực",
        description: `Vui lòng kiểm tra hộp thư ${regEmail.trim()} và nhập mã 6 chữ số.`,
        durationMs: 4500
      });
    } catch (err) {
      setRegError(
        extractApiErrorMessage(err, "Không thể gửi yêu cầu đăng ký. Vui lòng kiểm tra kết nối máy chủ.")
      );
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleVerifyRegOtp = async (e) => {
    e.preventDefault();
    setRegError(null);
    if (!/^[0-9]{6}$/.test(regOtp.trim())) {
      setRegError("Mã OTP xác thực phải gồm đúng 6 chữ số.");
      return;
    }

    setRegSubmitting(true);
    try {
      const res = await apiClient.post("/iam/auth/verify-email-otp", {
        email: regEmail.trim(),
        otpCode: regOtp.trim()
      });
      if (res.data && res.data.success === false) {
        setRegError(res.data.detail ?? "Mã OTP không hợp lệ hoặc đã hết hạn.");
        return;
      }

      const payload = res.data?.data;
      setRegOtpStep(false);
      setRegOtp("");
      setRegNotice(null);

      if (payload?.accessToken) {
        await finalizeAuthenticatedSession(payload, regEmail.trim());
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

      setLoginEmail(regEmail.trim());
      setLoginPassword("");
      setLoginInfoMsg("Kích hoạt tài khoản thành công. Vui lòng đăng nhập để tiếp tục.");
      setActiveTab("login");
    } catch (err) {
      setRegError(
        extractApiErrorMessage(err, "Xác thực OTP thất bại. Vui lòng kiểm tra lại mã 6 số hoặc thử lại.")
      );
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleRequestForgotPassword = async (e) => {
    e.preventDefault();
    setResetNotice(null);
    setResetSubmitting(true);
    try {
      await apiClient.post("/iam/auth/password/forgot", {
        email: forgotEmail.trim()
      });
      setForgotSent(true);
      pushAppToast({
        variant: "info",
        title: "Đã gửi yêu cầu khôi phục mật khẩu",
        description: "Nếu email hợp lệ, mã OTP 6 chữ số sẽ được gửi tới hộp thư trong ít phút.",
        durationMs: 4500
      });
    } catch (err) {
      setResetNotice(
        extractApiErrorMessage(err, "Không thể gửi yêu cầu đặt lại mật khẩu lúc này. Vui lòng thử lại sau.")
      );
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleCompletePasswordReset = async (e) => {
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

    setResetSubmitting(true);
    try {
      const res = await apiClient.post("/iam/auth/password/reset", {
        email: forgotEmail.trim(),
        otpCode: resetOtp.trim(),
        newPassword: resetNewPassword
      });
      if (res.data && res.data.success === false) {
        setResetNotice(res.data.detail ?? "Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại mã OTP.");
        return;
      }
      setForgotSent(false);
      setResetOtp("");
      setResetNewPassword("");
      setResetNotice(null);
      setLoginEmail(forgotEmail.trim());
      setLoginPassword("");
      setLoginInfoMsg("Đặt lại mật khẩu thành công. Các thiết bị đăng nhập cũ đã được đăng xuất tự động.");
      pushAppToast({
        variant: "success",
        title: "Đặt lại mật khẩu thành công",
        description: "Toàn bộ phiên đăng nhập cũ đã được thu hồi. Bạn có thể đăng nhập bằng mật khẩu mới.",
        durationMs: 5000
      });
      setActiveTab("login");
    } catch (err) {
      setResetNotice(
        extractApiErrorMessage(err, "Đặt lại mật khẩu thất bại. Mã OTP không đúng hoặc đã hết hạn.")
      );
    } finally {
      setResetSubmitting(false);
    }
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
              Đăng nhập YITZone
            </h1>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm dark:text-blue-100/85">
              Dùng Google Workspace trường, email sinh viên hoặc email cá nhân đã liên kết.
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
                    className="h-auto min-h-[46px] w-full justify-center gap-2.5 rounded-xl border-border bg-card px-3.5 py-2.5 text-center text-xs font-semibold leading-snug text-foreground shadow-sm transition-colors hover:border-primary/45 hover:bg-muted/40 sm:text-sm"
                    onClick={handleGoogleWorkspace}
                  >
                    <GoogleMark />
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
                  void handleLoginSubmit();
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
                        placeholder="22110123@student.hcmute.edu.vn"
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
                        placeholder="Nhập mật khẩu của bạn"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-11 rounded-xl text-base sm:h-10 sm:text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5 sm:p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Smartphone className="h-4 w-4 shrink-0 text-primary" />
                      <span>Xác thực 2 lớp (Ban Thường vụ / Quản trị Hệ thống)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nhập mã 6 chữ số từ ứng dụng xác thực trên điện thoại của bạn.
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
                        setMfaChallengeToken(null);
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

                <Button type="submit" className="h-12 w-full rounded-xl text-sm sm:h-11" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  <span>
                    {loading
                      ? mfaStep
                        ? "Đang kiểm tra mã..."
                        : "Đang đăng nhập..."
                      : mfaStep
                        ? "Xác nhận mã 2 lớp"
                        : "Đăng nhập"}
                  </span>
                </Button>
              </form>

              <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
                <span>Phiên được bảo vệ tự động.</span>
                <Link to="/privacy" className="font-semibold text-primary hover:underline">
                  Chính sách Quyền riêng tư
                </Link>
              </div>
            </TabsContent>

            {/* TAB 2: REGISTER EMAIL + PASSWORD + OTP + CONSENT (UC-IAM-01) */}
            <TabsContent value="register" className="space-y-4 pt-2">
              {!regOtpStep ? (
                <form onSubmit={(e) => void handleRegisterSubmit(e)} className="space-y-4">
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
                      placeholder="22110123@student.hcmute.edu.vn"
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

                  {regError && (
                    <div role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs text-status-danger">
                      {regError}
                    </div>
                  )}

                  <Button type="submit" className="h-12 w-full rounded-xl sm:h-11" disabled={regSubmitting}>
                    {regSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    <span>{regSubmitting ? "Đang gửi mã..." : "Tiếp tục"}</span>
                  </Button>
                </form>
              ) : (
                <form onSubmit={(e) => void handleVerifyRegOtp(e)} className="space-y-4">
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
                      placeholder="000000"
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

                  {regError && (
                    <div role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs text-status-danger">
                      {regError}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row">
                    <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setRegOtpStep(false)}>
                      Quay lại
                    </Button>
                    <Button type="submit" className="h-11 flex-1 rounded-xl" disabled={regSubmitting}>
                      {regSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      <span>{regSubmitting ? "Đang kiểm tra..." : "Hoàn tất đăng ký"}</span>
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>

            {/* TAB 3: FORGOT PASSWORD — 2-STEP FLOW (UC-IAM-03) */}
            <TabsContent value="forgot" className="space-y-4 pt-2">
              {!forgotSent ? (
                <form onSubmit={(e) => void handleRequestForgotPassword(e)} className="space-y-4">
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

                  {resetNotice && (
                    <div role="alert" className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs text-status-danger">
                      {resetNotice}
                    </div>
                  )}

                  <Button type="submit" className="h-12 w-full rounded-xl sm:h-11" disabled={resetSubmitting}>
                    {resetSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <span>{resetSubmitting ? "Đang gửi mã..." : "Gửi mã xác nhận"}</span>
                  </Button>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="shrink-0">Bảo mật email</Badge>
                    <span>Hệ thống không tiết lộ email có tồn tại trong hệ thống hay không.</span>
                  </div>
                </form>
              ) : (
                <form onSubmit={(e) => void handleCompletePasswordReset(e)} className="space-y-4">
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
                    <Button type="submit" className="h-11 flex-1 rounded-xl" disabled={resetSubmitting}>
                      {resetSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      <span>{resetSubmitting ? "Đang lưu..." : "Đổi mật khẩu"}</span>
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
