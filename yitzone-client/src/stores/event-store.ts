import { create } from "zustand";
import type {
  RegistrationFormField,
  RegistrationFormMode
} from "@/features/events/RegistrationFormBuilder";

export interface SessionActivityConfig {
  liveQa: boolean;
  liveVoting: boolean;
  liveVotingSecret?: boolean;
  minigame: boolean;
  quizExam: boolean;
  quizMinutes?: number;
  quizPassRate?: number;
  quizTeamScoringMode?: "SUM_OF_MEMBERS" | "AVG_OF_MEMBERS";
  quizQualifyTopN?: number;
}

export function createDefaultSessionActivities(
  overrides: Partial<SessionActivityConfig> = {}
): SessionActivityConfig {
  return {
    liveQa: false,
    liveVoting: false,
    liveVotingSecret: false,
    minigame: false,
    quizExam: false,
    quizMinutes: 20,
    quizPassRate: 70,
    quizTeamScoringMode: "SUM_OF_MEMBERS",
    quizQualifyTopN: 5,
    ...overrides
  };
}

export interface EventSessionRecord {
  id: string;
  step: string;
  name: string;
  date: string;
  timeRange: string;
  location: string;
  topic: string;
  checkIn: string;
  checkOut: string;
  activities: SessionActivityConfig;
}

export interface BtcRoleDraft {
  id: string;
  title: string;
  enabled: boolean;
}

export type EventLifecycleStatus =
  | "DRAFT"
  | "PENDING_BTV"
  | "PUBLISHED"
  | "REG_CLOSED"
  | "ONGOING"
  | "COMPLETED";

export interface StoredEventRecord {
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  day: string;
  month: string;
  dateSummary: string;
  timeShort: string;
  location: string;
  lockNote: string;
  closeAt: string;
  scope: "FACULTY" | "DEPT_INTERNAL";
  visibility: "PUBLIC_FACULTY" | "INTERNAL_CTV";
  status: EventLifecycleStatus;
  benefits: string[];
  sv5tTag?: string;
  registeredCount: number;
  waitlistCount: number;
  capacity: number; // 0 = không giới hạn
  highlights: string[];
  sessions: EventSessionRecord[];
  btcRoles: string[];
  formMode: RegistrationFormMode;
  formFields: RegistrationFormField[];
  hasExam: boolean;
  examMinutes?: number;
  examPassRate?: number;
  examPath?: string;
  isTeamCompetition: boolean;
  minTeamSize?: number;
  maxTeamSize?: number;
  qualifyTopN?: number;
  scoringMode?: "SUM_OF_MEMBERS" | "AVG_OF_MEMBERS";
  allowExternal?: boolean;
  revisionNote?: string;
}

export interface StudentRegistrationRecord {
  eventId: string;
  registeredAt: string;
  answers: Record<string, string | string[] | boolean>;
}

export interface WizardSessionDraft {
  id: string;
  name: string;
  date: string;
  timeRange: string;
  location: string;
  activities: SessionActivityConfig;
}

export interface EventWizardDraft {
  editingEventId: string | null;
  step: 1 | 2 | 3 | 4 | 5;
  coverImage: string;
  title: string;
  scope: "FACULTY" | "DEPT_INTERNAL";
  capacity: string;
  registrationCloseAt: string;
  description: string;
  selectedBenefits: string[];
  sessions: WizardSessionDraft[];
  enableTeamRounds: boolean;
  minTeamSize: string;
  maxTeamSize: string;
  allowExternal: boolean;
  formMode: RegistrationFormMode;
  formFields: RegistrationFormField[];
  btcRoles: BtcRoleDraft[];
  lastSavedAt: string | null;
}

export const DEFAULT_WIZARD_SESSIONS: WizardSessionDraft[] = [
  {
    id: "ses-1",
    name: "Buổi 1 · Khai mạc & Chuyên đề chính",
    date: "2026-12-10",
    timeRange: "08:00 – 11:30",
    location: "Hội trường Lớn Khu A",
    activities: createDefaultSessionActivities({ liveQa: true })
  }
];

