import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  GraduationCap,
  MonitorPlay,
  QrCode,
  Shield,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { BrandLockup } from "@/components/ui/brand-lockup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { InternalBchNote } from "@/components/ui/internal-note";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SAMPLE_REVIEW_QUEUE = [
  {
    id: "att-101",
    studentCode: "22110345",
    fullName: "Nguyễn Minh Khoa",
    eventName: "Workshop Kiến trúc Cloud Native",
    flagLabel: "GPS lệch nhẹ (+1đ)",
    riskWeight: 1,
    timestamp: "08:14:22"
  },
  {
    id: "att-102",
    studentCode: "22110412",
    fullName: "Trần Thảo Vy",
    eventName: "Workshop Kiến trúc Cloud Native",
    flagLabel: "Khóa thiết bị mới < 15' (+1đ)",
    riskWeight: 1,
    timestamp: "08:16:05"
  },
  {
    id: "att-103",
    studentCode: "23110188",
    fullName: "Lê Hoàng Nam",
    eventName: "Workshop Kiến trúc Cloud Native",
    flagLabel: "DEVICE_TOKEN_COLLISION (+2đ · Cấm duyệt loạt)",
    riskWeight: 2,
    timestamp: "08:19:47"
  }
];

const BRAND_SWATCHES = [
  { name: "YIT Cobalt", hex: "#3B5BFF", role: "Primary CTA & Focus", swatchClass: "bg-[#3B5BFF]" },
  { name: "Indigo Node", hex: "#5B1AE6", role: "Brand Signature Gradient", swatchClass: "bg-[#5B1AE6]" },
  { name: "FIT Navy", hex: "#1E3A7B", role: "E-Cert & Official Verified", swatchClass: "bg-[#1E3A7B]" },
  { name: "Orbital Cyan", hex: "#0288D1", role: "Live WebSocket & YITBot", swatchClass: "bg-[#0288D1]" },
  { name: "UTE Crimson", hex: "#B91C24", role: "Destructive & Audit Alert", swatchClass: "bg-[#B91C24]" },
  { name: "Stage Obsidian", hex: "#050814", role: "LED Stage & Online Judge", swatchClass: "bg-[#050814]" }
];

