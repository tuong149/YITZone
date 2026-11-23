import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  ExternalLink,
  KeyRound,
  Lock,
  MessageSquareMore,
  MonitorPlay,
  Music,
  Pencil,
  QrCode,
  ScanLine,
  ShieldAlert,
  Trophy,
  Unlock,
  Users,
  Vote
} from "lucide-react";
import { AuditActionDialog } from "@/components/ui/audit-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CertificateAdminPage } from "@/features/certificates/CertificateAdminPage";
import { CompetitionAdminPage } from "@/features/competitions/CompetitionAdminPage";
import { EventCreatePage } from "@/features/events/EventCreatePage";
import { LiveQaAdminPage } from "@/features/liveqa/LiveQaAdminPage";
import { SurveyAdminPage } from "@/features/surveys/SurveyAdminPage";
import { VotingAdminPage } from "@/features/voting/VotingAdminPage";
import { useEventStore } from "@/stores/event-store";

interface ManagedEventRecord {
  id: string;
  title: string;
  scope: "FACULTY" | "DEPT_INTERNAL";
  status: "DRAFT" | "PENDING_BTV" | "PUBLISHED" | "REG_CLOSED" | "ONGOING" | "COMPLETED";
  capacity: number; // 0 = không giới hạn
  registeredCount: number;
  waitlistCount: number;
  closeAt: string;
  benefits: string[];
  hasExam: boolean;
  isTeamCompetition: boolean;
  hasLiveQa: boolean;
  hasLiveVoting: boolean;
  sessions: { id: string; name: string; date: string; timeRange: string; location: string }[];
}

interface AttendeeRow {
  id: string;
  studentCode: string;
  fullName: string;
  major: string;
  status: "CONFIRMED" | "WAITLIST" | "PROMOTED_HOLD" | "CANCELLED";
  formAnswers: string;
  registeredAt: string;
}

