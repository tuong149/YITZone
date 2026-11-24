import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  MessageSquare,
  RotateCcw,
  Save,
  UserCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatFacultyDisplayName } from "@/features/iam/data/faculty-major-catalog";

const INITIAL_UNION_PROFILE = {
  className: "22110CL1A",
  unionBranch: "Chi đoàn 22110CL1A",
  phone: "0912345678",
  unionJoinDate: "2021-03-26",
  assocJoinDate: "2022-10-15",
  contactAddress: "TP. Thủ Đức, TP. Hồ Chí Minh"
};

export function ProfileInfoSection({
  userId,
  fullName,
  email,
  accountHealth,
  onUpdateAccountHealth,
  onboardingState
}) {
  const initialUnion = {
    ...INITIAL_UNION_PROFILE,
    ...(onboardingState?.unionProfile?.className ? { className: onboardingState.unionProfile.className } : {}),
    ...(onboardingState?.unionProfile?.unionBranch ? { unionBranch: onboardingState.unionProfile.unionBranch } : {}),
    ...(onboardingState?.unionProfile?.phone ? { phone: onboardingState.unionProfile.phone } : {})
  };
  const [savedProfile, setSavedProfile] = useState(initialUnion);
  const [form, setForm] = useState(initialUnion);
  const [formError, setFormError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [personalEmail, setPersonalEmail] = useState(accountHealth.backupEmail);
  const [emailError, setEmailError] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState(null);

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedProfile);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
    setSaveSuccess(false);
  };

  const handleSaveUnionProfile = (e) => {
    e.preventDefault();
    if (!form.className.trim() || !form.unionBranch.trim()) {
      setFormError("Vui lòng nhập đầy đủ Lớp sinh viên và Chi đoàn / Chi hội.");
      return;
    }
    if (form.phone.trim() && !/^0[0-9]{9}$/.test(form.phone.trim())) {
      setFormError("Số điện thoại liên hệ phải gồm đúng 10 chữ số bắt đầu bằng số 0.");
      return;
    }
    setSavedProfile(form);
    setFormError(null);
    setSaveSuccess(true);
  };

  const handleReset = () => {
    setForm(savedProfile);
    setFormError(null);
    setSaveSuccess(false);
  };

  const handleSendOtp = () => {
    const trimmed = personalEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Địa chỉ email không hợp lệ. Vui lòng nhập đúng định dạng (VD: tenban@gmail.com).");
      return;
    }
    if (trimmed.toLowerCase() === email.toLowerCase()) {
      setEmailError("Email dự phòng phải khác Email trường để vẫn đăng nhập được sau khi tốt nghiệp.");
      return;
    }
    setEmailError(null);
    setOtpError(null);
    setOtpSent(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!/^[0-9]{6}$/.test(otpValue.trim())) {
      setOtpError("Mã OTP phải gồm đúng 6 chữ số được gửi về hộp thư cá nhân.");
      return;
    }
    setOtpError(null);
    setOtpSent(false);
    setOtpValue("");
    onUpdateAccountHealth({
      backupEmail: personalEmail.trim(),
      backupEmailVerified: true
    });
  };

  const academic = onboardingState?.academicIdentity;
  const facultyMajorLabel = academic?.isGuestOrAlumni
    ? "Cựu sinh viên / Khách mời ngoài trường"
    : academic?.facultyName
      ? `${formatFacultyDisplayName(academic.facultyName)} · ${academic.majorName} (${academic.majorCode})`
      : "Khoa Công nghệ Thông tin · Công nghệ Thông tin (110)";
  const cddnBenefitLabel = academic?.isGuestOrAlumni
    ? "Không thuộc diện xét ĐRL / CĐDN"
    : academic
      ? academic.fitFaculty
        ? "Trực thuộc Khoa CNTT (Được tính CĐDN)"
        : `${formatFacultyDisplayName(academic.facultyName)} (ĐRL · CTXH · Không tính CĐDN Khoa CNTT)`
      : "Trực thuộc Khoa CNTT (Được tính CĐDN)";

  const lockedFields = [
    { label: "Họ và tên chính thức", value: fullName },
    { label: "Mã số sinh viên (MSSV)", value: userId, mono: true },
    { label: "Email trường (SSO)", value: email },
    { label: "Khoa & Ngành đào tạo", value: facultyMajorLabel },
    { label: "Phân loại quyền lợi CĐDN", value: cddnBenefitLabel },
    { label: "Vòng đời tài khoản", value: "Đang theo học (Chuyển Cựu SV khi tốt nghiệp)" }
  ];

  return (
    <div className="space-y-6">
      <section className="liquid-glass rounded-[26px] p-6 sm:px-7">
        <h1 className="font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Thông tin cá nhân &amp; Đoàn – Hội
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cập nhật thông tin sinh hoạt Chi đoàn, liên hệ cá nhân và email dự phòng dùng sau khi tốt nghiệp.
        </p>
      </section>

      {/* Read-only Roster Identity */}
      <Card className="rounded-[22px]">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span>Định danh khóa theo Roster chính thức</span>
            </CardTitle>
            <Badge variant="secondary">Chỉ đọc</Badge>
          </div>
          <CardDescription>
            Thông tin này được đối chiếu từ Phòng Đào tạo / CTSV và không thể tự chỉnh sửa để đảm bảo độ tin cậy của mã vạch thẻ sinh viên và E-Certificate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            {lockedFields.map((field) => (
              <div key={field.label} className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
                <dd
                  className={`rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-foreground/90 ${
                    field.mono ? "tabular-mono font-semibold" : ""
                  }`}
                >
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
            <span>Phát hiện sai sót về họ tên, MSSV hoặc ngành học?</span>
            <Link
              to="/messenger"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Gửi yêu cầu điều chỉnh tới BCH</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Editable Union & Contact Form */}
      <Card className="rounded-[22px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4 text-primary" />
            <span>Hồ sơ Đoàn viên / Hội viên &amp; Liên hệ</span>
          </CardTitle>
          <CardDescription>
            Dùng cho sổ đoàn viên, danh sách liên hệ BTC sự kiện và giao nhận vật phẩm tại phòng học.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveUnionProfile} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prof-class">Lớp sinh viên</Label>
                <Input
                  id="prof-class"
                  value={form.className}
                  onChange={(e) => updateField("className", e.target.value)}
                  placeholder="VD: 22110CL1A"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-branch">Chi đoàn / Chi hội</Label>
                <Input
                  id="prof-branch"
                  value={form.unionBranch}
                  onChange={(e) => updateField("unionBranch", e.target.value)}
                  placeholder="VD: Chi đoàn 22110CL1A"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-phone">Số điện thoại liên hệ</Label>
                <Input
                  id="prof-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="09xxxxxxxx"
                  className="tabular-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-address">Khu vực cư trú</Label>
                <Input
                  id="prof-address"
                  value={form.contactAddress}
                  onChange={(e) => updateField("contactAddress", e.target.value)}
                  placeholder="Quận/Huyện, Tỉnh/TP"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-union-date">Ngày vào Đoàn TNCS HCM</Label>
                <Input
                  id="prof-union-date"
                  type="date"
                  value={form.unionJoinDate}
                  onChange={(e) => updateField("unionJoinDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-assoc-date">Ngày vào Hội Sinh viên</Label>
                <Input
                  id="prof-assoc-date"
                  type="date"
                  value={form.assocJoinDate}
                  onChange={(e) => updateField("assocJoinDate", e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {saveSuccess && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-md border border-status-success/30 bg-status-success/10 px-3 py-2 text-xs text-status-success"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Đã lưu thay đổi hồ sơ Đoàn – Hội thành công.</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={!isDirty}
              >
                <RotateCcw className="h-4 w-4" />
                <span>Hoàn tác</span>
              </Button>
              <Button type="submit" disabled={!isDirty}>
                <Save className="h-4 w-4" />
                <span>Lưu thay đổi</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Personal Backup Email for Alumni Lifecycle */}
      <Card className="rounded-[22px]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-4 w-4 text-primary" />
              <span>Email cá nhân dự phòng (Sau tốt nghiệp)</span>
            </CardTitle>
            <Badge variant={accountHealth.backupEmailVerified ? "success" : "warning"}>
              {accountHealth.backupEmailVerified ? "Đã xác thực" : "Chưa xác thực"}
            </Badge>
          </div>
          <CardDescription>
            Khi email trường bị thu hồi sau tốt nghiệp, Cựu SV dùng Email cá nhân + Mật khẩu để tiếp tục truy cập đúng tài khoản cũ, tải E-Certificate và cập nhật E-Portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="personal-email">Email cá nhân</Label>
              <Input
                id="personal-email"
                type="email"
                value={personalEmail}
                onChange={(e) => {
                  setPersonalEmail(e.target.value);
                  setEmailError(null);
                  setOtpSent(false);
                  if (accountHealth.backupEmailVerified) {
                    onUpdateAccountHealth({ backupEmailVerified: false });
                  }
                }}
                placeholder="tenban@gmail.com"
              />
            </div>
            {!accountHealth.backupEmailVerified && (
              <Button type="button" variant="outline" onClick={handleSendOtp}>
                Gửi mã OTP xác thực
              </Button>
            )}
          </div>

          {emailError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          {otpSent && !accountHealth.backupEmailVerified && (
            <form
              onSubmit={handleVerifyOtp}
              className="space-y-3 rounded-md border border-border bg-muted/40 p-4"
            >
              <div className="space-y-1">
                <Label htmlFor="personal-otp">Nhập mã OTP 6 số đã gửi tới {personalEmail}</Label>
                <p className="text-xs text-muted-foreground">
                  Mã có hiệu lực trong 5 phút. Kiểm tra cả hộp thư Quảng cáo / Spam nếu chưa thấy.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="personal-otp"
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="123456"
                  value={otpValue}
                  onChange={(e) => {
                    setOtpValue(e.target.value.replace(/\D/g, ""));
                    setOtpError(null);
                  }}
                  className="tabular-mono sm:max-w-[180px]"
                />
                <Button type="submit">Xác nhận OTP</Button>
              </div>
              {otpError && (
                <p role="alert" className="text-xs text-status-danger">
                  {otpError}
                </p>
              )}
            </form>
          )}

          {accountHealth.backupEmailVerified && (
            <div className="flex items-center gap-2 rounded-md border border-status-success/30 bg-status-success/10 px-3.5 py-2.5 text-xs font-medium text-status-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Email cá nhân {accountHealth.backupEmail} đã được xác thực và sẵn sàng cho vòng đời Cựu SV.
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