export const DEFAULT_BTC_ROLES: BtcRoleDraft[] = [
  { id: "btc-1", title: "MC", enabled: true },
  { id: "btc-2", title: "Lễ tân", enabled: true },
  { id: "btc-3", title: "Hậu cần", enabled: true },
  { id: "btc-4", title: "Điều phối", enabled: true },
  { id: "btc-5", title: "Truyền thông", enabled: true },
  { id: "btc-6", title: "Văn nghệ", enabled: false },
  { id: "btc-7", title: "Kỹ thuật", enabled: true }
];

export function createInitialWizardDraft(): EventWizardDraft {
  return {
    editingEventId: null,
    step: 1,
    coverImage: "/images/hero-campus.jpg",
    title: "",
    scope: "FACULTY",
    capacity: "200",
    registrationCloseAt: "2026-12-09T23:59",
    description: "",
    selectedBenefits: ["Cộng ĐRL"],
    sessions: DEFAULT_WIZARD_SESSIONS.map((s) => ({
      ...s,
      activities: { ...s.activities }
    })),
    enableTeamRounds: false,
    minTeamSize: "3",
    maxTeamSize: "5",
    allowExternal: true,
    formMode: "ONE_TAP",
    formFields: [],
    btcRoles: DEFAULT_BTC_ROLES.map((r) => ({ ...r })),
    lastSavedAt: null
  };
}

const DRAFT_STORAGE_KEY = "yitzone-event-wizard-draft-v2";
const REG_STORAGE_KEY = "yitzone-event-registrations-v1";

function loadDraftFromStorage(): EventWizardDraft {
  if (typeof window === "undefined") return createInitialWizardDraft();
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return createInitialWizardDraft();
    const parsed = JSON.parse(raw) as Partial<EventWizardDraft>;
    const base = createInitialWizardDraft();
    const normalizedSessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.map((s) => ({
          ...s,
          activities: createDefaultSessionActivities(s.activities)
        }))
      : base.sessions;
    return {
      ...base,
      ...parsed,
      sessions: normalizedSessions
    };
  } catch {
    return createInitialWizardDraft();
  }
}

function saveDraftToStorage(draft: EventWizardDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore quota errors
  }
}

function loadRegistrationsFromStorage(): Record<string, StudentRegistrationRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REG_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StudentRegistrationRecord>;
  } catch {
    return {};
  }
}

function saveRegistrationsToStorage(regs: Record<string, StudentRegistrationRecord>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REG_STORAGE_KEY, JSON.stringify(regs));
  } catch {
    // Ignore quota errors
  }
}

