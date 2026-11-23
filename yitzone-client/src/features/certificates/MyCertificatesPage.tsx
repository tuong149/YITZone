import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  ExternalLink,
  QrCode
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";
import { useEventStore } from "@/stores/event-store";
import { useSurveyStore } from "@/stores/survey-store";

interface StudentCertRecord {
  id: string;
  certCode: string;
  version: number;
  eventTitle: string;
  semester: "HK1 2026-2027" | "HK2 2025-2026";
  roleLabel: string;
  benefits: ("Cộng ĐRL" | "Cộng CTXH" | "Cộng CĐDN")[];
  issuedDate: string;
  status: "ISSUED" | "PENDING_SURVEY" | "PENDING_FINALIZE";
  surveyId?: string;
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
    issuedDate: "29/11/2026",
    status: "ISSUED"
  },
  {
    id: "c-2",
    certCode: "YIT-2026-HCK-0042",
    version: 2,
    eventTitle: "UTE Hackathon 2026: Smart Campus",
    semester: "HK1 2026-2027",
    roleLabel: "BTC — MC (Kiêm nhiệm: Văn nghệ)",
    benefits: ["Cộng ĐRL", "Cộng CTXH", "Cộng CĐDN"],
    issuedDate: "15/12/2026",
    status: "ISSUED"
  },
  {
    id: "c-3",
    certCode: "YIT-2026-MHX-0311",
    version: 1,
    eventTitle: "Chiến dịch Tình nguyện Mùa Hè Xanh FIT",
    semester: "HK2 2025-2026",
    roleLabel: "Chiến sĩ Tình nguyện",
    benefits: ["Cộng CTXH"],
    issuedDate: "20/08/2026",
    status: "ISSUED"
  }
];