interface BtcApplicantRow {
  id: string;
  studentCode: string;
  fullName: string;
  nv1: string;
  nv2: string;
  approvedRole?: string;
  hasArtsOverlap: boolean;
  tempModuleGranted?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const MANAGED_EVENTS: Record<string, ManagedEventRecord> = {
  "EVT-2026-MASTERING-IT": {
    id: "EVT-2026-MASTERING-IT",
    title: "Mastering IT 2026 — Cuộc thi Học thuật (Đội 5 SV · 2 Vòng)",
    scope: "FACULTY",
    status: "PUBLISHED",
    capacity: 40,
    registeredCount: 6,
    waitlistCount: 0,
    closeAt: "2026-12-04T23:59",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    hasExam: true,
    isTeamCompetition: true,
    hasLiveQa: true,
    hasLiveVoting: true,
    sessions: [
      { id: "mit-1", name: "Vòng loại Trực tuyến", date: "2026-12-06", timeRange: "08:30 – 10:00", location: "Phòng thi trực tuyến YITZone" },
      { id: "mit-2", name: "Đêm Chung kết Sân khấu", date: "2026-12-19", timeRange: "18:00 – 21:30", location: "Hội trường Lớn Khu A" }
    ]
  },
  "EVT-2026-CLOUD": {
    id: "EVT-2026-CLOUD",
    title: "Hội thảo Cloud Native & DevOps 2026",
    scope: "FACULTY",
    status: "PUBLISHED",
    capacity: 200,
    registeredCount: 184,
    waitlistCount: 12,
    closeAt: "2026-11-28T07:00",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    hasExam: true,
    isTeamCompetition: false,
    hasLiveQa: true,
    hasLiveVoting: true,
    sessions: [
      { id: "S1", name: "Buổi 1 · Khai mạc & Chuyên đề Kubernetes", date: "2026-11-28", timeRange: "08:00 – 11:30", location: "Hội trường Lớn Khu A" }
    ]
  },
  "EVT-2026-HACK": {
    id: "EVT-2026-HACK",
    title: "UTE Hackathon 2026: Smart Campus",
    scope: "FACULTY",
    status: "PENDING_BTV",
    capacity: 120,
    registeredCount: 96,
    waitlistCount: 4,
    closeAt: "2026-12-11T08:00",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    hasExam: false,
    isTeamCompetition: true,
    hasLiveQa: true,
    hasLiveVoting: true,
    sessions: [
      { id: "hck-1", name: "Khai mạc & Pitching 24h", date: "2026-12-12", timeRange: "08:00 – 17:00", location: "Hội trường Lớn Khu A" }
    ]
  },
  "EVT-2026-OFIT": {
    id: "EVT-2026-OFIT",
    title: "Tập huấn Nội bộ Ban Văn phòng (OFIT)",
    scope: "DEPT_INTERNAL",
    status: "DRAFT",
    capacity: 40,
    registeredCount: 28,
    waitlistCount: 0,
    closeAt: "2026-12-09T16:30",
    benefits: [],
    hasExam: false,
    isTeamCompetition: false,
    hasLiveQa: false,
    hasLiveVoting: false,
    sessions: [
      { id: "ofit-1", name: "Buổi 1 · Quy trình trực & bàn giao", date: "2026-12-10", timeRange: "17:30 – 19:30", location: "Văn phòng A1-204" }
    ]
  }
};

const INITIAL_ATTENDEES: AttendeeRow[] = [
  {
    id: "reg-1",
    studentCode: "23110214",
    fullName: "Nguyễn Minh Khôi",
    major: "CNTT (110)",
    status: "CONFIRMED",
    formAnswers: "Đặt áo: Có (Size L) · Zalo: 0901 234 567",
    registeredAt: "21/11/2026 09:15"
  },
  {
    id: "reg-2",
    studentCode: "23110308",
    fullName: "Trần Thảo Vy",
    major: "CNTT (110)",
    status: "CONFIRMED",
    formAnswers: "Đặt áo: Không · Zalo: 0912 889 102",
    registeredAt: "21/11/2026 09:42"
  },
  {
    id: "reg-3",
    studentCode: "24162019",
    fullName: "Lê Quốc Bảo",
    major: "ATTT (162)",
    status: "PROMOTED_HOLD",
    formAnswers: "Đặt áo: Có (Size M) · Giữ chỗ còn 24 phút",
    registeredAt: "21/11/2026 11:05"
  },
  {
    id: "reg-4",
    studentCode: "23133041",
    fullName: "Bùi Khánh Linh",
    major: "KTDL (133)",
    status: "WAITLIST",
    formAnswers: "Đặt áo: Có (Size S) · Hàng chờ #1",
    registeredAt: "21/11/2026 14:20"
  }
];

const INITIAL_BTC_APPLICANTS: BtcApplicantRow[] = [
  {
    id: "btc-a1",
    studentCode: "22110112",
    fullName: "Võ Hoàng Nam",
    nv1: "Kỹ thuật LED & Âm thanh",
    nv2: "Điều phối hội trường",
    approvedRole: "Kỹ thuật LED & Âm thanh",
    hasArtsOverlap: false,
    tempModuleGranted: "Quản trị Phòng thi",
    status: "APPROVED"
  },
  {
    id: "btc-a2",
    studentCode: "23110099",
    fullName: "Phan Thùy Dương",
    nv1: "MC Dẫn chương trình",
    nv2: "Lễ tân / Soát vé",
    approvedRole: "MC Dẫn chương trình",
    hasArtsOverlap: true,
    status: "APPROVED"
  },
  {
    id: "btc-a3",
    studentCode: "24110202",
    fullName: "Cao Đức Mạnh",
    nv1: "Lễ tân / Soát vé QR & Thẻ SV",
    nv2: "Hậu cần",
    hasArtsOverlap: false,
    status: "PENDING"
  }
];

export function EventManagePage() {
  const { eventId } = useParams();
  if (eventId === "new") {
    return <EventCreatePage />;
  }
  return <EventManageWorkspace eventId={eventId} />;
}

function EventManageWorkspace({ eventId }: { eventId?: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const storedEvents = useEventStore((s) => s.events);
  const baseEvent = useMemo<ManagedEventRecord>(() => {
    const fromStore = eventId ? storedEvents.find((e) => e.id === eventId) : undefined;
    if (fromStore) {
      return {
        id: fromStore.id,
        title: fromStore.title,
        scope: fromStore.scope,
        status: fromStore.status,
        capacity: fromStore.capacity,
        registeredCount: fromStore.registeredCount,
        waitlistCount: fromStore.waitlistCount,
        closeAt: fromStore.closeAt,
        benefits: fromStore.benefits,
        hasExam: fromStore.hasExam,
        isTeamCompetition: fromStore.isTeamCompetition,
        hasLiveQa: fromStore.sessions.some((s) => s.activities.liveQa),
        hasLiveVoting: fromStore.sessions.some((s) => s.activities.liveVoting),
        sessions: fromStore.sessions.map((s) => ({
          id: s.id,
          name: s.name,
          date: s.date,
          timeRange: s.timeRange,
          location: s.location
        }))
      };
    }
    return (
      (eventId && MANAGED_EVENTS[eventId]) || {
        id: eventId ?? "EVT-CUSTOM",
        title: `Sự kiện ${eventId ?? ""}`,
        scope: "FACULTY",
        status: "PUBLISHED",
        capacity: 200,
        registeredCount: 42,
        waitlistCount: 0,
        closeAt: "2026-12-10T23:59",
        benefits: ["Cộng ĐRL"],
        hasExam: false,
        isTeamCompetition: false,
        hasLiveQa: true,
        hasLiveVoting: true,
        sessions: [
          { id: "S1", name: "Phiên chính", date: "2026-12-10", timeRange: "08:00 – 11:30", location: "Hội trường Lớn Khu A" }
        ]
      }
    );
  }, [eventId, storedEvents]);

  const initialTab =
    searchParams.get("tab") ??
    (baseEvent.isTeamCompetition ? "team-rounds" : "registrations");
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [eventState, setEventState] = useState<ManagedEventRecord>(baseEvent);
  const [editTitle, setEditTitle] = useState(baseEvent.title);
  const [editCapacity, setEditCapacity] = useState(String(baseEvent.capacity));
  const [editCloseAt, setEditCloseAt] = useState(baseEvent.closeAt);

  // Separate Reschedule Dialog state (B5)
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleSessionId, setRescheduleSessionId] = useState(baseEvent.sessions[0]?.id ?? "S1");
  const [rescheduleDateTime, setRescheduleDateTime] = useState("2026-12-15T08:00");
  const [rescheduleLocation, setRescheduleLocation] = useState(
    baseEvent.sessions[0]?.location ?? "Hội trường Lớn Khu A"
  );
  const [rescheduleReason, setRescheduleReason] = useState("");

  useEffect(() => {
    setEventState(baseEvent);
    setEditTitle(baseEvent.title);
    setEditCapacity(String(baseEvent.capacity));
    setEditCloseAt(baseEvent.closeAt);
    setRescheduleSessionId(baseEvent.sessions[0]?.id ?? "S1");
    setRescheduleLocation(baseEvent.sessions[0]?.location ?? "Hội trường Lớn Khu A");
  }, [baseEvent]);

  const [attendees, setAttendees] = useState<AttendeeRow[]>(INITIAL_ATTENDEES);
  const [btcList, setBtcList] = useState<BtcApplicantRow[]>(INITIAL_BTC_APPLICANTS);
  const [searchReg, setSearchReg] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [auditModal, setAuditModal] = useState<{
    title: string;
    description: string;
    code: string;
    destructive?: boolean;
    onDone: () => void;
  } | null>(null);

  const filteredAttendees = useMemo(() => {
    const q = searchReg.trim().toLowerCase();
    if (!q) return attendees;
    return attendees.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.studentCode.includes(q) ||
        a.formAnswers.toLowerCase().includes(q)
    );
  }, [attendees, searchReg]);

