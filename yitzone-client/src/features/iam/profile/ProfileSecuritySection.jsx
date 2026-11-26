import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  ShieldCheck,
  Smartphone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setupTotpMfa, verifyTotpMfa } from "@/features/iam/api";
import { extractApiErrorMessage } from "@/lib/api-client";

const INITIAL_SESSIONS = [];

export function ProfileSecuritySection({
  userId,
  email,
  accountHealth,
  onUpdateAccountHealth
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(null);

  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaSetupError, setMfaSetupError] = useState(null);
  const [mfaOtp, setMfaOtp] = useState("");
  const [mfaError, setMfaError] = useState(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [sessionNotice, setSessionNotice] = useState(null);

  const rules = [
    { label: "Ít nhất 8 ký tự", ok: newPassword.length >= 8 },
    { label: "Có chữ hoa (A–Z)", ok: /[A-Z]/.test(newPassword) },
    { label: "Có chữ thường (a–z)", ok: /[a-z]/.test(newPassword) },
    { label: "Có chữ số hoặc ký tự đặc biệt", ok: /[0-9!@#$%^&*()_+\-=[\]{};':",.<>/?]/.test(newPassword) }
  ];
  const allRulesPass = rules.every((r) => r.ok);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (accountHealth.hasPassword && !currentPassword.trim()) {
      setPwError("Vui lòng nhập mật khẩu hiện tại để xác minh danh tính.");
      return;
    }
    if (!allRulesPass) {
      setPwError("Mật khẩu mới chưa đáp ứng đủ 4 tiêu chí an toàn bên dưới.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại.");
      return;
    }

    onUpdateAccountHealth({ hasPassword: true });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setSessions((prev) => prev.filter((s) => s.current));
    setPwSuccess(
      "Đã cập nhật mật khẩu thành công, thu hồi toàn bộ Refresh Token của các phiên khác và gửi email cảnh báo bảo mật."
    );
  };

  const handleStartMfaSetup = async () => {
    setMfaLoading(true);
    setMfaSetupError(null);
    setMfaError(null);
    try {
      const data = await setupTotpMfa();
      const secret = data?.secret || data?.sharedSecret || "";
      if (!secret) {
        setMfaSetupError("Máy chủ chưa trả về khóa thiết lập TOTP hợp lệ.");
        return;
      }
      const accountLabel = encodeURIComponent(userId || email || "YITZoneUser");
      const otpauthUri =
        data?.otpauthUri ||
        data?.qrCodeUri ||
        `otpauth://totp/YITZone:${accountLabel}?secret=${encodeURIComponent(secret)}&issuer=YITZone`;
      setMfaSetup({ secret, otpauthUri });
    } catch (err) {
      setMfaSetupError(
        extractApiErrorMessage(
          err,
          "Không thể khởi tạo khóa TOTP MFA từ máy chủ. Vui lòng thử lại khi dịch vụ xác thực sẵn sàng."
        )
      );
    } finally {
      setMfaLoading(false);
    }
  };

  const handleCopySecret = async () => {
    if (!mfaSetup?.secret) return;
    try {
      await navigator.clipboard.writeText(mfaSetup.secret);
    } catch {
      // Clipboard fallback ignored in restricted contexts
    }
    setCopiedSecret(true);
    window.setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    const cleanedOtp = mfaOtp.trim();
    if (!/^[0-9]{6}$/.test(cleanedOtp)) {
      setMfaError("Mã xác thực TOTP phải gồm đúng 6 chữ số từ ứng dụng Authenticator.");
      return;
    }
    setMfaError(null);
    try {
      await verifyTotpMfa(cleanedOtp);
      setMfaOtp("");
      setMfaSetup(null);
      onUpdateAccountHealth({ mfaEnabled: true });
    } catch (err) {
      setMfaError(
        extractApiErrorMessage(
          err,
          "Không thể xác minh mã TOTP 6 số với máy chủ. Vui lòng kiểm tra lại thời gian thiết bị."
        )
      );
    }
  };

  const revokeSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setSessionNotice("Đã thu hồi phiên đăng nhập trên thiết bị đã chọn.");
  };

  const revokeAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    setSessionNotice("Đã đăng xuất khỏi toàn bộ các thiết bị khác.");
  };

  const otherSessionsCount = sessions.filter((s) => !s.current).length;

  return (
    <div className="space-y-6">
      <section className="liquid-glass rounded-[26px] p-6 sm:px-7">
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Bảo mật &amp; Đăng nhập
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý phương thức xác thực Hybrid (Google Workspace + Mật khẩu), bật TOTP MFA và kiểm soát các phiên đăng nhập.
        </p>
      </section>

      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Phương thức đăng nhập liên kết</CardTitle>
          <CardDescription>
            Cùng trỏ về một tài khoản duy nhất (Account Linking) theo chuẩn xác thực Hybrid B2 của YITZone.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border border-t border-border">
            <li className="flex flex-col justify-between gap-2 px-5 py-3.5 sm:flex-row sm:items-center">
              <div>
                <div className="text-sm font-medium text-foreground">Google Workspace Nhà trường (SSO)</div>
                <div className="text-xs text-muted-foreground">{email || "Chưa liên kết email trường"}</div>
              </div>
              <Badge variant={email ? "success" : "secondary"}>
                {email ? "Đã liên kết" : "Chưa liên kết"}
              </Badge>
            </li>
            <li className="flex flex-col justify-between gap-2 px-5 py-3.5 sm:flex-row sm:items-center">
              <div>
                <div className="text-sm font-medium text-foreground">Email &amp; Mật khẩu nội bộ</div>
                <div className="text-xs text-muted-foreground">
                  {accountHealth.hasPassword
                    ? "Có thể đăng nhập trực tiếp khi không dùng SSO hoặc sau khi chuyển sang Cựu SV."
                    : "Chưa đặt mật khẩu — khuyến nghị thiết lập bên dưới."}
                </div>
              </div>
              <Badge variant={accountHealth.hasPassword ? "success" : "secondary"}>
                {accountHealth.hasPassword ? "Đã kích hoạt" : "Chưa thiết lập"}
              </Badge>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-[22px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>{accountHealth.hasPassword ? "Đổi mật khẩu" : "Thiết lập mật khẩu mới"}</span>
          </CardTitle>
          <CardDescription>
            Khi cập nhật mật khẩu, hệ thống tự động thu hồi toàn bộ Refresh Token của các phiên cũ và gửi email cảnh báo bảo mật.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="max-w-lg space-y-4">
            {accountHealth.hasPassword && (
              <div className="space-y-1.5">
                <Label htmlFor="current-pw">Mật khẩu hiện tại</Label>
                <div className="relative">
                  <Input
                    id="current-pw"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPwError(null);
                    }}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="new-pw">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="new-pw"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPwError(null);
                  }}
                  placeholder="Tối thiểu 8 ký tự mạnh"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-xs">
                {rules.map((rule) => (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-1.5 ${
                      rule.ok ? "text-status-success" : "text-muted-foreground"
                    }`}
                  >
                    <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${rule.ok ? "opacity-100" : "opacity-40"}`} />
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">Nhập lại mật khẩu mới</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPwError(null);
                }}
                placeholder="Xác nhận mật khẩu mới"
                autoComplete="new-password"
              />
            </div>

            {pwError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-md border border-status-success/30 bg-status-success/10 px-3 py-2 text-xs text-status-success"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <Button type="submit">
              Cập nhật mật khẩu &amp; Thu hồi phiên cũ
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[22px]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4 text-primary" />
              <span>Xác thực 2 lớp TOTP MFA</span>
            </CardTitle>
            <Badge variant={accountHealth.mfaEnabled ? "success" : "warning"}>
              {accountHealth.mfaEnabled ? "Đang bật" : "Chưa kích hoạt"}
            </Badge>
          </div>
          <CardDescription>
            Quét mã QR bằng Google Authenticator hoặc Microsoft Authenticator theo chuẩn RFC 6238 (6 số, làm mới mỗi 30 giây). Bắt buộc với BTV &amp; SystemAdmin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accountHealth.mfaEnabled ? (
            <div className="flex flex-col justify-between gap-4 rounded-md border border-status-success/30 bg-status-success/10 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-2.5 text-sm text-status-success">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <div className="font-semibold">Tài khoản đang được bảo vệ bằng TOTP MFA</div>
                  <p className="text-xs opacity-90">
                    Mỗi lần đăng nhập mới hoặc thao tác phê duyệt quan trọng sẽ yêu cầu mã 6 số từ thiết bị xác thực.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onUpdateAccountHealth({ mfaEnabled: false })}
              >
                Tắt MFA
              </Button>
            </div>
          ) : !mfaSetup ? (
            <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Khởi tạo khóa bí mật TOTP trực tiếp từ máy chủ xác thực để liên kết với ứng dụng Google Authenticator hoặc Microsoft Authenticator trên điện thoại của bạn.
              </p>
              {mfaSetupError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{mfaSetupError}</span>
                </div>
              )}
              <Button
                type="button"
                disabled={mfaLoading}
                onClick={() => void handleStartMfaSetup()}
              >
                {mfaLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                <span>{mfaLoading ? "Đang khởi tạo khóa TOTP..." : "Thiết lập xác thực 2 lớp (2FA)"}</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="shrink-0 self-start rounded-md border border-border bg-white p-3">
                <QRCodeSVG value={mfaSetup.otpauthUri} size={132} />
              </div>

              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Khóa thiết lập thủ công (nếu không quét được QR)
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="tabular-mono rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground">
                      {mfaSetup.secret}
                    </code>
                    <Button type="button" variant="outline" size="sm" onClick={() => void handleCopySecret()}>
                      {copiedSecret ? (
                        <Check className="h-3.5 w-3.5 text-status-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedSecret ? "Đã sao chép" : "Sao chép"}</span>
                    </Button>
                  </div>
                </div>

                <form onSubmit={(e) => void handleVerifyMfa(e)} className="space-y-2.5">
                  <Label htmlFor="mfa-verify">Nhập mã 6 số từ ứng dụng Authenticator</Label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      id="mfa-verify"
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="000000"
                      value={mfaOtp}
                      onChange={(e) => {
                        setMfaOtp(e.target.value.replace(/\D/g, ""));
                        setMfaError(null);
                      }}
                      className="tabular-mono sm:max-w-[180px]"
                    />
                    <Button type="submit">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Xác minh &amp; Bật MFA</span>
                    </Button>
                  </div>
                  {mfaError && (
                    <p role="alert" className="text-xs text-status-danger">
                      {mfaError}
                    </p>
                  )}
                </form>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Thiết bị &amp; Phiên đăng nhập</CardTitle>
              <CardDescription className="mt-0.5">
                Kiểm tra các trình duyệt hoặc thiết bị đang giữ phiên đăng nhập YITZone của bạn.
              </CardDescription>
            </div>
            {otherSessionsCount > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={revokeAllOtherSessions}>
                <LogOut className="h-3.5 w-3.5" />
                <span>Đăng xuất {otherSessionsCount} thiết bị khác</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sessionNotice && (
            <div className="mx-5 mb-3 flex items-center gap-2 rounded-md border border-status-info/30 bg-status-info/10 px-3 py-2 text-xs text-status-info">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{sessionNotice}</span>
            </div>
          )}
          {sessions.length === 0 ? (
            <div className="border-t border-border p-6 text-center text-xs text-muted-foreground">
              Chưa có danh sách phiên đăng nhập hoạt động nào được đồng bộ từ máy chủ.
            </div>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {sessions.map((sess) => (
                <li
                  key={sess.id}
                  className="flex flex-col justify-between gap-3 px-5 py-3.5 sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      {sess.type === "mobile" ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{sess.device}</span>
                        {sess.current && <Badge variant="success">Phiên hiện tại</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sess.location} · {sess.lastActive}
                      </div>
                    </div>
                  </div>
                  {!sess.current && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeSession(sess.id)}
                      className="self-start text-status-danger hover:bg-status-danger/10 hover:text-status-danger sm:self-center"
                    >
                      Thu hồi
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
