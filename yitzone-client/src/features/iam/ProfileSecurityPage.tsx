import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Award,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
  Smartphone,
  UserCheck
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";

const TERM_HISTORY = [
  {
    id: "th-1",
    role: "Phó Ban Văn phòng (OFIT)",
    unit: "Ban Văn phòng Khoa CNTT",
    period: "09/2025 → Hiện tại",
    status: "Đang tại nhiệm"
  },
  {
    id: "th-2",
    role: "Tổ trưởng Tổ Hậu cần",
    unit: "Ban Sự kiện – Truyền thông (EMFIT)",
    period: "09/2024 → 08/2025",
    status: "Hoàn thành nhiệm kỳ"
  },
  {
    id: "th-3",
    role: "Cộng tác viên",
    unit: "Ban Văn phòng (OFIT)",
    period: "10/2023 → 08/2024",
    status: "Hoàn thành nhiệm kỳ"
  }
];

export function ProfileSecurityPage(){
  const userId = useAuthStore((s) => s.userId) ?? "22110345";
  const fullName = useAuthStore((s) => s.fullName) ?? "Nguyễn Minh Khoa";
  const email = useAuthStore((s) => s.email) ?? "22110345@student.hcmute.edu.vn";

  // Union profile (UC-IAM-05)
  const [className, setClassName] = useState("22110CL1A");
  const [unionBranch, setUnionBranch] = useState("Chi đoàn 22110CL1A");
  const [unionJoinDate, setUnionJoinDate] = useState("2021-03-26");
  const [profileSaved, setProfileSaved] = useState(false);

  // Personal email backup for Alumni lifecycle (UC-IAM-05)
  const [personalEmail, setPersonalEmail] = useState("minhkhoa.dev@gmail.com");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [personalVerified, setPersonalVerified] = useState(false);

  // TOTP MFA (UC-IAM-03)
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaOtp, setMfaOtp] = useState("");
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col gap-4 rounded-[26px] p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              {fullName}
            </h1>
            <Badge variant="success">Đang theo học</Badge>
            <VerifiedBadge label="Khoa CNTT · Mã ngành 110 (CĐDN)" />
          </div>
          <p className="text-sm text-muted-foreground">
            MSSV: <span className="tabular-mono font-semibold text-foreground">{userId}</span> · {email}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">Vòng đời: Đang học → Cựu SV → Lưu trữ</Badge>
        </div>
      </section>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Hồ sơ Đoàn – Hội &amp; Email dự phòng</TabsTrigger>
          <TabsTrigger value="security">Mật khẩu &amp; TOTP MFA</TabsTrigger>
          <TabsTrigger value="history">Lịch sử cống hiến</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Thông tin Đoàn viên / Hội viên
              </CardTitle>
              <CardDescription>
                MSSV và Ngành học được khóa theo Roster chính thức; bạn chỉ cập nhật thông tin sinh hoạt Chi đoàn/Chi hội.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof-class">Lớp sinh viên</Label>
                <Input id="prof-class" value={className} onChange={(e) => setClassName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-branch">Chi đoàn / Chi hội</Label>
                <Input id="prof-branch" value={unionBranch} onChange={(e) => setUnionBranch(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-date">Ngày vào Đoàn</Label>
                <Input
                  id="prof-date"
                  type="date"
                  value={unionJoinDate}
                  onChange={(e) => setUnionJoinDate(e.target.value)}
                />
              </div>

              {profileSaved && (
                <div className="flex items-center gap-2 rounded-md border border-status-success/30 bg-status-success/10 px-3 py-2 text-xs text-status-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Đã cập nhật hồ sơ Đoàn – Hội thành công.
                </div>
              )}

              <Button
                type="button"
                onClick={() => setProfileSaved(true)}
              >
                Lưu hồ sơ Đoàn – Hội
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Cá nhân Dự phòng (Sau Tốt nghiệp)
              </CardTitle>
              <CardDescription>
                Khi email trường bị thu hồi sau tốt nghiệp, Cựu SV đăng nhập bằng Email cá nhân + Mật khẩu vào đúng tài khoản cũ để tải E-Cert &amp; E-Portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="personal-email">Email cá nhân</Label>
                <Input
                  id="personal-email"
                  type="email"
                  value={personalEmail}
                  onChange={(e) => {
                    setPersonalEmail(e.target.value);
                    setPersonalVerified(false);
                  }}
                />
              </div>

              {!personalVerified ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setOtpSent(true)}>
                    Gửi mã OTP xác thực qua SMTP
                  </Button>

                  {otpSent && (
                    <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3.5">
                      <Label htmlFor="personal-otp">Nhập mã OTP 6 số</Label>
                      <div className="flex gap-2">
                        <Input
                          id="personal-otp"
                          maxLength={6}
                          placeholder="123456"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value)}
                          className="tabular-mono"
                        />
                        <Button
                          type="button"
                          onClick={() => {
                            if (/^[0-9]{6}$/.test(otpValue.trim())) {
                              setPersonalVerified(true);
                            }
                          }}
                        >
                          Xác nhận
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ): (
                <div className="flex items-center gap-2 rounded-lg border border-status-success/30 bg-status-success/10 p-3 text-xs font-medium text-status-success">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Email cá nhân {personalEmail} đã được xác thực và sẵn sàng cho vòng đời Cựu SV.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Thiết lập / Đổi Mật khẩu
              </CardTitle>
              <CardDescription>
                Dành cho người dùng đăng nhập từ Google Workspace muốn đặt thêm mật khẩu, hoặc đổi mật khẩu định kỳ (tự động thu hồi toàn bộ Refresh Token phiên cũ).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-pw">Mật khẩu mới</Label>
                <Input id="new-pw" type="password" placeholder="Tối thiểu 8 ký tự mạnh" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pw">Nhập lại mật khẩu mới</Label>
                <Input id="confirm-pw" type="password" placeholder="Xác nhận mật khẩu mới" />
              </div>
              {securityMessage && (
                <div className="rounded-md border border-status-info/30 bg-status-info/10 px-3 py-2 text-xs text-status-info">
                  {securityMessage}
                </div>
              )}
              <Button
                type="button"
                onClick={() =>
                  setSecurityMessage(
                    "Đã đổi mật khẩu, thu hồi toàn bộ Refresh Token của các phiên cũ và gửi email cảnh báo bảo mật."
                  )
                }
              >
                Cập nhật mật khẩu &amp; Thu hồi phiên cũ
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Xác thực 2 lớp TOTP MFA (Bắt buộc với BTV / Admin)
              </CardTitle>
              <CardDescription>
                Quét mã QR bằng Google Authenticator / Microsoft Authenticator theo chuẩn RFC 6238 (6 số, 30 giây).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="rounded-xl border border-border bg-white p-3">
                  <QRCodeSVG
                    value={`otpauth://totp/YITZone:${userId}?secret=JBSWY3DPEHPK3PXP&issuer=YITZone`}
                    size={128}
                  />
                </div>
                <div className="flex-1 space-y-2.5">
                  <Badge variant={mfaEnabled ? "success": "warning"}>
                    {mfaEnabled ? "TOTP MFA Đang bật": "Chưa kích hoạt MFA"}
                  </Badge>
                  <div className="space-y-1">
                    <Label htmlFor="mfa-verify">Nhập mã 6 số để kích hoạt</Label>
                    <Input
                      id="mfa-verify"
                      maxLength={6}
                      placeholder="123456"
                      value={mfaOtp}
                      onChange={(e) => setMfaOtp(e.target.value)}
                      className="tabular-mono"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (/^[0-9]{6}$/.test(mfaOtp.trim())) setMfaEnabled(true);
                    }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Xác minh &amp; Bật MFA
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Lịch sử Cống hiến &amp; Chức vụ Đoàn – Hội (termHistory)
              </CardTitle>
              <CardDescription>
                Dữ liệu bất biến được lưu tự động khi bổ nhiệm hoặc thôi giữ chức (`endAt`), dùng để đồng bộ sang E-Portfolio và xét duyệt SV5T.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {TERM_HISTORY.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="font-display text-base font-medium text-foreground">{item.role}</div>
                    <div className="text-xs text-muted-foreground">{item.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-mono text-xs text-muted-foreground">{item.period}</span>
                    <Badge variant={item.status === "Đang tại nhiệm" ? "success": "secondary"}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
