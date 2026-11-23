import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  Calendar as CalendarIcon,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Flag,
  Laptop,
  List,
  MapPin,
  Music,
  QrCode,
  ShieldAlert,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type CalCategory = "FACULTY" | "DEPT" | "OFFICE" | "ARTS" | "EXAM" | "DEADLINE";
type CalViewMode = "month" | "week" | "agenda";
type CalScopeMode = "MINE" | "FACULTY_ALL";

interface CalendarActivity {
  id: string;
  title: string;
  category: CalCategory;
  date: string; // YYYY-MM-DD (Nov 2026)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  unitLabel: string;
  inMyCalendar: boolean;
  benefits?: string[];
  actionLabel: string;
  actionTo?: string;
  actionKind: "REGISTER" | "SCAN_QR" | "DUTY_CHECKIN" | "DUTY_SWAP" | "ENTER_EXAM" | "OPEN_LINK";
  description: string;
}

const CATEGORY_META: Record<
  CalCategory,
  {
    label: string;
    shortLabel: string;
    badgeVariant: "calFaculty" | "calDept" | "calOffice" | "calArts" | "calExam" | "calDeadline";
    dotClass: string;
    tintClass: string;
    icon: typeof CalendarDays;
  }
> = {
  FACULTY: {
    label: "Sự kiện Khoa",
    shortLabel: "SK Khoa",
    badgeVariant: "calFaculty",
    dotClass: "bg-cal-faculty",
    tintClass: "border-cal-faculty/30 bg-cal-faculty/10 text-cal-faculty",
    icon: CalendarDays
  },
  DEPT: {
    label: "Nội bộ 4 Ban",
    shortLabel: "Nội bộ Ban",
    badgeVariant: "calDept",
    dotClass: "bg-cal-dept",
    tintClass: "border-cal-dept/30 bg-cal-dept/10 text-cal-dept",
    icon: Users
  },
  OFFICE: {
    label: "Trực / Vệ sinh VP",
    shortLabel: "Trực VP",
    badgeVariant: "calOffice",
    dotClass: "bg-cal-office",
    tintClass: "border-cal-office/30 bg-cal-office/10 text-cal-office",
    icon: Clock
  },
  ARTS: {
    label: "Tổng duyệt / Văn nghệ",
    shortLabel: "Văn nghệ",
    badgeVariant: "calArts",
    dotClass: "bg-cal-arts",
    tintClass: "border-cal-arts/30 bg-cal-arts/10 text-cal-arts",
    icon: Music
  },
  EXAM: {
    label: "Thi cử / Online Judge",
    shortLabel: "Thi / OJ",
    badgeVariant: "calExam",
    dotClass: "bg-cal-exam",
    tintClass: "border-cal-exam/30 bg-cal-exam/10 text-cal-exam",
    icon: Laptop
  },
  DEADLINE: {
    label: "Hạn chót SV5T / Gây quỹ",
    shortLabel: "Hạn chót",
    badgeVariant: "calDeadline",
    dotClass: "bg-cal-deadline",
    tintClass: "border-cal-deadline/30 bg-cal-deadline/10 text-cal-deadline",
    icon: Flag
  }
};

