import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Award,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Link2,
  Lock,
  Pin,
  Sparkles,
  UserCheck
} from "lucide-react";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { exportVerifiedCvPdf } from "./api";

const INITIAL_VERIFIED = [
  {
    id: "va-1",
    category: "SV5T",
    title: "Danh hiệu Sinh viên 5 tốt Cấp Trường năm học 2025–2026",
    period: "2025–2026",
    pinned: true,
    cvBullet: "Đạt danh hiệu Sinh viên 5 tốt Cấp Trường, hoàn thành xuất sắc 5 tiêu chí Đạo đức, Học tập, Thể lực, Tình nguyện và Hội nhập.",
    aiSuggestions: {
      vi: "Đạt danh hiệu Sinh viên 5 tốt Cấp Trường (Top 3% sinh viên Khoa CNTT), duy trì GPA ≥ 3.6 và tích lũy hơn 15 ngày CTXH xác thực.",
      en: "Awarded University-level Five-Good Student title (Top 3% FIT cohort), maintaining 3.6+ GPA alongside 15+ verified community service days."
    }
  },
  {
    id: "va-2",
    category: "BTC Sự kiện",
    title: "Trưởng Ban Tổ chức — FIT Tech Talk: Distributed Systems",
    period: "10/2026",
    pinned: true,
    cvBullet: "Điều phối 25 thành viên BTC và hơn 350 sinh viên tham dự hội thảo chuyên đề Hệ thống Phân tán.",
    aiSuggestions: {
      vi: "Chủ trì điều phối 25 nhân sự BTC vận hành hội thảo Distributed Systems quy mô 350+ sinh viên, đạt tỷ lệ hài lòng 4.8/5.",
      en: "Led a 25-member organizing committee for the FIT Distributed Systems Tech Talk (350+ attendees, 4.8/5 post-event rating)."
    }
  },
  {
    id: "va-3",
    category: "Online Judge",
    title: "Giải Nhì Kỳ thi Lập trình ICPC FIT HCM-UTE 2026",
    period: "11/2026",
    pinned: true,
    cvBullet: "Giải 7/10 bài thuật toán (Graph, DP, Segment Tree) trong 3 giờ thi đấu theo luật ICPC.",
    aiSuggestions: {
      vi: "Đạt Giải Nhì ICPC cấp Khoa CNTT 2026, giải quyết 7/10 bài toán tối ưu bằng C++20 trong môi trường chấm tự động.",
      en: "2nd Prize, FIT HCM-UTE ICPC Selection 2026 — solved 7/10 algorithmic problems (Graph, DP, Segment Tree) in C++20."
    }
  },
  {
    id: "va-4",
    category: "Chức vụ",
    title: "Ủy viên BCH Đoàn Khoa CNTT — Nhiệm kỳ 2025–2027",
    period: "2025–2027",
    pinned: false,
    cvBullet: "Phụ trách chuyển đổi số quy trình điểm danh và hỗ trợ sinh viên tại Ban Học thuật – SV5T.",
    aiSuggestions: {
      vi: "Ủy viên BCH Đoàn Khoa CNTT, trực tiếp triển khai hạ tầng sự kiện số và hỗ trợ hơn 1.200 đoàn viên, sinh viên.",
      en: "Executive Committee Member, FIT Youth Union — spearheaded digital event operations serving 1,200+ CS students."
    }
  }
];

