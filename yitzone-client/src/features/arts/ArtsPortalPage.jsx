import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  FileAudio,
  Film,
  Lock,
  Music,
  Plus,
  Upload,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PROGRAMS = [
  "Đêm Gala Chào Tân Sinh viên FIT 2026",
  "Lễ Tổng kết & Tuyên dương Sinh viên 5 tốt 2026"
];

const INITIAL_ACTS = [
  {
    id: "ART-01",
    order: 1,
    eventName: PROGRAMS[0],
    title: "Mashup Tuổi trẻ Công nghệ",
    genre: "Song/Tốp ca",
    duration: "04:30",
    sourceLabel: "01_MashupTuoiTre_Beat.wav · Link LED Drive",
    performers: ["22110345 Nguyễn Minh Khôi", "23110112 Lê Ngọc Hân"],
    status: "DA_CHOT"
  },
  {
    id: "ART-02",
    order: 2,
    eventName: PROGRAMS[0],
    title: "Cyber Pulse Choreography",
    genre: "Nhảy hiện đại",
    duration: "03:45",
    sourceLabel: "02_CyberPulse_Beat.mp3",
    performers: ["22110418 Trần Đức Thịnh", "24110088 Phạm Khánh Linh"],
    status: "CHO_DUYET"
  }
];

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .slice(0, 24);
}

export function ArtsPortalPage() {
  const [selectedProgram, setSelectedProgram] = useState(PROGRAMS[0]);
  const [acts, setActs] = useState(INITIAL_ACTS);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Đơn ca");
  const [duration, setDuration] = useState("04:00");
  const [sourceLink, setSourceLink] = useState("");
  const [performersText, setPerformersText] = useState("");
  const [feedback, setFeedback] = useState(null);

  const visibleActs = acts.filter((a) => a.eventName === selectedProgram);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const nextOrder = visibleActs.length + 1;
    const prefix = String(nextOrder).padStart(2, "0");
    const slug = slugify(title.trim()) || "TietMuc";

    setActs((prev) => [
      ...prev,
      {
        id: `ART-${Date.now()}`,
        order: nextOrder,
        eventName: selectedProgram,
        title: title.trim(),
        genre,
        duration: duration.trim() || "04:00",
        sourceLabel: sourceLink.trim() || `${prefix}_${slug}_Beat.mp3`,
        performers: performersText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        status: "CHO_DUYET"
      }
    ]);
    setTitle("");
    setSourceLink("");
    setPerformersText("");
    setFeedback(`Đã nộp tiết mục #${prefix} cho chương trình "${selectedProgram}".`);
  };

  return (
    <div className="space-y-6">
      <section className="liquid-glass relative overflow-hidden rounded-[26px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <h1 className="font-display text-3xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Nộp Tiết mục Văn nghệ (ARTIT)
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Gửi danh sách tiết mục, file/link source nhạc nền &amp; video LED và danh sách sinh viên biểu diễn cho từng chương trình của Khoa.
            </p>
          </div>
          <div className="w-full shrink-0 sm:w-80">
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger aria-label="Chọn chương trình">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {feedback && (
        <div className="flex items-center gap-2 rounded-2xl border border-status-success/35 bg-status-success/10 px-4 py-2.5 text-sm font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="rounded-[20px] lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-cal-arts" />
              Nộp Tiết mục Mới
            </CardTitle>
            <CardDescription>
              Điền thông tin tiết mục, đính kèm source nhạc/LED và danh sách sinh viên biểu diễn (nếu có).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="art-title">Tên tiết mục</Label>
                <Input
                  id="art-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Giai điệu Tự hào FIT"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Thể loại</Label>
                  <Select value={genre} onValueChange={(v) => setGenre(v)}>
                    <SelectTrigger aria-label="Thể loại tiết mục">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Đơn ca">Đơn ca</SelectItem>
                      <SelectItem value="Song/Tốp ca">Song/Tốp ca</SelectItem>
                      <SelectItem value="Nhảy hiện đại">Nhảy hiện đại</SelectItem>
                      <SelectItem value="Nhạc cụ">Nhạc cụ</SelectItem>
                      <SelectItem value="Kịch">Kịch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="art-duration">Thời lượng</Label>
                  <Input
                    id="art-duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="tabular-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="art-source">Source nhạc Beat / Video LED (tên file hoặc link Drive)</Label>
                <Input
                  id="art-source"
                  value={sourceLink}
                  onChange={(e) => setSourceLink(e.target.value)}
                  placeholder="VD: https://drive.google.com/... hoặc Beat.wav"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="art-cast">Danh sách sinh viên biểu diễn (tùy chọn, cách nhau bằng dấu phẩy)</Label>
                <Input
                  id="art-cast"
                  value={performersText}
                  onChange={(e) => setPerformersText(e.target.value)}
                  placeholder="VD: 22110418 Trần Đức Thịnh, 23110112 Lê Ngọc Hân"
                />
              </div>

              <Button type="submit" className="liquid-glass-btn-cobalt w-full rounded-full">
                <Plus className="h-4 w-4" />
                Nộp tiết mục
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3.5 lg:col-span-7">
          {visibleActs.length === 0 ? (
            <Card className="rounded-[20px]">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Chưa có tiết mục nào được nộp cho chương trình này.
              </CardContent>
            </Card>
          ) : (
            visibleActs.map((act) => (
              <Card key={act.id} className="rounded-[20px]">
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="calArts" className="rounded-full tabular-mono">
                          #{String(act.order).padStart(2, "0")} · {act.genre}
                        </Badge>
                        <span className="tabular-mono text-xs text-muted-foreground">{act.duration}</span>
                      </div>
                      <h2 className="font-display text-lg font-medium text-foreground">{act.title}</h2>
                    </div>

                    {act.status === "DA_CHOT" ? (
                      <Badge variant="success">
                        <Lock className="h-3 w-3" />
                        Đã chốt
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Chờ duyệt</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/35 px-3.5 py-2.5 text-xs">
                    <span className="inline-flex items-center gap-2 tabular-mono text-foreground">
                      {act.sourceLabel.includes("LED") || act.sourceLabel.includes("http") ? (
                        <Film className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <FileAudio className="h-3.5 w-3.5 text-primary" />
                      )}
                      {act.sourceLabel}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      disabled={act.status === "DA_CHOT"}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {act.status === "DA_CHOT" ? "Đã khóa" : "Đổi source"}
                    </Button>
                  </div>

                  {act.performers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {act.performers.map((p) => (
                        <Badge key={p} variant="outline" className="rounded-full font-normal">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/calendar">Xem lịch chương trình</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