const INITIAL_ACTIVITIES: CalendarActivity[] = [
  {
    id: "cal-1",
    title: "Hội thảo Cloud Native & DevOps 2026",
    category: "FACULTY",
    date: "2026-11-21",
    startTime: "08:00",
    endTime: "11:30",
    location: "Hội trường lớn Khu A",
    unitLabel: "Đoàn – Hội Khoa CNTT",
    inMyCalendar: true,
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    actionLabel: "Quét QR điểm danh",
    actionTo: "/scanner",
    actionKind: "SCAN_QR",
    description: "Chuyên đề kiến trúc Kubernetes và CI/CD thực chiến cùng kỹ sư doanh nghiệp."
  },
  {
    id: "cal-2",
    title: "Ca trực Văn phòng #3 (Thứ 7)",
    category: "OFFICE",
    date: "2026-11-21",
    startTime: "10:00",
    endTime: "12:00",
    location: "Văn phòng Đoàn – Hội A1-204",
    unitLabel: "Ban Văn phòng (OFIT)",
    inMyCalendar: true,
    actionLabel: "Điểm danh ca trực",
    actionTo: "/office-duty",
    actionKind: "DUTY_CHECKIN",
    description: "Ca trực cố định buổi sáng; tự động mở tạm quyền phát vật phẩm tại bàn trực sau khi check-in."
  },
  {
    id: "cal-3",
    title: "Họp giao ban nội bộ Ban Văn phòng (OFIT)",
    category: "DEPT",
    date: "2026-11-22",
    startTime: "19:30",
    endTime: "21:00",
    location: "Phòng họp A1-204 / Google Meet",
    unitLabel: "Cô lập riêng Ban OFIT",
    inMyCalendar: true,
    actionLabel: "Mở lịch trực VP",
    actionTo: "/office-duty",
    actionKind: "OPEN_LINK",
    description: "Tổng kết chuyên cần tháng 11 và phân công bàn giao thiết bị Hackathon."
  },
  {
    id: "cal-4",
    title: "Tổng duyệt Văn nghệ Chào Tân Sinh viên",
    category: "ARTS",
    date: "2026-11-23",
    startTime: "17:30",
    endTime: "20:00",
    location: "Sân khấu Hội trường A",
    unitLabel: "Ban Văn nghệ (ARTIT)",
    inMyCalendar: true,
    actionLabel: "Xem chi tiết tiết mục",
    actionTo: "/modules",
    actionKind: "OPEN_LINK",
    description: "Chạy khớp nhạc Beat, màn hình LED và danh sách đạo cụ sân khấu."
  },
  {
    id: "cal-5",
    title: "Vòng loại Trắc nghiệm Pháp luật & Quy chế SV",
    category: "EXAM",
    date: "2026-11-24",
    startTime: "14:00",
    endTime: "15:00",
    location: "Trực tuyến (Fullscreen Monitor)",
    unitLabel: "Ban Học thuật & Nghiên cứu",
    inMyCalendar: true,
    benefits: ["Cộng ĐRL"],
    actionLabel: "Vào phòng thi",
    actionTo: "/modules",
    actionKind: "ENTER_EXAM",
    description: "Đề 30 câu trắc nghiệm ngẫu nhiên, thời gian 45 phút, tự động nộp khi hết giờ."
  },
  {
    id: "cal-6",
    title: "Hạn chót nộp hồ sơ SV5T & Đợt bán Hoodie Gây quỹ",
    category: "DEADLINE",
    date: "2026-11-25",
    startTime: "23:00",
    endTime: "23:59",
    location: "Cổng trực tuyến YITZone",
    unitLabel: "Hội đồng SV5T & Thủ quỹ",
    inMyCalendar: true,
    actionLabel: "Mở Cửa hàng",
    actionTo: "/store",
    actionKind: "OPEN_LINK",
    description: "Khóa nhận minh chứng ngoài SV5T đợt 1 và chốt đơn đặt may Hoodie Khoa đợt 2."
  },
  {
    id: "cal-7",
    title: "UTE Hackathon 2026: Khai mạc & Chia đội",
    category: "FACULTY",
    date: "2026-11-26",
    startTime: "08:00",
    endTime: "11:30",
    location: "Hội trường lớn Khu A",
    unitLabel: "Đoàn – Hội Khoa CNTT",
    inMyCalendar: false,
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    actionLabel: "Đăng ký tham gia",
    actionKind: "REGISTER",
    description: "Công bố đề bài Smart Campus và kết nối Mentor doanh nghiệp."
  },
  {
    id: "cal-8",
    title: "Ca Vệ sinh Văn phòng Thứ 6",
    category: "OFFICE",
    date: "2026-11-27",
    startTime: "16:50",
    endTime: "17:30",
    location: "Văn phòng Đoàn – Hội A1-204",
    unitLabel: "Ban Văn phòng (OFIT)",
    inMyCalendar: true,
    actionLabel: "Mở Checklist 5 mục",
    actionTo: "/office-duty",
    actionKind: "DUTY_CHECKIN",
    description: "Nối tiếp Ca 6 Thứ 6; hoàn thành Checklist 5 hạng mục và tải ảnh hiện trạng."
  },
  {
    id: "cal-9",
    title: "Workshop Thiết kế hệ thống cùng Alumni FIT",
    category: "FACULTY",
    date: "2026-11-27",
    startTime: "16:30",
    endTime: "18:30",
    location: "Phòng A3-302",
    unitLabel: "Đoàn – Hội Khoa CNTT",
    inMyCalendar: false,
    benefits: ["Cộng ĐRL"],
    actionLabel: "Đăng ký tham gia",
    actionKind: "REGISTER",
    description: "Chia sẻ kinh nghiệm phỏng vấn System Design cho sinh viên năm 3–4."
  }
];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function isOverlapping(a: CalendarActivity, b: CalendarActivity): boolean {
  if (a.id === b.id || a.date !== b.date) return false;
  return toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime);
}

