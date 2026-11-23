import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Download, ExternalLink, QrCode } from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentCertRecord {
  id: string;
  certCode: string;
  version: number;
  eventTitle: string;
  semester: "HK1 2026-2027" | "HK2 2025-2026";
  roleLabel: string;
  benefits: ("Cộng ĐRL" | "Cộng CTXH" | "Cộng CĐDN")[];
  issuedDate: string;
}

const SAMPLE_CERTS: StudentCertRecord[] = [
  {
    id: "c-1",
    certCode: "YIT-2026-CLD-0184",
    version: 1,
    eventTitle: "Hội thảo Cloud Native & DevOps 2026",
    semester: "HK1 2026-2027",
    roleLabel: "Tham dự viên",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    issuedDate: "29/11/2026"
  },
  {
    id: "c-2",
    certCode: "YIT-2026-HCK-0042",
    version: 2,
    eventTitle: "UTE Hackathon 2026: Smart Campus",
    semester: "HK1 2026-2027",
    roleLabel: "BTC — MC (Kiêm nhiệm: Văn nghệ)",
    benefits: ["Cộng ĐRL", "Cộng CTXH", "Cộng CĐDN"],
    issuedDate: "15/12/2026"
  },
  {
    id: "c-3",
    certCode: "YIT-2026-MHX-0311",
    version: 1,
    eventTitle: "Chiến dịch Tình nguyện Mùa Hè Xanh FIT",
    semester: "HK2 2025-2026",
    roleLabel: "Chiến sĩ Tình nguyện",
    benefits: ["Cộng CTXH"],
    issuedDate: "20/08/2026"
  }
];

export function MyCertificatesPage(){
  const [semester, setSemester] = useState<string>("ALL");

  const filtered = useMemo(() => (semester === "ALL" ? SAMPLE_CERTS: SAMPLE_CERTS.filter((c) => c.semester === semester)),
    [semester]
  );

  const countDrl = filtered.filter((c) => c.benefits.includes("Cộng ĐRL")).length;
  const countCtxh = filtered.filter((c) => c.benefits.includes("Cộng CTXH")).length;
  const countCddn = filtered.filter((c) => c.benefits.includes("Cộng CĐDN")).length;

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col gap-4 rounded-[26px] p-6 sm:p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Lịch sử Tham gia &amp; Chứng nhận Điện tử
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Thống kê số hoạt động được ghi nhận theo từng loại quyền lợi (chỉ ghi nhận có cộng, không liệt kê số điểm).
          </p>
        </div>

        <div className="w-full sm:w-52">
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger aria-label="Lọc theo học kỳ" className="rounded-full px-4">
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả học kỳ</SelectItem>
              <SelectItem value="HK1 2026-2027">HK1 2026-2027</SelectItem>
              <SelectItem value="HK2 2025-2026">HK2 2025-2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Activity Count Summary by Benefit Type (Strictly no numeric scores) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoạt động có nhãn Cộng ĐRL</CardDescription>
            <CardTitle className="tabular-mono text-2xl text-primary">{countDrl} hoạt động</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoạt động có nhãn Cộng CTXH</CardDescription>
            <CardTitle className="tabular-mono text-2xl text-status-info">{countCtxh} hoạt động</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Hoạt động có nhãn Cộng CĐDN</CardDescription>
            <CardTitle className="tabular-mono text-2xl text-status-success">{countCddn} hoạt động</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Certificates List */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((cert) => (
          <Card key={cert.id} className="flex flex-col justify-between">
            <CardHeader className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <VerifiedBadge label={`E-Cert v${cert.version}`} />
                <span className="tabular-mono text-xs text-muted-foreground">{cert.certCode}</span>
              </div>
              <CardTitle className="text-lg">{cert.eventTitle}</CardTitle>
              <CardDescription>
                {cert.semester} · Tư cách: <strong className="text-foreground">{cert.roleLabel}</strong>Cấp ngày{" "}
                <span className="tabular-mono">{cert.issuedDate}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {cert.benefits.map((b) => (
                  <Badge key={b} variant={b === "Cộng CĐDN" ? "success": b === "Cộng CTXH" ? "info": "default"}>
                    {b}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to={`/verify/${cert.certCode}`}>
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Trang xác thực QR</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
                <Button size="sm" className="rounded-full">
                  <Download className="h-3.5 w-3.5" />
                  <span>Tải PDF E-Cert</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Award className="h-4 w-4 text-brand-navy dark:text-brand-cyan" />
        <span>Trang xác thực QR công khai hoạt động trọn đời, độc lập với trạng thái email trường sau khi sinh viên tốt nghiệp.</span>
      </div>
    </div>
  );
}