export function PortfolioEditorPage(){
  const [privacy, setPrivacy] = useState("PRIVATE");
  const [achievements, setAchievements] = useState(INITIAL_VERIFIED);
  const [activeAiId, setActiveAiId] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  // Self-declared profile fields
  const [headline, setHeadline] = useState("Sinh viên năm 3 Kỹ thuật Phần mềm · Backend & Distributed Systems");
  const [objective, setObjective] = useState(
    "Tìm kiếm vị trí thực tập Software Engineer tập trung vào kiến trúc dịch vụ, hệ thống chịu tải cao và tối ưu hiệu năng."
  );
  const [skills, setSkills] = useState("Java 21, Spring Boot, TypeScript, React, PostgreSQL, Redis, Docker");
  const [projects, setProjects] = useState(
    "YITZone Platform — Hệ thống điều hành Đoàn - Hội & Online Judge cho Khoa CNTT HCM-UTE."
  );
  const [githubUrl, setGithubUrl] = useState("https://github.com/tranducthinh-fit");

  const pinnedAchievements = achievements.filter((a) => a.pinned);
  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin: "https://yitzone.fit.hcmute.edu.vn"}/p/22110418?mode=cv-verify`;

  const togglePin = (id) => {
    setAchievements((prev) => prev.map((a) => (a.id === id ? {...a, pinned: !a.pinned }: a)));
  };

  const applyAiSuggestion = (id, text) => {
    setAchievements((prev) => prev.map((a) => (a.id === id ? {...a, cvBullet: text }: a)));
    setActiveAiId(null);
  };

  return (
    <div className="space-y-6">
      {/* Liquid Glass Top Container */}
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Hồ sơ Năng lực Số &amp; Xuất CV PDF (E-Portfolio)
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Tự động tổng hợp thành tích xác thực từ Đoàn - Hội Khoa CNTT, tách biệt rõ với thông tin tự kê khai và gắn mã QR kiểm chứng độc lập trên CV PDF.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <div className="w-48">
              <Select value={privacy} onValueChange={(v) => setPrivacy(v)}>
                <SelectTrigger aria-label="Quyền riêng tư E-Portfolio" className="h-9 rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">Riêng tư (Mặc định)</SelectItem>
                  <SelectItem value="LINK_ONLY">Chỉ người có Link/QR</SelectItem>
                  <SelectItem value="PUBLIC">Công khai toàn cầu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/p/22110418">
                <ExternalLink className="h-4 w-4" />
                <span>Xem trang /p/22110418</span>
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              className="liquid-glass-btn-cobalt rounded-full px-5"
              onClick={() => setPdfOpen(true)}
            >
              <Download className="h-4 w-4" />
              <span>Xuất CV PDF</span>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Editor Column */}
        <div className="space-y-6 lg:col-span-7">
          <Card className="rounded-[20px]">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-brand-navy dark:text-brand-cyan" />
                  Thành tích Xác thực Tự động
                </CardTitle>
                <VerifiedBadge />
              </div>
              <CardDescription>
                Chọn ghim hoặc ẩn từng thành tích trên CV và dùng AI gợi ý cách diễn đạt song ngữ Việt / Anh (đã khử định danh).
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3.5">
              {achievements.map((item) => (
                <div
                  key={item.id}
                  className="space-y-2.5 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="rounded-full text-[11px]">
                          {item.category}
                        </Badge>
                        <span className="tabular-mono text-xs text-muted-foreground">{item.period}</span>
                      </div>
                      <div className="font-medium text-sm text-foreground">{item.title}</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setActiveAiId(activeAiId === item.id ? null: item.id)}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
                        Gợi ý CV (AI)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={item.pinned ? "default": "outline"}
                        className="rounded-full"
                        onClick={() => togglePin(item.id)}
                      >
                        {item.pinned ? <Eye className="h-3.5 w-3.5" />: <EyeOff className="h-3.5 w-3.5" />}
                        {item.pinned ? "Đang ghim": "Đang ẩn"}
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">{item.cvBullet}</p>

                  {activeAiId === item.id && (
                    <div className="space-y-2 rounded-xl border border-brand-cyan/30 bg-brand-cyan/8 p-3 text-xs">
                      <div className="font-semibold text-foreground">
                        Chọn 1 trong 2 phương án diễn đạt CV (Việt / Anh):
                      </div>
                      <button
                        type="button"
                        onClick={() => applyAiSuggestion(item.id, item.aiSuggestions.vi)}
                        className="block w-full rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-primary"
                      >
                        <span className="font-semibold text-primary">Tiếng Việt: </span>
                        {item.aiSuggestions.vi}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAiSuggestion(item.id, item.aiSuggestions.en)}
                        className="block w-full rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-primary"
                      >
                        <span className="font-semibold text-primary">English: </span>
                        {item.aiSuggestions.en}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[20px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5 text-primary" />
                Thông tin Tự kê khai (Biên tập cá nhân)
              </CardTitle>
              <CardDescription>
                Hiển thị tách biệt rõ ràng với khối Thành tích Xác thực trên trang công khai và bản CV PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="pf-headline">Tiêu đề nghề nghiệp</Label>
                <Input id="pf-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-obj">Mục tiêu nghề nghiệp</Label>
                <Textarea id="pf-obj" rows={2} value={objective} onChange={(e) => setObjective(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-skills">Kỹ năng chuyên môn</Label>
                <Input id="pf-skills" value={skills} onChange={(e) => setSkills(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-proj">Dự án cá nhân tiêu biểu</Label>
                <Textarea id="pf-proj" rows={2} value={projects} onChange={(e) => setProjects(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-gh">GitHub / LinkedIn</Label>
                <Input id="pf-gh" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="tabular-mono" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Live CV Preview */}
        <div className="lg:col-span-5">
          <div className="liquid-glass-card sticky top-20 space-y-5 rounded-[20px] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-medium text-foreground">Trần Đức Thịnh</h2>
                <p className="tabular-mono text-xs text-muted-foreground">22110418 · Khoa CNTT HCM-UTE</p>
                <p className="mt-1 text-xs font-medium text-primary">{headline}</p>
              </div>
              <Badge variant={privacy === "PUBLIC" ? "success": privacy === "LINK_ONLY" ? "info": "secondary"} className="rounded-full">
                {privacy === "PUBLIC" ? (
                  <>
                    <Globe className="h-3 w-3" />
                    Công khai
                  </>
                ): privacy === "LINK_ONLY" ? (
                  <>
                    <Link2 className="h-3 w-3" />
                    Link/QR
                  </>
                ): (
                  <>
                    <Lock className="h-3 w-3" />
                    Riêng tư
                  </>
                )}
              </Badge>
            </div>

            <div className="space-y-2 rounded-xl border border-brand-navy/25 bg-card/90 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Thành tích Xác thực ({pinnedAchievements.length})
                </span>
                <VerifiedBadge label="Xác thực FIT" className="px-2 py-0.5 text-[10px]" />
              </div>
              <ul className="space-y-2 pt-1 text-xs text-muted-foreground">
                {pinnedAchievements.map((a) => (
                  <li key={a.id} className="flex items-start gap-2">
                    <Pin className="mt-0.5 h-3 w-3 shrink-0 text-brand-navy dark:text-brand-cyan" />
                    <div>
                      <div className="font-medium text-foreground">{a.title}</div>
                      <div className="mt-0.5 leading-relaxed">{a.cvBullet}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 rounded-xl border border-border/80 bg-card/85 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Thông tin Tự kê khai</span>
                <Badge variant="outline" className="text-[10px]">Sinh viên tự biên tập</Badge>
              </div>
              <p className="leading-relaxed text-muted-foreground">{objective}</p>
              <div className="pt-1 font-medium text-foreground">Kỹ năng: <span className="font-normal text-muted-foreground">{skills}</span></div>
              <div className="font-medium text-foreground">Dự án: <span className="font-normal text-muted-foreground">{projects}</span></div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/90 p-4">
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-foreground">Mã QR Kiểm chứng CV Độc lập</div>
                <p className="leading-relaxed text-muted-foreground">
                  Nhà tuyển dụng quét mã này vẫn xác thực được chứng nhận in trên CV ngay cả khi hồ sơ để Riêng tư.
                </p>
              </div>
              <div className="shrink-0 rounded-lg bg-white p-2">
                <QRCodeSVG value={verifyUrl} size={76} level="M" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-status-success" />
              Sẵn sàng Xuất CV PDF Xác thực (≤ 2.0s)
            </DialogTitle>
            <DialogDescription>
              Bản PDF phân tách rõ mục Thành tích Xác thực (có chữ ký số &amp; QR kiểm chứng) với mục Tự kê khai.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-4">
            <div className="rounded-lg bg-white p-2">
              <QRCodeSVG value={verifyUrl} size={88} level="M" />
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground">CV_TranDucThinh_22110418_FIT.pdf</div>
              <div>Bao gồm {pinnedAchievements.length} thành tích xác thực + mã QR kiểm chứng độc lập.</div>
              <div className="tabular-mono text-[11px] text-primary">Trạng thái hồ sơ: {privacy}</div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPdfOpen(false)}>
              Đóng
            </Button>
            <Button
              type="button"
              onClick={async () => {
                try {
                  await exportVerifiedCvPdf();
                } catch {
                  // Fallback to local browser print preview
                }
                setPdfOpen(false);
                window.print();
              }}
            >
              <Download className="h-4 w-4" />
              In / Lưu tệp PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
