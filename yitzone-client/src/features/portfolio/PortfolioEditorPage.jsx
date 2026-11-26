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
import { useAuthStore } from "@/stores/auth-store";
import { exportVerifiedCvPdf } from "./api";

const INITIAL_VERIFIED = [];

export function PortfolioEditorPage() {
  const fullName = useAuthStore((s) => s.fullName) || "Sinh viên YITZone";
  const userId = useAuthStore((s) => s.userId) || "";
  const email = useAuthStore((s) => s.email) || "";

  const [privacy, setPrivacy] = useState("PRIVATE");
  const [achievements, setAchievements] = useState(INITIAL_VERIFIED);
  const [activeAiId, setActiveAiId] = useState(null);
  const [pdfOpen, setPdfOpen] = useState(false);

  const [headline, setHeadline] = useState("");
  const [objective, setObjective] = useState("");
  const [skills, setSkills] = useState("");
  const [projects, setProjects] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  const profileSlug = userId || "me";
  const pinnedAchievements = achievements.filter((a) => a.pinned);
  const verifyUrl = `${
    typeof window !== "undefined" ? window.location.origin : "https://yitzone.fit.hcmute.edu.vn"
  }/p/${encodeURIComponent(profileSlug)}?mode=cv-verify`;

  const togglePin = (id) => {
    setAchievements((prev) => prev.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)));
  };

  const applyAiSuggestion = (id, text) => {
    setAchievements((prev) => prev.map((a) => (a.id === id ? { ...a, cvBullet: text } : a)));
    setActiveAiId(null);
  };

  return (
    <div className="space-y-6">
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
            {userId && (
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to={`/p/${encodeURIComponent(userId)}`}>
                  <ExternalLink className="h-4 w-4" />
                  <span>Xem trang /p/{userId}</span>
                </Link>
              </Button>
            )}
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
              {achievements.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-xs text-muted-foreground">
                  Chưa có thành tích xác thực nào. Khi bạn nhận E-Certificate sự kiện, tham gia BTC hoặc đạt danh hiệu SV5T, dữ liệu sẽ tự động đồng bộ vào đây.
                </div>
              ) : (
                achievements.map((item) => (
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
                        <div className="text-sm font-medium text-foreground">{item.title}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.aiSuggestions && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setActiveAiId(activeAiId === item.id ? null : item.id)}
                          >
                            <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
                            Gợi ý CV (AI)
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant={item.pinned ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => togglePin(item.id)}
                        >
                          {item.pinned ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {item.pinned ? "Đang ghim" : "Đang ẩn"}
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground">{item.cvBullet}</p>

                    {activeAiId === item.id && item.aiSuggestions && (
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
                ))
              )}
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
                <Input
                  id="pf-headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="VD: Sinh viên Kỹ thuật Phần mềm · Backend Developer"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-obj">Mục tiêu nghề nghiệp</Label>
                <Textarea
                  id="pf-obj"
                  rows={2}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="Mô tả ngắn định hướng thực tập hoặc công việc của bạn..."
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-skills">Kỹ năng chuyên môn</Label>
                <Input
                  id="pf-skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="VD: Java, TypeScript, React, PostgreSQL, Docker"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-proj">Dự án cá nhân tiêu biểu</Label>
                <Textarea
                  id="pf-proj"
                  rows={2}
                  value={projects}
                  onChange={(e) => setProjects(e.target.value)}
                  placeholder="Tóm tắt dự án cá nhân hoặc đồ án môn học nổi bật..."
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-gh">GitHub / LinkedIn</Label>
                <Input
                  id="pf-gh"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="tabular-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <div className="liquid-glass-card sticky top-20 space-y-5 rounded-[20px] p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-medium text-foreground">{fullName}</h2>
                <p className="tabular-mono text-xs text-muted-foreground">
                  {[userId, email].filter(Boolean).join(" · ") || "Khoa CNTT HCM-UTE"}
                </p>
                {headline && <p className="mt-1 text-xs font-medium text-primary">{headline}</p>}
              </div>
              <Badge
                variant={privacy === "PUBLIC" ? "success" : privacy === "LINK_ONLY" ? "info" : "secondary"}
                className="rounded-full"
              >
                {privacy === "PUBLIC" ? (
                  <>
                    <Globe className="h-3 w-3" />
                    Công khai
                  </>
                ) : privacy === "LINK_ONLY" ? (
                  <>
                    <Link2 className="h-3 w-3" />
                    Link/QR
                  </>
                ) : (
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
              {pinnedAchievements.length === 0 ? (
                <p className="pt-1 text-xs text-muted-foreground">
                  Chưa có thành tích xác thực nào được ghim trên CV.
                </p>
              ) : (
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
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-border/80 bg-card/85 p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Thông tin Tự kê khai</span>
                <Badge variant="outline" className="text-[10px]">Sinh viên tự biên tập</Badge>
              </div>
              {objective || skills || projects || githubUrl ? (
                <>
                  {objective && <p className="leading-relaxed text-muted-foreground">{objective}</p>}
                  {skills && (
                    <div className="pt-1 font-medium text-foreground">
                      Kỹ năng: <span className="font-normal text-muted-foreground">{skills}</span>
                    </div>
                  )}
                  {projects && (
                    <div className="font-medium text-foreground">
                      Dự án: <span className="font-normal text-muted-foreground">{projects}</span>
                    </div>
                  )}
                  {githubUrl && (
                    <div className="tabular-mono text-[11px] text-primary">{githubUrl}</div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  Chưa kê khai thông tin kỹ năng hoặc dự án cá nhân.
                </p>
              )}
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
              <div className="font-semibold text-foreground">
                CV_{userId || "YITZone"}_FIT.pdf
              </div>
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