export function DesignSystemPage(){
  const [selectedIds, setSelectedIds] = useState([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [lastAuditLog, setLastAuditLog] = useState(null);
  const [mssvInput, setMssvInput] = useState("22110345");

  const columns = [
    {
      key: "studentCode",
      header: "MSSV",
      render: (r) => <span className="tabular-mono font-medium text-foreground">{r.studentCode}</span>
    },
    {
      key: "fullName",
      header: "Họ và tên",
      render: (r) => <span className="font-medium text-foreground">{r.fullName}</span>
    },
    {
      key: "flag",
      header: "Tín hiệu rủi ro",
      render: (r) => (
        <Badge variant={r.riskWeight === 2 ? "danger": "warning"}>{r.flagLabel}</Badge>
      )
    },
    {
      key: "timestamp",
      header: "Giờ quét",
      align: "right",
      render: (r) => <span className="tabular-mono text-muted-foreground">{r.timestamp}</span>
    }
  ];

  return (
    <div className="space-y-8">
      <section className="yit-node-grid rounded-xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <BrandLockup logoClassName="h-12 w-12" wordmarkClassName="h-7" />
            <h1 className="font-display text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Hệ thống Ngôn ngữ Thiết kế YITZone
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Bộ Design Tokens, Typography tiếng Việt (<code className="tabular-mono">Zee Display Medium</code> +{" "}
              <code className="tabular-mono">Inter</code> + <code className="tabular-mono">JetBrains Mono</code>),
              component Radix UI / Shadcn và 4 Layout Shell chuẩn hóa cho 20 phân hệ Đoàn – Hội Khoa CNTT HCM-UTE.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/verify">
                <ShieldCheck className="h-4 w-4" />
                Tra cứu &amp; Xác thực
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <GraduationCap className="h-4 w-4" />
                Student PWA
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">
                <Shield className="h-4 w-4" />
                Admin Shell
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/stage">
                <MonitorPlay className="h-4 w-4" />
                LED Stage 16:9
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Tabs defaultValue="tokens">
        <TabsList>
          <TabsTrigger value="tokens">Màu sắc &amp; Chữ</TabsTrigger>
          <TabsTrigger value="components">Components &amp; Audit</TabsTrigger>
          <TabsTrigger value="table">Hàng chờ Hậu kiểm (SRS)</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BRAND_SWATCHES.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-3.5 rounded-lg border border-border bg-card p-3.5"
              >
                <div className={`h-12 w-12 shrink-0 rounded-md border border-black/10 ${s.swatchClass}`} />
                <div className="min-w-0">
                  <div className="font-display text-base font-medium text-foreground">{s.name}</div>
                  <div className="tabular-mono text-xs text-muted-foreground">{s.hex}</div>
                  <div className="truncate text-xs text-muted-foreground">{s.role}</div>
                </div>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>6 Màu Lịch Tổng hợp &amp; Nhãn Quyền lợi</CardTitle>
              <CardDescription>
                Bảo toàn nguyên vẹn quy ước SRS; mọi nhãn quyền lợi chỉ ghi nhận có cộng, không liệt kê số điểm.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="calFaculty">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Sự kiện Khoa
                </Badge>
                <Badge variant="calDept">Sự kiện nội bộ 4 Ban</Badge>
                <Badge variant="calOffice">Trực / Vệ sinh VP</Badge>
                <Badge variant="calArts">Tổng duyệt Văn nghệ</Badge>
                <Badge variant="calExam">Thi cử / Online Judge</Badge>
                <Badge variant="calDeadline">Hạn chót SV5T / Gây quỹ</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <VerifiedBadge />
                <Badge variant="default">Cộng ĐRL</Badge>
                <Badge variant="info">Cộng CTXH</Badge>
                <Badge variant="success">Cộng CĐDN</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kiểm thử Typography tiếng Việt — Zee Display Medium</CardTitle>
              <CardDescription>
                Kiểm tra độ sắc nét dấu thanh tiếng Việt và độ thẳng hàng của chữ số bảng (tabular-nums).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 border-b border-border pb-4">
                <p className="font-display text-3xl font-medium tracking-tight text-foreground">
                  Đoàn Thanh Niên – Hội Sinh Viên Khoa Công Nghệ Thông Tin
                </p>
                <p className="font-display text-xl font-medium text-foreground">
                  Xét duyệt Danh hiệu Sinh viên 5 tốt · Bỏ phiếu Kín Outbox Shuffle
                </p>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Nội dung thân bài dùng Inter 14px với chiều cao dòng 1.55 giúp đọc thoải mái trên bảng quản trị,
                  biểu mẫu đăng ký và khung trò chuyện YITBot mà không bị cắt dấu mũ tiếng Việt.
                </p>
              </div>
              <div className="flex flex-wrap gap-6 tabular-mono text-sm">
                <div>
                  <span className="block text-xs text-muted-foreground">MSSV 8 số</span>
                  <span className="font-semibold text-foreground">22110345</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground">Mã PIN Hội trường</span>
                  <span className="font-semibold text-primary">482 910</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground">Biên nhận Bỏ phiếu kín</span>
                  <span className="font-semibold text-foreground">VOTE-8492-K7XQ</span>
                </div>
                <div>
                  <span className="block text-xs text-muted-foreground">Thực góp vào quỹ</span>
                  <span className="font-semibold text-status-success">12.450.000đ</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nút bấm &amp; Ô nhập liệu</CardTitle>
              <CardDescription>Radix UI / Shadcn tùy biến theo token YITZone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Button>
                  <QrCode className="h-4 w-4" />
                  Đăng ký tham dự
                </Button>
                <Button variant="secondary">Lưu bản nháp</Button>
                <Button variant="outline">Xuất Excel</Button>
                <Button variant="destructive" onClick={() => setAuditOpen(true)}>
                  <ShieldAlert className="h-4 w-4" />
                  Thử Audit Dialog
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-mssv">Tra cứu nhanh MSSV (8 chữ số)</Label>
                <Input
                  id="demo-mssv"
                  value={mssvInput}
                  onChange={(e) => setMssvInput(e.target.value)}
                  className="tabular-mono"
                  error={
                    !/^[0-9]{8}$/.test(mssvInput)
                      ? "MSSV phải gồm đúng 8 chữ số (VD: 22110345)."
: undefined
                  }
                />
              </div>

              {lastAuditLog && (
                <div className="rounded-md border border-status-success/30 bg-status-success/10 px-3 py-2 text-xs text-status-success">
                  Đã mô phỏng ghi Audit Log: <span className="font-semibold">{lastAuditLog}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ghi chú Nội bộ BCH</CardTitle>
              <CardDescription>
                Phân tách trực quan màu vàng để cán bộ không gửi nhầm ghi chú nội bộ ra cho sinh viên.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InternalBchNote author="Phó Bí thư Đoàn Khoa" timestamp="23:15">
                Đã kiểm tra log điểm danh sự kiện Cloud Native: sinh viên có cờ GPS lệch nhẹ (+1đ),
                đủ điều kiện duyệt bổ sung và cấp E-Certificate.
              </InternalBchNote>
              <div className="rounded-md border border-border bg-muted/50 p-3.5 text-sm text-muted-foreground">
                Khu vực tin nhắn gửi công khai tới sinh viên luôn dùng nền trung tính có huy hiệu{" "}
                <span className="font-semibold text-foreground">[Ban Chấp hành Đoàn - Hội Khoa CNTT]</span>.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-medium text-foreground">
                Hàng chờ Hậu kiểm Điểm danh
              </h2>
              <p className="text-sm text-muted-foreground">
                Cờ nhẹ (+1đ) cho phép chọn duyệt hàng loạt; cờ Tín hiệu Mạnh (+2đ) tự động khóa checkbox hàng loạt.
              </p>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={SAMPLE_REVIEW_QUEUE}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            isRowBulkDisabled={(row) => row.riskWeight === 2}
            bulkActions={
              <Button size="sm" onClick={() => setAuditOpen(true)}>
                Chấp nhận {selectedIds.length} lượt nhẹ
              </Button>
            }
          />
        </TabsContent>
      </Tabs>

      <AuditActionDialog
        open={auditOpen}
        onOpenChange={setAuditOpen}
        title="Xác nhận thao tác có Kiểm toán"
        description="Mọi hành động thu hồi E-Certificate, điểm danh bù hoặc duyệt hậu kiểm đều bắt buộc ghi nhận lý do."
        targetSummary="Hàng chờ hậu kiểm · Workshop Kiến trúc Cloud Native"
        actionCode="ATTENDANCE_REVIEW_DECISION"
        onConfirm={(reason) => {
          setLastAuditLog(reason);
          setSelectedIds([]);
        }}
      />
    </div>
  );
}