const INITIAL_EVENTS: StoredEventRecord[] = [
  {
    id: "EVT-2026-MASTERING-IT",
    title: "Mastering IT 2026 — Cuộc thi Học thuật Công nghệ Thông tin",
    subtitle:
      "Sự kiện học thuật đa vòng cấp Khoa CNTT HCM-UTE mở rộng cho sinh viên toàn thành phố: đăng ký theo đội 5 sinh viên (kể cả ngoài trường), thi vòng loại cá nhân gộp điểm chọn Top 5 vào Đêm Chung kết sân khấu.",
    coverImage: "/images/card-hackathon.jpg",
    day: "06",
    month: "TH12",
    dateSummary: "06/12/2026 (Vòng loại) · 19/12/2026 (Chung kết)",
    timeShort: "Chủ Nhật · 08:30",
    location: "Trực tuyến & Hội trường Lớn Khu A · HCM-UTE",
    lockNote: "Khóa đổi thành viên đội trước 04/12/2026",
    closeAt: "2026-12-04T23:59",
    scope: "FACULTY",
    visibility: "PUBLIC_FACULTY",
    status: "PUBLISHED",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    sv5tTag: "SV5T · Học tập & Hội nhập",
    registeredCount: 6,
    waitlistCount: 0,
    capacity: 40,
    highlights: [
      "Mở đăng ký đội gồm đúng 5 sinh viên (cho phép phối hợp SV HCM-UTE & SV ngoài trường tự đăng ký Email + OTP và xác nhận vào đội).",
      "Vòng loại: 5 thành viên thi cá nhân độc lập trên Phòng thi trực tuyến YITZone → hệ thống tự tổng hợp điểm đội để chọn Top 5 vào Chung kết.",
      "Đêm Chung kết: 3 chặng chấm điểm Ban Giám khảo + Bình chọn khán giả; cấp E-Cert cho cả 5/5 thành viên và cộng ĐRL/CĐDN riêng cho SV HCM-UTE."
    ],
    sessions: [
      {
        id: "mit-1",
        step: "01",
        name: "Vòng loại Trực tuyến (5 SV thi cá nhân gộp điểm đội)",
        date: "2026-12-06",
        timeRange: "08:30 – 10:00",
        location: "Phòng thi trực tuyến YITZone",
        topic:
          "Kiến thức nền tảng CNTT, Giải thuật, Mạng & Hệ thống trên Phòng thi trực tuyến YITZone; chọn Top 5 đội điểm cao nhất.",
        checkIn: "Phòng thi trực tuyến YITZone",
        checkOut: "Tự động thu bài & tổng hợp điểm đội",
        activities: createDefaultSessionActivities({
          quizExam: true,
          quizMinutes: 60,
          quizPassRate: 50,
          quizTeamScoringMode: "SUM_OF_MEMBERS",
          quizQualifyTopN: 5
        })
      },
      {
        id: "mit-2",
        step: "02",
        name: "Đêm Chung kết Sân khấu (Top 5 đội tranh tài)",
        date: "2026-12-19",
        timeRange: "18:00 – 21:30",
        location: "Hội trường Lớn Khu A",
        topic:
          "3 chặng Khởi động (20%) · Tăng tốc (30%) · Về đích & Phản biện BGK (50%) kết hợp Bình chọn khán giả trực tiếp.",
        checkIn: "Hội trường Lớn Khu A (QR động / Mã vạch thẻ SV)",
        checkOut: "Hội trường Lớn Khu A (Bắt buộc Check-out)",
        activities: createDefaultSessionActivities({
          liveVoting: true,
          liveQa: true,
          minigame: true
        })
      }
    ],
    btcRoles: [
      "Lễ tân / Soát vé QR & Thẻ SV",
      "Kỹ thuật Âm thanh – Ánh sáng – LED",
      "Truyền thông / Nhiếp ảnh",
      "Hậu cần / Điều phối hội trường",
      "MC Dẫn chương trình",
      "Điều phối Phòng thi & BGK"
    ],
    formMode: "ONE_TAP",
    formFields: [],
    hasExam: true,
    examMinutes: 60,
    examPassRate: 50,
    examPath: "/exam/mastering-it-qual",
    isTeamCompetition: true,
    minTeamSize: 5,
    maxTeamSize: 5,
    qualifyTopN: 5,
    scoringMode: "SUM_OF_MEMBERS",
    allowExternal: true
  },
  {
    id: "EVT-2026-CLOUD",
    title: "Hội thảo Cloud Native & DevOps 2026",
    subtitle:
      "Chuyên đề kiến trúc Kubernetes, CI/CD thực chiến, Observability và giao lưu định hướng nghề nghiệp cùng đội ngũ kỹ sư doanh nghiệp đối tác Khoa CNTT.",
    coverImage: "/images/hero-campus.jpg",
    day: "28",
    month: "TH11",
    dateSummary: "Thứ 7, 28/11/2026 · 08:00 – 16:30",
    timeShort: "Thứ 7 · 08:00",
    location: "Hội trường Lớn Khu A · HCM-UTE",
    lockNote: "Khóa danh sách trước 60 phút",
    closeAt: "2026-11-28T07:00",
    scope: "FACULTY",
    visibility: "PUBLIC_FACULTY",
    status: "PUBLISHED",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    sv5tTag: "SV5T · Học tập tốt",
    registeredCount: 184,
    waitlistCount: 12,
    capacity: 200,
    highlights: [
      "Thực hành triển khai cụm Kubernetes & pipeline GitHub Actions trực tiếp tại phòng Lab.",
      "Giải đáp lộ trình phỏng vấn DevOps / Cloud Engineer cùng kỹ sư Senior.",
      "Cấp E-Certificate điện tử xác thực QR trọn đời sau khi hoàn tất 2/2 buổi."
    ],
    sessions: [
      {
        id: "s1",
        step: "01",
        name: "Buổi 1 · Khai mạc & Kiến trúc Microservices",
        date: "2026-11-28",
        timeRange: "08:00 – 11:30",
        location: "Hội trường Lớn Khu A",
        topic: "Tổng quan hệ thống Cloud Native, thiết kế dịch vụ chịu lỗi và giám sát tài nguyên.",
        checkIn: "Hội trường Lớn (Bán kính 60m)",
        checkOut: "Hội trường Lớn (Yêu cầu ≥ 80% thời lượng)",
        activities: createDefaultSessionActivities({
          liveQa: true,
          minigame: true
        })
      },
      {
        id: "s2",
        step: "02",
        name: "Buổi 2 · Thực hành Kubernetes & CI/CD",
        date: "2026-11-28",
        timeRange: "13:30 – 16:30",
        location: "Phòng Lab A4-202",
        topic: "Workshop thực chiến đóng gói Docker, triển khai Helm Chart và Zero-downtime deploy.",
        checkIn: "Phòng Lab A4-202 (Bán kính 40m)",
        checkOut: "Sảnh A4 (Điểm Check-out riêng)",
        activities: createDefaultSessionActivities({
          quizExam: true,
          quizMinutes: 20,
          quizPassRate: 70
        })
      }
    ],
    btcRoles: [
      "Lễ tân / Soát vé QR & Thẻ SV",
      "Kỹ thuật Âm thanh – Ánh sáng – LED",
      "Truyền thông / Nhiếp ảnh",
      "Hậu cần / Điều phối hội trường",
      "MC Dẫn chương trình"
    ],
    formMode: "CUSTOM_FORM",
    formFields: [
      {
        id: "cloud-zalo",
        type: "SHORT_TEXT",
        label: "Số điện thoại Zalo nhận tài liệu Lab",
        placeholder: "VD: 0901 234 567",
        required: true,
        scope: "PARTICIPANT",
        options: []
      },
      {
        id: "cloud-shirt-ask",
        type: "SINGLE_CHOICE",
        label: "Bạn có đăng ký nhận áo sự kiện không?",
        required: true,
        scope: "PARTICIPANT",
        options: ["Có, tôi muốn đặt áo", "Không đăng ký áo"]
      },
      {
        id: "cloud-shirt-size",
        type: "SINGLE_CHOICE",
        label: "Chọn size áo sự kiện",
        required: true,
        scope: "PARTICIPANT",
        options: ["S", "M", "L", "XL", "2XL"],
        visibleWhen: { fieldId: "cloud-shirt-ask", equals: "Có, tôi muốn đặt áo" }
      }
    ],
    hasExam: true,
    examMinutes: 20,
    examPassRate: 70,
    examPath: "/exam/ex-fit-2026",
    isTeamCompetition: false
  },
  {
    id: "EVT-2026-HACK",
    title: "UTE Hackathon 2026: Smart Campus",
    subtitle:
      "Cuộc thi lập trình 36 giờ xây dựng giải pháp chuyển đổi số phục vụ đời sống sinh viên, học thuật và quản trị thông minh trong khuôn viên đại học.",
    coverImage: "/images/card-hackathon.jpg",
    day: "12",
    month: "TH12",
    dateSummary: "Thứ 7, 12/12/2026 · 08:00 – 20:00",
    timeShort: "Thứ 7 · 08:00",
    location: "Sảnh A & Khu Lab Khoa CNTT · HCM-UTE",
    lockNote: "Khóa đăng ký đội thi trước 24 giờ",
    closeAt: "2026-12-11T08:00",
    scope: "FACULTY",
    visibility: "PUBLIC_FACULTY",
    status: "PENDING_BTV",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    sv5tTag: "SV5T · Học tập & Hội nhập",
    registeredCount: 96,
    waitlistCount: 4,
    capacity: 120,
    highlights: [
      "Thi đấu theo đội 3–4 sinh viên với cố vấn kỹ thuật từ doanh nghiệp đồng hành.",
      "Trình bày sản phẩm trực tiếp trước Hội đồng Giám khảo và nhận giải thưởng hiện kim.",
      "Ghi nhận điểm rèn luyện, CĐDN và minh chứng tiêu chí Nghiên cứu khoa học – Sáng tạo."
    ],
    sessions: [
      {
        id: "h1",
        step: "01",
        name: "Vòng Khởi động & Công bố Đề bài",
        date: "2026-12-12",
        timeRange: "08:00 – 11:30",
        location: "Sảnh A · HCM-UTE",
        topic: "Check-in đội thi, nhận bộ API mở và phiên cố vấn kiến trúc cùng Mentor.",
        checkIn: "Sảnh A · HCM-UTE",
        checkOut: "Khu Lab A4",
        activities: createDefaultSessionActivities({ liveQa: true })
      },
      {
        id: "h2",
        step: "02",
        name: "Chung kết Demo & Trao giải",
        date: "2026-12-13",
        timeRange: "14:00 – 20:00",
        location: "Hội trường Lớn Khu A",
        topic: "Thuyết trình sản phẩm 7 phút + Q&A cùng Ban Giám khảo và vinh danh Top 3.",
        checkIn: "Hội trường Lớn Khu A",
        checkOut: "Hội trường Lớn Khu A",
        activities: createDefaultSessionActivities({ liveVoting: true, minigame: true })
      }
    ],
    btcRoles: ["MC", "Lễ tân", "Hậu cần", "Điều phối", "Truyền thông", "Kỹ thuật", "Hỗ trợ Mentor"],
    formMode: "ONE_TAP",
    formFields: [],
    hasExam: false,
    isTeamCompetition: true,
    minTeamSize: 3,
    maxTeamSize: 4,
    qualifyTopN: 8,
    scoringMode: "SUM_OF_MEMBERS",
    allowExternal: false
  },
  {
    id: "EVT-2026-DIST",
    title: "FIT Tech Talk: Kiến trúc Hệ thống Phân tán & Kafka",
    subtitle:
      "Phân tích mô hình xử lý hàng triệu sự kiện/giây, đảm bảo Exactly-Once Delivery và bài học thiết kế hệ thống chịu lỗi trong thực tế.",
    coverImage: "/images/card-hackathon.jpg",
    day: "03",
    month: "TH12",
    dateSummary: "Thứ 5, 03/12/2026 · 18:00 – 20:30",
    timeShort: "Thứ 5 · 18:00",
    location: "Phòng A5-302 · HCM-UTE",
    lockNote: "Khóa danh sách trước 30 phút",
    closeAt: "2026-12-03T17:30",
    scope: "FACULTY",
    visibility: "PUBLIC_FACULTY",
    status: "PUBLISHED",
    benefits: ["Cộng ĐRL", "Cộng CĐDN"],
    sv5tTag: "SV5T · Học tập tốt",
    registeredCount: 112,
    waitlistCount: 0,
    capacity: 150,
    highlights: [
      "Mổ xẻ kiến trúc Event-Driven với Apache Kafka và Outbox Pattern.",
      "Hỏi đáp trực tiếp cùng Technical Architect về bài toán High Throughput.",
      "Cấp chứng nhận tham dự điện tử đồng bộ về hồ sơ cá nhân."
    ],
    sessions: [
      {
        id: "d1",
        step: "01",
        name: "Phiên chuyên đề & Hỏi đáp Live Q&A",
        date: "2026-12-03",
        timeRange: "18:00 – 20:30",
        location: "Phòng A5-302",
        topic: "Chia sẻ case-study thực tế và tương tác đặt câu hỏi trực tiếp qua YITZone Live Q&A.",
        checkIn: "Phòng A5-302",
        checkOut: "Phòng A5-302",
        activities: createDefaultSessionActivities({
          liveQa: true,
          quizExam: true,
          quizMinutes: 15,
          quizPassRate: 70
        })
      }
    ],
    btcRoles: ["Lễ tân", "Kỹ thuật", "Truyền thông", "Điều phối"],
    formMode: "ONE_TAP",
    formFields: [],
    hasExam: true,
    examMinutes: 15,
    examPassRate: 70,
    examPath: "/exam/ex-fit-2026",
    isTeamCompetition: false
  },
  {
    id: "EVT-2026-VOL",
    title: "Ngày hội Hiến máu Nhân đạo & Tiếp sức Mùa thi",
    subtitle:
      "Hoạt động tình nguyện vì cộng đồng thường niên do Đoàn – Hội Khoa CNTT phối hợp cùng Hội Chữ thập đỏ TP.HCM tổ chức.",
    coverImage: "/images/card-sv5t.jpg",
    day: "06",
    month: "TH12",
    dateSummary: "Chủ Nhật, 06/12/2026 · 07:30 – 11:30",
    timeShort: "Chủ Nhật · 07:30",
    location: "Sảnh Khu E · HCM-UTE",
    lockNote: "Đăng ký trực tiếp hoặc qua YITZone",
    closeAt: "2026-12-05T22:00",
    scope: "FACULTY",
    visibility: "PUBLIC_FACULTY",
    status: "PUBLISHED",
    benefits: ["Cộng CTXH", "Cộng ĐRL"],
    sv5tTag: "SV5T · Tình nguyện tốt",
    registeredCount: 240,
    waitlistCount: 0,
    capacity: 300,
    highlights: [
      "Khám sàng lọc miễn phí, hỗ trợ dinh dưỡng và cấp Giấy chứng nhận hiến máu tình nguyện.",
      "Cập nhật tự động ngày Công tác xã hội và minh chứng Tình nguyện tốt SV5T.",
      "Không gian check-in nhanh 1 chạm bằng Vé QR cá nhân."
    ],
    sessions: [
      {
        id: "v1",
        step: "01",
        name: "Tiếp nhận & Hiến máu Tình nguyện",
        date: "2026-12-06",
        timeRange: "07:30 – 11:30",
        location: "Sảnh Khu E",
        topic: "Đăng ký sàng lọc sức khỏe, hiến máu và nhận quà lưu niệm Khoa CNTT.",
        checkIn: "Sảnh Khu E",
        checkOut: "Bàn Lễ tân Khu E",
        activities: createDefaultSessionActivities()
      }
    ],
    btcRoles: ["Lễ tân", "Hậu cần", "Điều phối", "Truyền thông"],
    formMode: "ONE_TAP",
    formFields: [],
    hasExam: false,
    isTeamCompetition: false
  },
  {
    id: "EVT-2026-OFIT",
    title: "Tập huấn Quét mã vạch & Kiểm kê Tài sản Văn phòng (OFIT)",
    subtitle:
      "Hướng dẫn quy trình trực văn phòng, kiểm kê thiết bị và vận hành máy soát vé ngoại tuyến cho Cộng tác viên Ban Văn phòng.",
    coverImage: "/images/card-sv5t.jpg",
    day: "09",
    month: "TH12",
    dateSummary: "Thứ 4, 09/12/2026 · 17:30 – 19:30",
    timeShort: "Thứ 4 · 17:30",
    location: "Văn phòng Đoàn - Hội FIT",
    lockNote: "Khóa danh sách trước 60 phút",
    closeAt: "2026-12-09T16:30",
    scope: "DEPT_INTERNAL",
    visibility: "INTERNAL_CTV",
    status: "DRAFT",
    benefits: [],
    registeredCount: 28,
    waitlistCount: 0,
    capacity: 40,
    highlights: [
      "Thực hành sử dụng máy quét mã vạch 1D và quy trình soát vé ngoại tuyến.",
      "Thống nhất quy chuẩn bàn giao ca trực và kiểm kê tài sản văn phòng."
    ],
    sessions: [
      {
        id: "ofit-1",
        step: "01",
        name: "Buổi 1 · Hướng dẫn quy trình & thực hành",
        date: "2026-12-09",
        timeRange: "17:30 – 19:30",
        location: "Văn phòng Đoàn - Hội FIT",
        topic: "Quy trình trực văn phòng, kiểm kê thiết bị và xử lý sự cố soát vé.",
        checkIn: "Văn phòng Đoàn - Hội FIT",
        checkOut: "Văn phòng Đoàn - Hội FIT",
        activities: createDefaultSessionActivities()
      }
    ],
    btcRoles: ["Điều phối", "Kỹ thuật"],
    formMode: "ONE_TAP",
    formFields: [],
    hasExam: false,
    isTeamCompetition: false
  }
];