export function MyCertificatesPage() {
  const [semester, setSemester] = useState<string>("ALL");
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const fullName = useAuthStore((s) => s.fullName) ?? "Nguyễn Minh Khoa";
  const userId = useAuthStore((s) => s.userId) ?? "22110123";
  const events = useEventStore((s) => s.events);
  const registrations = useEventStore((s) => s.registrations);
  const surveys = useSurveyStore((s) => s.surveys);

  const allCerts = useMemo<StudentCertRecord[]>(() => {
    const dynamicItems: StudentCertRecord[] = [];
    for (const [evId, reg] of Object.entries(registrations)) {
      if (!reg) continue;
      const ev = events.find((e) => e.id === evId);
      if (!ev) continue;
      if (SAMPLE_CERTS.some((c) => c.eventTitle === ev.title)) continue;

      const linkedSurvey = surveys.find((sv) => sv.title.includes(ev.title));
      dynamicItems.push({
        id: `dyn-${ev.id}`,
        certCode: `YIT-2026-${ev.id.slice(-3).toUpperCase()}-0299`,
        version: 1,
        eventTitle: ev.title,
        semester: "HK1 2026-2027",
        roleLabel: "Tham dự viên",
        benefits: ev.benefits.filter(
          (b): b is "Cộng ĐRL" | "Cộng CTXH" | "Cộng CĐDN" =>
            b === "Cộng ĐRL" || b === "Cộng CTXH" || b === "Cộng CĐDN"
        ),
        issuedDate: ev.dateSummary,
        status: "PENDING_SURVEY",
        surveyId: linkedSurvey?.id ?? ev.id
      });
    }

    // Also include one pending-survey card by default so student sees the E-Cert survey unlock flow clearly
    if (!dynamicItems.some((d) => d.status === "PENDING_SURVEY")) {
      dynamicItems.unshift({
        id: "c-pending-survey",
        certCode: "YIT-2026-SEC-0118",
        version: 1,
        eventTitle: "Tọa đàm An toàn Thông tin & Bảo vệ Dữ liệu Cá nhân 2026",
        semester: "HK1 2026-2027",
        roleLabel: "Tham dự viên (Đã điểm danh đủ 2 lượt)",
        benefits: ["Cộng ĐRL", "Cộng CĐDN"],
        issuedDate: "Chờ hoàn tất khảo sát",
        status: "PENDING_SURVEY",
        surveyId: "evt-cloud-2026"
      });
    }

    return [...dynamicItems, ...SAMPLE_CERTS];
  }, [registrations, events, surveys]);

  const filtered = useMemo(
    () => (semester === "ALL" ? allCerts : allCerts.filter((c) => c.semester === semester)),
    [semester, allCerts]
  );

  const issuedOnly = filtered.filter((c) => c.status === "ISSUED");
  const countDrl = issuedOnly.filter((c) => c.benefits.includes("Cộng ĐRL")).length;
  const countCtxh = issuedOnly.filter((c) => c.benefits.includes("Cộng CTXH")).length;
  const countCddn = issuedOnly.filter((c) => c.benefits.includes("Cộng CĐDN")).length;

  const handleDownloadEcertPdf = (cert: StudentCertRecord) => {
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>E-Certificate ${cert.certCode}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background: #0b1636; color: #0f172a; padding: 32px; }
  .sheet { max-width: 820px; margin: 0 auto; background: #ffffff; border: 8px double #1d4ed8; border-radius: 20px; padding: 48px; text-align: center; }
  .org { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #1d4ed8; }
  h1 { font-size: 32px; margin: 16px 0 8px; color: #0b1636; }
  .recipient { font-size: 24px; font-weight: 700; color: #1e3a8a; margin: 18px 0 6px; }
  .meta { font-size: 14px; color: #475569; margin-bottom: 20px; }
  .event { font-size: 20px; font-weight: 600; color: #0f172a; margin: 12px 0; }
  .badges { display: inline-flex; gap: 8px; margin: 14px 0 24px; }
  .badge { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .footer { display: flex; justify-content: space-between; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="org">Đoàn TN – Hội SV Khoa Công nghệ Thông tin · Trường ĐH Sư phạm Kỹ thuật TP.HCM</div>
    <h1>GIẤY CHỨNG NHẬN ĐIỆN TỬ (E-CERTIFICATE)</h1>
    <div class="recipient">${fullName} (${userId})</div>
    <div class="meta">Tư cách ghi nhận: <strong>${cert.roleLabel}</strong> · Học kỳ: ${cert.semester}</div>
    <div class="event">${cert.eventTitle}</div>
    <div class="badges">
      ${cert.benefits.map((b) => `<span class="badge">${b}</span>`).join("")}
    </div>
    <div class="footer">
      <span>Mã chứng nhận: <strong>${cert.certCode} (v${cert.version})</strong></span>
      <span>Ngày cấp: ${cert.issuedDate}</span>
      <span>Xác thực công khai: /verify/${cert.certCode}</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cert.certCode}-ECertificate.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadNotice(`Đã tải xuống bản in E-Certificate mã ${cert.certCode} (v${cert.version}).`);
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass flex flex-col gap-4 rounded-[26px] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
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

      {downloadNotice && (
        <div className="flex items-center gap-2 rounded-2xl border border-status-success/35 bg-status-success/10 px-4 py-3 text-xs font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

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
                {cert.status === "ISSUED" ? (
                  <VerifiedBadge label={`E-Cert v${cert.version}`} />
                ) : (
                  <Badge variant="warning" className="gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Chờ khảo sát để mở khóa E-Cert</span>
                  </Badge>
                )}
                <span className="tabular-mono text-xs text-muted-foreground">{cert.certCode}</span>
              </div>
              <CardTitle className="text-lg">{cert.eventTitle}</CardTitle>
              <CardDescription>
                {cert.semester} · Tư cách: <strong className="text-foreground">{cert.roleLabel}</strong> ·{" "}
                <span className="tabular-mono">{cert.issuedDate}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {cert.benefits.map((b) => (
                  <Badge
                    key={b}
                    variant={b === "Cộng CĐDN" ? "success" : b === "Cộng CTXH" ? "info" : "default"}
                  >
                    {b}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {cert.status === "PENDING_SURVEY" ? (
                  <Button asChild size="sm" className="liquid-glass-btn-cobalt rounded-full">
                    <Link to={`/surveys/${cert.surveyId ?? "evt-cloud-2026"}`}>
                      <ClipboardList className="h-3.5 w-3.5" />
                      <span>Làm khảo sát ngay để mở E-Cert</span>
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="sm" variant="outline" className="rounded-full">
                      <Link to={`/verify/${cert.certCode}`}>
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Trang xác thực QR</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleDownloadEcertPdf(cert)}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Tải bản in E-Cert</span>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Award className="h-4 w-4 text-brand-navy dark:text-brand-cyan" />
        <span>
          Trang xác thực QR công khai hoạt động trọn đời, độc lập với trạng thái email trường sau khi sinh viên tốt nghiệp.
        </span>
      </div>
    </div>
  );
}