  const approvedBtcCount = btcList.filter((b) => b.status === "APPROVED").length;

  const handleTabChange = (nextTab: string) => {
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  const handleSaveSettings = () => {
    const nextCap = Math.max(0, Number(editCapacity) || 0);
    const sensitiveChanged =
      nextCap !== eventState.capacity || editCloseAt !== eventState.closeAt;

    if (eventState.status === "PUBLISHED" && sensitiveChanged) {
      setAuditModal({
        title: "Chỉnh sửa Thông số Quan trọng Sau Khi Công bố",
        description:
          "Thay đổi sức chứa hoặc thời điểm khóa danh sách sau khi BTV đã duyệt sẽ đưa sự kiện quay về trạng thái Chờ BTV phê duyệt lại.",
        code: "EVENT_SENSITIVE_FIELD_EDIT",
        onDone: () => {
          setEventState((prev) => ({
            ...prev,
            title: editTitle.trim() || prev.title,
            capacity: nextCap,
            closeAt: editCloseAt,
            status: "PENDING_BTV"
          }));
          setNotice("Đã lưu thay đổi nhạy cảm — sự kiện tự chuyển về Chờ BTV phê duyệt lại.");
        }
      });
      return;
    }

    setEventState((prev) => ({
      ...prev,
      title: editTitle.trim() || prev.title,
      capacity: nextCap,
      closeAt: editCloseAt
    }));
    setNotice("Đã cập nhật thông tin sự kiện.");
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (rescheduleReason.trim().length < 5) return;
    const [nextDate, nextTime] = rescheduleDateTime.split("T");
    setEventState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === rescheduleSessionId
          ? {
              ...s,
              date: nextDate ?? s.date,
              timeRange: `${nextTime ?? "08:00"} – 11:30`,
              location: rescheduleLocation.trim() || s.location
            }
          : s
      )
    }));
    setRescheduleOpen(false);
    setRescheduleReason("");
    setNotice(
      "Đã dời lịch buổi hoạt động, đồng bộ Lịch 6 màu và đẩy thông báo Web Push + Email tới toàn bộ sinh viên đã đăng ký (Đã ghi Audit Log)."
    );
  };

  const handleToggleRegistrationGate = () => {
    const isClosed = eventState.status === "REG_CLOSED";
    setEventState((prev) => ({
      ...prev,
      status: isClosed ? "PUBLISHED" : "REG_CLOSED"
    }));
    setNotice(
      isClosed
        ? "Đã mở lại cổng đăng ký cho sự kiện."
        : "Đã đóng cổng đăng ký & khóa danh sách chính thức."
    );
  };

  const handlePromoteWaitlist = (row: AttendeeRow) => {
    setAttendees((prev) =>
      prev.map((a) =>
        a.id === row.id
          ? { ...a, status: "PROMOTED_HOLD", formAnswers: `${a.formAnswers} · Giữ chỗ 30 phút` }
          : a
      )
    );
    setNotice(
      `Đã kích hoạt giữ chỗ 30 phút & gửi Push + Email khẩn cho ${row.fullName} (${row.studentCode}).`
    );
  };

  const handleApproveBtc = (row: BtcApplicantRow, useNv2 = false) => {
    const chosenRole = useNv2 ? row.nv2 : row.nv1;
    setBtcList((prev) =>
      prev.map((b) =>
        b.id === row.id ? { ...b, status: "APPROVED", approvedRole: chosenRole } : b
      )
    );
    setNotice(`Đã duyệt ${row.fullName} vào vị trí "${chosenRole}".`);
  };

  const handleGrantTempModule = (row: BtcApplicantRow, moduleCode: string) => {
    setBtcList((prev) =>
      prev.map((b) => (b.id === row.id ? { ...b, tempModuleGranted: moduleCode } : b))
    );
    setNotice(
      `Đã cấp tạm thời gói ${moduleCode} cho ${row.fullName} trong phạm vi sự kiện ${eventState.id} (tự động thu hồi khi kết thúc sự kiện).`
    );
  };

  const statusMeta: Record<
    ManagedEventRecord["status"],
    { label: string; variant: "success" | "warning" | "secondary" | "info" }
  > = {
    DRAFT: { label: "Bản nháp", variant: "secondary" },
    PENDING_BTV: { label: "Chờ BTV duyệt", variant: "warning" },
    PUBLISHED: { label: "Đang mở đăng ký", variant: "success" },
    REG_CLOSED: { label: "Đã đóng đăng ký", variant: "info" },
    ONGOING: { label: "Đang diễn ra", variant: "info" },
    COMPLETED: { label: "Đã hoàn thành", variant: "secondary" }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Link
            to="/admin/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại Danh sách Sự kiện</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-medium text-foreground">
              {eventState.title}
            </h1>
            <Badge variant={statusMeta[eventState.status].variant}>
              {statusMeta[eventState.status].label}
            </Badge>
            <Badge variant="outline" className="tabular-mono">
              {eventState.id}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to={`/admin/events/${eventState.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              <span>Chỉnh sửa đầy đủ (Wizard)</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to={`/stage?eventId=${eventState.id}`}>
              <MonitorPlay className="h-3.5 w-3.5 text-primary" />
              <span>Màn chiếu LED 16:9</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to={`/staff/scanner?eventId=${eventState.id}`}>
              <ScanLine className="h-3.5 w-3.5" />
              <span>Máy Soát vé Hiện trường</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to={`/events/${eventState.id}`}>
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Trang công khai</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Compact Operational Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">
            {eventState.isTeamCompetition ? "Đội đã đăng ký" : "Người đã đăng ký"}
          </div>
          <div className="mt-1 tabular-mono text-2xl font-semibold text-foreground">
            {eventState.registeredCount} /{" "}
            {eventState.capacity === 0 ? "∞" : eventState.capacity}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {eventState.capacity === 0
              ? "Không giới hạn sức chứa"
              : eventState.isTeamCompetition
                ? "Trần số đội cấu hình"
                : "Trần sức chứa hội trường"}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">Danh sách chờ (Waitlist)</div>
          <div className="mt-1 tabular-mono text-2xl font-semibold text-foreground">
            {eventState.waitlistCount}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Tự giữ chỗ 30p khi có người hủy</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">Ban Tổ chức đã duyệt</div>
          <div className="mt-1 tabular-mono text-2xl font-semibold text-foreground">
            {approvedBtcCount} / {btcList.length}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {btcList.filter((b) => b.status === "PENDING").length} hồ sơ đang chờ duyệt NV1/NV2
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold text-muted-foreground">Quyền lợi gắn kèm</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {eventState.benefits.length > 0 ? (
              eventState.benefits.map((b) => (
                <Badge key={b} variant="success">
                  {b}
                </Badge>
              ))
            ) : (
              <Badge variant="calDept">Nội bộ Ban (Không quyền lợi)</Badge>
            )}
          </div>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-status-success/30 bg-status-success/10 px-4 py-2.5 text-xs font-medium text-status-success">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{notice}</span>
          </span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Đóng
          </button>
        </div>
      )}

      {/* Unified Event Command Center Tabs (B1) */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-5">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/70 p-1">
          {eventState.isTeamCompetition && (
            <TabsTrigger value="team-rounds">
              <Trophy className="mr-1.5 h-3.5 w-3.5" />
              Đội thi &amp; Vòng đấu
            </TabsTrigger>
          )}
          <TabsTrigger value="registrations">
            Đăng ký &amp; Waitlist ({attendees.length})
          </TabsTrigger>
          <TabsTrigger value="btc">
            Ban Tổ chức ({btcList.length})
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <QrCode className="mr-1.5 h-3.5 w-3.5" />
            Điểm danh &amp; QR Động
          </TabsTrigger>
          <TabsTrigger value="live-qa">
            <MessageSquareMore className="mr-1.5 h-3.5 w-3.5" />
            Live Q&amp;A
          </TabsTrigger>
          <TabsTrigger value="voting">
            <Vote className="mr-1.5 h-3.5 w-3.5" />
            Bình chọn
          </TabsTrigger>
          <TabsTrigger value="surveys">
            <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
            Khảo sát
          </TabsTrigger>
          <TabsTrigger value="certificates">
            <Award className="mr-1.5 h-3.5 w-3.5" />
            E-Certificate
          </TabsTrigger>
          <TabsTrigger value="settings">Thiết lập &amp; Lịch trình</TabsTrigger>
        </TabsList>

        {/* TEAM & ROUNDS TAB */}
        {eventState.isTeamCompetition && (
          <TabsContent value="team-rounds">
            <CompetitionAdminPage embedded={true} />
          </TabsContent>
        )}

        {/* REGISTRATIONS & WAITLIST TAB */}
        <TabsContent value="registrations" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Danh sách Đăng ký &amp; Câu trả lời Biểu mẫu</CardTitle>
                <CardDescription>
                  Tra cứu người tham dự, câu trả lời biểu mẫu động (kể cả nhánh điều kiện) và xử lý hàng đợi Waitlist.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={searchReg}
                  onChange={(e) => setSearchReg(e.target.value)}
                  placeholder="Tìm theo tên, MSSV, đáp án..."
                  className="h-9 w-56 rounded-full text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    setNotice("Đã xuất danh sách đăng ký kèm các cột câu trả lời form động ra file Excel (.xlsx).")
                  }
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Xuất Excel</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Sinh viên</th>
                      <th className="px-4 py-3">MSSV / Ngành</th>
                      <th className="px-4 py-3">Câu trả lời Form động</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAttendees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                          Không tìm thấy sinh viên nào khớp với từ khóa &ldquo;{searchReg}&rdquo;.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendees.map((a) => (
                        <tr key={a.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{a.fullName}</div>
                            <div className="tabular-mono text-xs text-muted-foreground">
                              {a.registeredAt}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="tabular-mono text-xs font-semibold text-foreground">
                              {a.studentCode}
                            </div>
                            <div className="text-xs text-muted-foreground">{a.major}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{a.formAnswers}</td>
                          <td className="px-4 py-3">
                            {a.status === "CONFIRMED" ? (
                              <Badge variant="success">Chính thức</Badge>
                            ) : a.status === "PROMOTED_HOLD" ? (
                              <Badge variant="info">Đang giữ chỗ 30p</Badge>
                            ) : a.status === "WAITLIST" ? (
                              <Badge variant="warning">Waitlist</Badge>
                            ) : (
                              <Badge variant="secondary">Đã hủy</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {a.status === "WAITLIST" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => handlePromoteWaitlist(a)}
                              >
                                Đôn giữ chỗ 30p
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BTC RECRUITMENT & APPROVAL TAB */}
        <TabsContent value="btc" className="space-y-4">
          <Card>
            <CardHeader className="border-b border-border/70 pb-4">
              <CardTitle>Duyệt Ban Tổ chức (NV1 / NV2) &amp; Cấp Quyền Tạm thời</CardTitle>
              <CardDescription>
                Thành viên BTC kiêm nhiệm Văn nghệ vẫn chỉ giữ 01 vị trí chính thức để in E-Certificate.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Ứng viên BTC</th>
                      <th className="px-4 py-3">Nguyện vọng 1 / 2</th>
                      <th className="px-4 py-3">Vị trí chốt &amp; Quyền tạm thời</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {btcList.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium text-foreground">{b.fullName}</span>
                            {b.hasArtsOverlap && (
                              <Badge variant="calArts">
                                <Music className="h-3 w-3" />
                                <span>Kiêm Văn nghệ</span>
                              </Badge>
                            )}
                          </div>
                          <div className="tabular-mono text-xs text-muted-foreground">
                            {b.studentCode}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <div className="font-medium text-foreground">NV1: {b.nv1}</div>
                          <div className="text-muted-foreground">NV2: {b.nv2}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {b.status === "APPROVED" ? (
                              <Badge variant="success">{b.approvedRole}</Badge>
                            ) : (
                              <Badge variant="warning">Chờ duyệt</Badge>
                            )}
                            {b.tempModuleGranted && (
                              <Badge variant="outline" className="tabular-mono">
                                <KeyRound className="h-3 w-3" />
                                <span>{b.tempModuleGranted}</span>
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {b.status === "PENDING" ? (
                            <div className="inline-flex flex-wrap justify-end gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                className="rounded-full"
                                onClick={() => handleApproveBtc(b, false)}
                              >
                                Duyệt NV1
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={() => handleApproveBtc(b, true)}
                              >
                                Chuyển NV2
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-full"
                              onClick={() => handleGrantTempModule(b, "Soát vé & Điểm danh")}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              <span>Cấp quyền Soát vé</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ATTENDANCE & 10S DYNAMIC QR LAUNCHER TAB (B1, B7) */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Điều phối Điểm danh Đa lớp &amp; Trình chiếu QR Động 10 giây</CardTitle>
              <CardDescription>
                Mở màn chiếu QR Động 10 giây toàn màn hình LED cho từng buổi, bật Máy Soát vé Hiện trường cho CTV hoặc chuyển sang Hàng đợi Hậu kiểm 48h.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {eventState.sessions.map((ses) => (
                  <div
                    key={ses.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-border/80 bg-muted/25 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">{ses.name}</div>
                      <div className="tabular-mono text-xs text-muted-foreground">
                        {ses.date} · {ses.timeRange} · {ses.location}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" className="rounded-full">
                        <Link to={`/stage/checkin?eventId=${eventState.id}&sessionId=${ses.id}`}>
                          <MonitorPlay className="h-3.5 w-3.5" />
                          <span>Chiếu QR Động 10s (LED 16:9)</span>
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="rounded-full">
                        <Link to={`/staff/scanner?eventId=${eventState.id}&sessionId=${ses.id}`}>
                          <ScanLine className="h-3.5 w-3.5" />
                          <span>Máy Soát vé CTV</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
                <div className="space-y-0.5 text-xs">
                  <div className="font-semibold text-foreground">Hậu kiểm Điểm danh 48 giờ &amp; Điểm danh Bù tay</div>
                  <p className="text-muted-foreground">
                    Rà soát các bản ghi gắn cờ tín hiệu mạnh (+2đ) trước khi chốt cấp E-Certificate.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-full">
                  <Link to={`/admin/attendance?eventId=${eventState.id}`}>
                    <span>Mở Bàn Hậu kiểm 48h</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EMBEDDED LIVE Q&A TAB (B1) */}
        <TabsContent value="live-qa">
          <LiveQaAdminPage embeddedEventId={eventState.id} />
        </TabsContent>

        {/* EMBEDDED VOTING TAB (B1) */}
        <TabsContent value="voting">
          <VotingAdminPage embeddedEventId={eventState.id} />
        </TabsContent>

        {/* EMBEDDED SURVEYS TAB (B1) */}
        <TabsContent value="surveys">
          <SurveyAdminPage embeddedEventId={eventState.id} />
        </TabsContent>

        {/* EMBEDDED E-CERTIFICATE TAB (B1) */}
        <TabsContent value="certificates">
          <CertificateAdminPage embeddedEventId={eventState.id} />
        </TabsContent>

        {/* SETTINGS & LIFECYCLE TAB (B5) */}
        <TabsContent value="settings" className="space-y-5">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Điều chỉnh Thông số Nhanh &amp; Cổng đăng ký</CardTitle>
                <CardDescription>
                  Chỉnh sửa sức chứa hoặc mốc đóng đăng ký sau khi đã xuất bản sẽ tự động đưa sự kiện về trạng thái Chờ BTV phê duyệt lại.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to={`/admin/events/${eventState.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Mở Trình chỉnh sửa đầy đủ (Wizard 5 bước)</span>
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-12">
                <div className="space-y-1.5 md:col-span-6">
                  <Label htmlFor="mng-title">Tên sự kiện</Label>
                  <Input
                    id="mng-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label htmlFor="mng-cap">Sức chứa (0 = Không giới hạn)</Label>
                  <Input
                    id="mng-cap"
                    type="number"
                    min={0}
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(e.target.value)}
                    className="tabular-mono h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-3">
                  <Label htmlFor="mng-close">Đóng đăng ký &amp; khóa danh sách</Label>
                  <DateTimePicker
                    id="mng-close"
                    mode="datetime"
                    value={editCloseAt}
                    onChange={setEditCloseAt}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={handleToggleRegistrationGate}
                >
                  {eventState.status === "REG_CLOSED" ? (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Mở lại cổng đăng ký</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      <span>Đóng cổng &amp; Khóa danh sách</span>
                    </>
                  )}
                </Button>

                <Button type="button" size="sm" className="rounded-full px-5" onClick={handleSaveSettings}>
                  <Users className="h-3.5 w-3.5" />
                  <span>Lưu thay đổi</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Separated Sensitive & Destructive Operations Zone (B5) */}
          <Card className="border-status-danger/35 bg-status-danger/[0.03]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-status-danger">
                <ShieldAlert className="h-5 w-5" />
                <span>Vùng Thao tác Nhạy cảm (Dời lịch / Hủy Sự kiện)</span>
              </CardTitle>
              <CardDescription>
                Các thao tác dưới đây sẽ tự động cập nhật Lịch 6 màu và đẩy thông báo khẩn Web Push + Email SMTP đến toàn bộ người đã đăng ký &amp; thành viên BTC.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5 text-xs text-muted-foreground">
                <div>• <strong>Dời lịch buổi hoạt động:</strong> Chọn buổi, ngày/giờ mới và địa điểm mới kèm lý do thông báo.</div>
                <div>• <strong>Hủy sự kiện đã công bố:</strong> Đóng vĩnh viễn sự kiện và giải phóng toàn bộ lịch giữ chỗ.</div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setRescheduleOpen(true)}
                >
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <span>Dời lịch buổi hoạt động</span>
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    setAuditModal({
                      title: "Xác nhận Hủy Sự kiện đã Công bố",
                      description:
                        "Thao tác hủy sự kiện sẽ gỡ khỏi cổng đăng ký, cập nhật Lịch 6 màu và gửi thông báo hủy khẩn qua Web Push + Email tới toàn bộ người đăng ký.",
                      code: "EVENT_CANCEL_PUBLISHED",
                      destructive: true,
                      onDone: () => {
                        setEventState((prev) => ({ ...prev, status: "COMPLETED" }));
                        setNotice("Đã hủy sự kiện, gửi thông báo khẩn tới người đăng ký và ghi Audit Log.");
                      }
                    })
                  }
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Hủy sự kiện</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Dedicated Reschedule Session Form (B5) */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dời lịch Buổi hoạt động — {eventState.title}</DialogTitle>
            <DialogDescription>
              Chọn buổi cần đổi thời gian hoặc địa điểm. Hệ thống sẽ cập nhật Lịch 6 màu và thông báo tự động cho sinh viên đã đăng ký.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmReschedule} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Buổi hoạt động cần dời lịch</Label>
              <Select value={rescheduleSessionId} onValueChange={setRescheduleSessionId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eventState.sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.date} · {s.timeRange})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ngày &amp; Giờ bắt đầu mới</Label>
                <DateTimePicker
                  mode="datetime"
                  value={rescheduleDateTime}
                  onChange={setRescheduleDateTime}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="resched-loc">Địa điểm mới</Label>
                <Input
                  id="resched-loc"
                  value={rescheduleLocation}
                  onChange={(e) => setRescheduleLocation(e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resched-reason">Lý do dời lịch (Gửi cho sinh viên &amp; lưu Audit Log)</Label>
              <Textarea
                id="resched-reason"
                rows={2}
                required
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="VD: Điều chỉnh theo lịch sử dụng Hội trường Lớn Khu A của Nhà trường..."
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={rescheduleReason.trim().length < 5}>
                Xác nhận dời lịch &amp; Gửi thông báo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {auditModal && (
        <AuditActionDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setAuditModal(null);
          }}
          title={auditModal.title}
          description={auditModal.description}
          targetSummary={`${eventState.title} (${eventState.id})`}
          actionCode={auditModal.code}
          destructive={auditModal.destructive}
          confirmLabel="Xác nhận & Ghi Audit Log"
          onConfirm={async () => {
            auditModal.onDone();
            setAuditModal(null);
          }}
        />
      )}
    </div>
  );
}