function formatIcsDateTime(dateStr: string, timeStr: string): string {
  return `${dateStr.replace(/-/g, "")}T${timeStr.replace(":", "")}00`;
}

function buildIcsContent(items: CalendarActivity[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//YITZone FIT HCM-UTE//Lich Tong Hop 6 Mau//VI",
    "CALSCALE:GREGORIAN"
  ];
  for (const item of items) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@yitzone.fit.hcmute.edu.vn`,
      `DTSTART;TZID=Asia/Ho_Chi_Minh:${formatIcsDateTime(item.date, item.startTime)}`,
      `DTEND;TZID=Asia/Ho_Chi_Minh:${formatIcsDateTime(item.date, item.endTime)}`,
      `SUMMARY:[${CATEGORY_META[item.category].shortLabel}] ${item.title}`,
      `LOCATION:${item.location}`,
      `DESCRIPTION:${item.description} (${item.unitLabel})`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function triggerIcsDownload(filename: string, items: CalendarActivity[]) {
  const blob = new Blob([buildIcsContent(items)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click;
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const WEEK_DAYS = [
  { date: "2026-11-21", short: "T7", num: "21" },
  { date: "2026-11-22", short: "CN", num: "22" },
  { date: "2026-11-23", short: "T2", num: "23" },
  { date: "2026-11-24", short: "T3", num: "24" },
  { date: "2026-11-25", short: "T4", num: "25" },
  { date: "2026-11-26", short: "T5", num: "26" },
  { date: "2026-11-27", short: "T6", num: "27" }
];

// November 2026 starts on Sunday (index 6 in Mon-Sun grid)
const MONTH_CELLS: Array<{ date: string | null; day: number | null }> = [
...Array.from({ length: 6 }, () => ({ date: null, day: null })),
...Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const padded = String(day).padStart(2, "0");
    return { date: `2026-11-${padded}`, day };
  })
];

export function CalendarPage(){
  const [activities, setActivities] = useState<CalendarActivity[]>(INITIAL_ACTIVITIES);
  const [scope, setScope] = useState<CalScopeMode>("MINE");
  const [viewMode, setViewMode] = useState<CalViewMode>(() =>
    typeof window !== "undefined" && window.innerWidth < 768 ? "agenda" : "week"
  );
  const [activeCategories, setActiveCategories] = useState<CalCategory[]>([
    "FACULTY",
    "DEPT",
    "OFFICE",
    "ARTS",
    "EXAM",
    "DEADLINE"
  ]);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_ACTIVITIES[0]?.id ?? "");
  const [conflictDialog, setConflictDialog] = useState<{
    candidate: CalendarActivity;
    conflictsWith: CalendarActivity;
  } | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const visibleActivities = useMemo(() => {
    return activities.filter((item) => {
      if (scope === "MINE" && !item.inMyCalendar) return false;
      return activeCategories.includes(item.category);
    });
  }, [activities, scope, activeCategories]);

  const myActivities = useMemo(() => activities.filter((item) => item.inMyCalendar),
    [activities]
  );

  // Detect all overlapping pairs in "Lịch Của Tôi" (UC-CAL-02)
  const myConflictIds = useMemo(() => {
    const set = new Set<string>;
    for (let i = 0; i < myActivities.length; i++) {
      const a = myActivities[i];
      if (!a) continue;
      for (let j = i + 1; j < myActivities.length; j++) {
        const b = myActivities[j];
        if (b && isOverlapping(a, b)) {
          set.add(a.id);
          set.add(b.id);
        }
      }
    }
    return set;
  }, [myActivities]);

  const selectedActivity = useMemo(() => activities.find((a) => a.id === selectedId) ?? visibleActivities[0] ?? null,
    [activities, selectedId, visibleActivities]
  );

  const toggleCategory = (cat: CalCategory) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat): [...prev, cat]
    );
  };

  const handleRegisterWithConflictCheck = (candidate: CalendarActivity) => {
    const conflict = myActivities.find((existing) => isOverlapping(existing, candidate));
    if (conflict) {
      setConflictDialog({ candidate, conflictsWith: conflict });
      return;
    }
    setActivities((prev) =>
      prev.map((a) => (a.id === candidate.id ? {...a, inMyCalendar: true }: a))
    );
    setToastNotice(`Đã thêm "${candidate.title}" vào Lịch Của Tôi.`);
  };

  const confirmRegisterDespiteConflict = () => {
    if (!conflictDialog) return;
    const { candidate } = conflictDialog;
    setActivities((prev) =>
      prev.map((a) => (a.id === candidate.id ? {...a, inMyCalendar: true }: a))
    );
    setToastNotice(`Đã đăng ký "${candidate.title}" (có ghi nhận cảnh báo trùng giờ).`);
    setConflictDialog(null);
  };

  const upcoming24h = useMemo(() => myActivities.filter((a) => a.date === "2026-11-21" || a.date === "2026-11-22"),
    [myActivities]
  );
  const upcoming7d = useMemo(() => myActivities.filter((a) => a.date >= "2026-11-23" && a.date <= "2026-11-28"),
    [myActivities]
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <section className="liquid-glass flex flex-col gap-4 rounded-[26px] p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-4xl">
            Lịch Hoạt động
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tổng hợp lịch sự kiện, ca trực, lịch thi và hạn chót phong trào · Tự động cảnh báo đụng lịch và xuất file{" "}
            <span className="tabular-mono">.ics</span> cho điện thoại.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <Tabs value={scope} onValueChange={(v) => setScope(v as CalScopeMode)} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="MINE" className="flex-1 sm:flex-initial">Lịch Của Tôi ({myActivities.length})</TabsTrigger>
              <TabsTrigger value="FACULTY_ALL" className="flex-1 sm:flex-initial">Toàn Khoa &amp; Ban</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="sm"
            className="h-10 w-full rounded-full sm:h-9 sm:w-auto"
            onClick={() => {
              triggerIcsDownload("YITZone-Lich-Cua-Toi.ics", myActivities);
              setToastNotice("Đã tải tệp YITZone-Lich-Cua-Toi.ics để nhập vào Google / Apple Calendar.");
            }}
          >
            <Download className="h-4 w-4" />
            <span>Thêm vào Lịch Điện thoại (.ics)</span>
          </Button>
        </div>
      </section>

      {toastNotice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-sm text-status-success">
          <span className="flex items-center gap-2 font-medium">
            <CalendarCheck2 className="h-4 w-4 shrink-0" />
            {toastNotice}
          </span>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-xs font-semibold underline underline-offset-2"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Conflict Alert Banner (UC-CAL-02) */}
      {myConflictIds.size > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-status-danger/35 bg-status-danger/10 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-status-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <span className="font-semibold">Phát hiện đụng lịch trong Lịch Của Tôi: </span>
              <span>
                Hội thảo Cloud Native &amp; DevOps (08:00–11:30) trùng giờ với Ca trực Văn phòng #3
                (10:00–12:00) ngày <span className="tabular-mono">21/11/2026</span>.
              </span>
            </div>
          </div>
          <Button asChild size="sm" variant="destructive" className="shrink-0">
            <Link to="/office-duty">Xin vắng / Đổi ca bù ngay</Link>
          </Button>
        </div>
      )}

      {/* 6-Color Category Legend & Filter Bar + View Mode Switcher */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-3.5 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="scroll-x-pills flex flex-nowrap items-center gap-2 pb-1 sm:flex-wrap sm:pb-0"
            role="group"
            aria-label="Bộ lọc 6 nguồn lịch"
          >
            {(Object.keys(CATEGORY_META) as CalCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const active = activeCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                    active
                      ? meta.tintClass
: "border-border bg-muted/40 text-muted-foreground opacity-65 hover:opacity-100"
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} />
                  <Icon className="h-3.5 w-3.5" />
                  <span className="sm:hidden">{meta.shortLabel}</span>
                  <span className="hidden sm:inline">{meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Tuần trước">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tabular-mono px-1 text-xs font-semibold">Tháng 11 / 2026</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" aria-label="Tuần sau">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as CalViewMode)}>
              <TabsList>
                <TabsTrigger value="week">Tuần</TabsTrigger>
                <TabsTrigger value="month">Tháng</TabsTrigger>
                <TabsTrigger value="agenda">
                  <List className="mr-1 h-3.5 w-3.5" />
                  Danh sách
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Main Workspace: Calendar Board (8 cols) + Quick Detail & 7-Day Reminders (4 cols) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          {viewMode === "week" && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Tuần 21/11 – 27/11/2026</CardTitle>
                  <span className="text-xs text-muted-foreground">Dữ liệu minh họa · Bấm vào thẻ để thao tác nhanh</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-7">
                  {WEEK_DAYS.map((day) => {
                    const dayItems = visibleActivities.filter((a) => a.date === day.date);
                    const isToday = day.date === "2026-11-21";
                    return (
                      <div
                        key={day.date}
                        className={cn(
                          "flex min-h-[180px] flex-col rounded-lg border p-2.5",
                          isToday ? "border-primary/45 bg-primary/5": "border-border bg-muted/20"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between border-b border-border/70 pb-1.5">
                          <span className="text-xs font-semibold text-muted-foreground">{day.short}</span>
                          <span
                            className={cn(
                              "tabular-mono inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                              isToday ? "bg-primary text-primary-foreground": "text-foreground"
                            )}
                          >
                            {day.num}
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col gap-2">
                          {dayItems.length === 0 ? (
                            <span className="mt-4 text-center text-[11px] text-muted-foreground">
                              Trống lịch
                            </span>
                          ): (
                            dayItems.map((item) => {
                              const meta = CATEGORY_META[item.category];
                              const hasConflict = item.inMyCalendar && myConflictIds.has(item.id);
                              const isSelected = selectedActivity?.id === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setSelectedId(item.id)}
                                  className={cn(
                                    "w-full rounded-md border p-2 text-left transition-all",
                                    meta.tintClass,
                                    isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-card",
                                    hasConflict && "border-status-danger"
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="tabular-mono text-[10px] font-semibold">
                                      {item.startTime}
                                    </span>
                                    {hasConflict && (
                                      <AlertTriangle
                                        className="h-3 w-3 shrink-0 text-status-danger"
                                        aria-label="Trùng giờ"
                                      />
                                    )}
                                  </div>
                                  <div className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-foreground">
                                    {item.title}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === "month" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Lịch Tháng 11 / 2026</CardTitle>
                <CardDescription>Hiển thị trực quan lịch hoạt động theo từng nhóm màu phân loại.</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-semibold text-muted-foreground sm:gap-1.5">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                  {MONTH_CELLS.map((cell, idx) => {
                    if (!cell.date) {
                      return <div key={`empty-${idx}`} className="h-14 rounded-md bg-muted/20 sm:h-20" />;
                    }
                    const items = visibleActivities.filter((a) => a.date === cell.date);
                    const isToday = cell.date === "2026-11-21";
                    const hasSelected = items.some((a) => a.id === selectedActivity?.id);
                    return (
                      <div
                        key={cell.date}
                        onClick={() => {
                          if (items[0]) setSelectedId(items[0].id);
                        }}
                        className={cn(
                          "flex h-14 flex-col rounded-md border p-1 transition-colors sm:h-20 sm:p-1.5",
                          items.length > 0 && "cursor-pointer hover:border-primary/50",
                          isToday ? "border-primary bg-primary/5" : "border-border bg-card",
                          hasSelected && "ring-1 ring-primary"
                        )}
                      >
                        <span
                          className={cn(
                            "tabular-mono text-[11px] font-semibold",
                            isToday ? "text-primary" : "text-muted-foreground"
                          )}
                        >
                          {cell.day}
                        </span>
                        {/* Mobile: compact colored dots */}
                        <div className="mt-auto flex flex-wrap gap-1 sm:hidden">
                          {items.slice(0, 3).map((item) => (
                            <span
                              key={item.id}
                              className={cn("h-2 w-2 rounded-full", CATEGORY_META[item.category].dotClass)}
                            />
                          ))}
                        </div>
                        {/* Tablet/Desktop: titled chips */}
                        <div className="mt-1 hidden flex-col gap-1 overflow-hidden sm:flex">
                          {items.slice(0, 2).map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(item.id);
                              }}
                              className={cn(
                                "truncate rounded px-1 py-0.5 text-left text-[10px] font-semibold",
                                CATEGORY_META[item.category].tintClass
                              )}
                            >
                              {item.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === "agenda" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Danh sách Hoạt động ({visibleActivities.length})</CardTitle>
                <CardDescription>
                  Sắp xếp theo thứ tự thời gian kèm nút thao tác nhanh 1 chạm theo ngữ cảnh.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border p-0">
                {visibleActivities.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Không có hoạt động nào khớp bộ lọc hiện tại.
                  </div>
                ): (
                  visibleActivities.map((item) => {
                    const meta = CATEGORY_META[item.category];
                    const hasConflict = item.inMyCalendar && myConflictIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={cn(
                          "flex cursor-pointer flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between",
                          selectedActivity?.id === item.id && "bg-primary/5"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
                            <span className="tabular-mono text-xs font-medium text-muted-foreground">
                              {item.date.split("-").reverse().join("/")} · {item.startTime}–{item.endTime}
                            </span>
                            {hasConflict && <Badge variant="danger">Đụng lịch</Badge>}
                          </div>
                          <div className="font-medium text-foreground">{item.title}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {item.location}
                            </span>
                            <span>{item.unitLabel}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {item.actionKind === "REGISTER" && !item.inMyCalendar ? (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRegisterWithConflictCheck(item);
                              }}
                            >
                              {item.actionLabel}
                            </Button>
                          ): item.actionTo ? (
                            <Button asChild size="sm" variant="outline">
                              <Link to={item.actionTo} onClick={(e) => e.stopPropagation()}>
                                {item.actionLabel}
                              </Link>
                            </Button>
                          ): null}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Quick Detail Inspector (<=300ms) + 24h / 7-Day Reminders */}
        <div className="space-y-5 lg:col-span-4">
          {selectedActivity && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={CATEGORY_META[selectedActivity.category].badgeVariant}>
                    {CATEGORY_META[selectedActivity.category].label}
                  </Badge>
                  {selectedActivity.inMyCalendar && (
                    <Badge variant="success">Trong Lịch Của Tôi</Badge>
                  )}
                </div>
                <CardTitle className="mt-2 leading-snug">{selectedActivity.title}</CardTitle>
                <CardDescription>{selectedActivity.unitLabel}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg border border-border bg-muted/35 p-3 text-xs">
                  <div className="flex items-center gap-2 text-foreground">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="tabular-mono font-medium">
                      {selectedActivity.date.split("-").reverse().join("/")} · {selectedActivity.startTime} –{" "}
                      {selectedActivity.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{selectedActivity.location}</span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {selectedActivity.description}
                </p>

                {selectedActivity.benefits && selectedActivity.benefits.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedActivity.benefits.map((b) => (
                      <Badge key={b} variant="default">
                        {b}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-1">
                  {selectedActivity.actionKind === "REGISTER" && !selectedActivity.inMyCalendar ? (
                    <Button onClick={() => handleRegisterWithConflictCheck(selectedActivity)}>
                      <CalendarCheck2 className="h-4 w-4" />
                      <span>{selectedActivity.actionLabel}</span>
                    </Button>
                  ): selectedActivity.actionTo ? (
                    <Button asChild>
                      <Link to={selectedActivity.actionTo}>
                        {selectedActivity.actionKind === "SCAN_QR" && <QrCode className="h-4 w-4" />}
                        {selectedActivity.actionKind === "ENTER_EXAM" && <BookOpen className="h-4 w-4" />}
                        <span>{selectedActivity.actionLabel}</span>
                      </Link>
                    </Button>
                  ): null}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      triggerIcsDownload(`${selectedActivity.id}.ics`, [selectedActivity]);
                      setToastNotice(`Đã xuất tệp.ics cho "${selectedActivity.title}".`);
                    }}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Xuất riêng sự kiện này (.ics)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 24h & 7-Day Reminder Panel (UC-CAL-03) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Nhắc việc 24 giờ &amp; 7 ngày tới</CardTitle>
              <CardDescription>Tự động gửi thông báo nhắc trước 30 phút cho ca trực &amp; sự kiện.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  Trong 24 giờ tới ({upcoming24h.length})
                </div>
                <div className="space-y-2">
                  {upcoming24h.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="flex w-full items-start gap-2.5 rounded-lg border border-border p-2.5 text-left transition-colors hover:bg-muted/50"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                          CATEGORY_META[item.category].dotClass
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-foreground">{item.title}</div>
                        <div className="tabular-mono mt-0.5 text-[11px] text-muted-foreground">
                          {item.date.slice(8)}/{item.date.slice(5, 7)} · {item.startTime}–{item.endTime}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  7 ngày tới ({upcoming7d.length})
                </div>
                <div className="space-y-2">
                  {upcoming7d.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className="flex w-full items-start gap-2.5 rounded-lg border border-border p-2.5 text-left transition-colors hover:bg-muted/50"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                          CATEGORY_META[item.category].dotClass
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-foreground">{item.title}</div>
                        <div className="tabular-mono mt-0.5 text-[11px] text-muted-foreground">
                          {item.date.slice(8)}/{item.date.slice(5, 7)} · {item.startTime}–{item.endTime}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Conflict Warning Dialog (UC-CAL-02) */}
      <Dialog open={Boolean(conflictDialog)} onOpenChange={(o) => !o && setConflictDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-status-danger">
              <ShieldAlert className="h-5 w-5" />
              <span>Cảnh báo Đụng lịch Tự động</span>
            </DialogTitle>
            <DialogDescription>
              Hoạt động bạn đang chọn bị trùng khung giờ với một mục đã có trong Lịch Của Tôi.
            </DialogDescription>
          </DialogHeader>

          {conflictDialog && (
            <div className="space-y-3 py-1">
              <div className="rounded-lg border border-status-danger/35 bg-status-danger/10 p-3 text-sm">
                <div className="text-xs font-semibold text-status-danger">Hoạt động đang đăng ký</div>
                <div className="mt-0.5 font-semibold text-foreground">{conflictDialog.candidate.title}</div>
                <div className="tabular-mono mt-0.5 text-xs text-muted-foreground">
                  {conflictDialog.candidate.date.split("-").reverse().join("/")} ·{" "}
                  {conflictDialog.candidate.startTime}–{conflictDialog.candidate.endTime}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <div className="text-xs font-semibold text-muted-foreground">Trùng giờ với mục hiện có</div>
                <div className="mt-0.5 font-semibold text-foreground">
                  {conflictDialog.conflictsWith.title}
                </div>
                <div className="tabular-mono mt-0.5 text-xs text-muted-foreground">
                  {conflictDialog.conflictsWith.date.split("-").reverse().join("/")} ·{" "}
                  {conflictDialog.conflictsWith.startTime}–{conflictDialog.conflictsWith.endTime}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Lưu ý: Hệ thống chặn cứng nếu bạn chọn ca trực bù hoặc đổi ca bị trùng giờ. Với đăng ký sự kiện,
                bạn vẫn có thể xác nhận nếu đã sắp xếp đổi ca trực trước đó.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictDialog(null)}>
              Hủy đăng ký
            </Button>
            <Button variant="destructive" onClick={confirmRegisterDespiteConflict}>
              Vẫn xác nhận đăng ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