interface EventStoreState {
  events: StoredEventRecord[];
  registrations: Record<string, StudentRegistrationRecord>;
  wizardDraft: EventWizardDraft;
  addEvent: (event: StoredEventRecord) => void;
  updateEventRecord: (id: string, patch: Partial<StoredEventRecord>) => void;
  approveEvent: (id: string) => void;
  requestRevision: (id: string, reason: string) => void;
  registerForEvent: (
    eventId: string,
    answers?: Record<string, string | string[] | boolean>
  ) => void;
  cancelRegistration: (eventId: string) => void;
  updateWizardDraft: (patch: Partial<EventWizardDraft>) => void;
  loadEventIntoWizard: (eventId: string) => boolean;
  resetWizardDraft: () => void;
}

export const useEventStore = create<EventStoreState>((set) => ({
  events: INITIAL_EVENTS,
  registrations: loadRegistrationsFromStorage(),
  wizardDraft: loadDraftFromStorage(),

  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events.filter((e) => e.id !== event.id)]
    })),

  updateEventRecord: (id, patch) =>
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? { ...e, ...patch } : e))
    })),

  approveEvent: (id) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, status: "PUBLISHED", revisionNote: undefined } : e
      )
    })),

  requestRevision: (id, reason) =>
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, status: "DRAFT", revisionNote: reason } : e
      )
    })),

  registerForEvent: (eventId, answers = {}) =>
    set((state) => {
      if (state.registrations[eventId]) return state;
      const nextRegs: Record<string, StudentRegistrationRecord> = {
        ...state.registrations,
        [eventId]: {
          eventId,
          registeredAt: new Date().toLocaleString("vi-VN"),
          answers
        }
      };
      saveRegistrationsToStorage(nextRegs);
      return {
        registrations: nextRegs,
        events: state.events.map((e) =>
          e.id === eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e
        )
      };
    }),

  cancelRegistration: (eventId) =>
    set((state) => {
      if (!state.registrations[eventId]) return state;
      const nextRegs = { ...state.registrations };
      delete nextRegs[eventId];
      saveRegistrationsToStorage(nextRegs);
      return {
        registrations: nextRegs,
        events: state.events.map((e) =>
          e.id === eventId
            ? { ...e, registeredCount: Math.max(0, e.registeredCount - 1) }
            : e
        )
      };
    }),

  updateWizardDraft: (patch) =>
    set((state) => {
      const now = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit"
      });
      const next: EventWizardDraft = {
        ...state.wizardDraft,
        ...patch,
        lastSavedAt: now
      };
      saveDraftToStorage(next);
      return { wizardDraft: next };
    }),

  loadEventIntoWizard: (eventId) => {
    let found = false;
    set((state) => {
      const target = state.events.find((e) => e.id === eventId);
      if (!target) return state;
      found = true;

      const enabledRoleSet = new Set(target.btcRoles);
      const mergedBtcRoles: BtcRoleDraft[] = DEFAULT_BTC_ROLES.map((r) => ({
        ...r,
        enabled: enabledRoleSet.has(r.title)
      }));
      for (const customRole of target.btcRoles) {
        if (!mergedBtcRoles.some((r) => r.title === customRole)) {
          mergedBtcRoles.push({
            id: `btc-custom-${customRole}`,
            title: customRole,
            enabled: true
          });
        }
      }

      const nextDraft: EventWizardDraft = {
        editingEventId: target.id,
        step: 1,
        coverImage: target.coverImage,
        title: target.title,
        scope: target.scope,
        capacity: String(target.capacity),
        registrationCloseAt: target.closeAt,
        description: target.subtitle,
        selectedBenefits: [...target.benefits],
        sessions: target.sessions.map((s) => ({
          id: s.id,
          name: s.name,
          date: s.date,
          timeRange: s.timeRange,
          location: s.location,
          activities: createDefaultSessionActivities(s.activities)
        })),
        enableTeamRounds: target.isTeamCompetition,
        minTeamSize: String(target.minTeamSize ?? 3),
        maxTeamSize: String(target.maxTeamSize ?? 5),
        allowExternal: Boolean(target.allowExternal),
        formMode: target.formMode,
        formFields: target.formFields.map((f) => ({
          ...f,
          options: [...f.options],
          visibleWhen: f.visibleWhen ? { ...f.visibleWhen } : undefined
        })),
        btcRoles: mergedBtcRoles,
        lastSavedAt: null
      };
      saveDraftToStorage(nextDraft);
      return { wizardDraft: nextDraft };
    });
    return found;
  },

  resetWizardDraft: () =>
    set(() => {
      const fresh = createInitialWizardDraft();
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
      return { wizardDraft: fresh };
    })
}));
