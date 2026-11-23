export type TeamStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "WAITLISTED"
  | "APPROVED"
  | "REJECTED"
  | "DISQUALIFIED";

export type AdvancementStatus =
  | "PENDING"
  | "QUALIFIED"
  | "STANDBY"
  | "ELIMINATED"
  | "CONFIRMED"
  | "WITHDRAWN"
  | "DISQUALIFIED";

export type TeamScoringMode = "SUM_OF_MEMBERS" | "AVG_OF_MEMBERS";
export type CheatingPolicy = "ZERO_MEMBER_SCORE" | "DISQUALIFY_TEAM";

export interface TeamMemberRecord {
  userId: string;
  fullName: string;
  email: string;
  role: "LEADER" | "MEMBER";
  isExternal: boolean;
  studentCode: string;
  schoolName: string;
  facultyMajor: string;
  otpVerified: boolean;
  confirmedAt: string;
  qualRawScore: number; // thang 100
  qualDurationSec: number;
  qualViolations: number;
  qualDisqualified: boolean;
  participated: boolean;
}

export interface CompetitionTeamRecord {
  id: string;
  teamCode: string;
  teamName: string;
  joinCode: string;
  status: TeamStatus;
  advancementStatus: AdvancementStatus;
  awardTitle?: string;
  note?: string;
  members: TeamMemberRecord[];
  /** Điểm 3 chặng đêm Chung kết (thang điểm từng chặng) */
  stageScores: {
    warmup: number; // tối đa 20
    accel: number; // tối đa 30
    finish: number; // tối đa 50
    audienceVotes: number;
  };
  /** Sản phẩm / Video giới thiệu đội dành cho Top X vào Chung kết */
  introVideo?: {
    url: string;
    submittedAt: string;
    status: "NOT_SUBMITTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
    bgkVideoScore: number; // thang 100, chấm riêng cho giải phụ Video
  };
}

export interface StageSegmentConfig {
  code: "warmup" | "accel" | "finish";
  title: string;
  weightPercent: number;
  maxScore: number;
  criteriaNote: string;
}

export const MASTERING_IT_META = {
  id: "COMP-2026-MIT",
  eventId: "EVT-2026-MASTERING-IT",
  title: "Mastering IT 2026 — Đấu trường Học thuật Công nghệ Thông tin",
  subtitle:
    "Cuộc thi học thuật thường niên cấp Khoa CNTT HCM-UTE mở rộng cho sinh viên toàn thành phố, gồm Vòng loại cá nhân gộp điểm đội 5 người và Đêm Chung kết sân khấu.",
  academicYear: "2026–2027",
  semester: "HK1",
  minTeamSize: 5,
  maxTeamSize: 5,
  maxTeams: 40,
  qualifyTopN: 5,
  allowExternalStudents: true,
  rosterLockAt: "04/12/2026 · 23:59",
  qualRoundTime: "06/12/2026 · 08:30 – 10:00 (Trực tuyến · 4.6.2)",
  finalRoundTime: "19/12/2026 · 18:00 – 21:30 (Hội trường Lớn Khu A · 4.20)",
  confirmDeadline: "10/12/2026 · 17:00",
  benefitsForUte: ["Cộng ĐRL", "Cộng CĐDN"] as const
};

export const STAGE_SEGMENTS: StageSegmentConfig[] = [
  {
    code: "warmup",
    title: "Chặng 1 · Khởi động nhanh",
    weightPercent: 20,
    maxScore: 20,
    criteriaNote: "Tốc độ phản xạ kiến thức nền tảng CS & Mạng máy tính"
  },
  {
    code: "accel",
    title: "Chặng 2 · Tăng tốc Giải quyết Vấn đề",
    weightPercent: 30,
    maxScore: 30,
    criteriaNote: "Phân tích tình huống hệ thống & tối ưu thuật toán"
  },
  {
    code: "finish",
    title: "Chặng 3 · Về đích & Phản biện BGK",
    weightPercent: 50,
    maxScore: 50,
    criteriaNote: "Kiến trúc giải pháp, trình bày & trả lời chất vấn Hội đồng"
  }
];

export const INITIAL_COMPETITION_TEAMS: CompetitionTeamRecord[] = [
  {
    id: "team-01",
    teamCode: "MIT-001",
    teamName: "ByteStorm UTE",
    joinCode: "MIT8X4K2",
    status: "APPROVED",
    advancementStatus: "CONFIRMED",
    awardTitle: "Giải Nhất",
    members: [
      {
        userId: "u-101",
        fullName: "Nguyễn Minh Khôi",
        email: "23110214@student.hcmute.edu.vn",
        role: "LEADER",
        isExternal: false,
        studentCode: "23110214",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "25/11/2026 09:12",
        qualRawScore: 94,
        qualDurationSec: 2180,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-102",
        fullName: "Trần Thảo Vy",
        email: "23110308@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "23110308",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "25/11/2026 09:40",
        qualRawScore: 88,
        qualDurationSec: 2340,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-103",
        fullName: "Lê Quốc Bảo",
        email: "24162019@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "24162019",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "An toàn Thông tin (162)",
        otpVerified: true,
        confirmedAt: "25/11/2026 10:05",
        qualRawScore: 90,
        qualDurationSec: 2290,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-104",
        fullName: "Phạm Gia Huy",
        email: "giahuy.pham@hcmut.edu.vn",
        role: "MEMBER",
        isExternal: true,
        studentCode: "BK-2311452",
        schoolName: "ĐH Bách Khoa TP.HCM (HCMUT)",
        facultyMajor: "Khoa học Máy tính",
        otpVerified: true,
        confirmedAt: "25/11/2026 11:22",
        qualRawScore: 92,
        qualDurationSec: 2210,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-105",
        fullName: "Đặng Ngọc Ánh",
        email: "ngocanh.dang@fit.hcmus.edu.vn",
        role: "MEMBER",
        isExternal: true,
        studentCode: "KHTN-23120089",
        schoolName: "ĐH Khoa học Tự nhiên TP.HCM (HCMUS)",
        facultyMajor: "Kỹ thuật Phần mềm",
        otpVerified: true,
        confirmedAt: "25/11/2026 14:05",
        qualRawScore: 86,
        qualDurationSec: 2410,
        qualViolations: 1,
        qualDisqualified: false,
        participated: true
      }
    ],
    stageScores: { warmup: 18.5, accel: 27, finish: 46, audienceVotes: 164 },
    introVideo: {
      url: "https://youtu.be/bytestorm-mit2026-intro",
      submittedAt: "12/12/2026 20:15",
      status: "APPROVED",
      bgkVideoScore: 88
    }
  },
  {
    id: "team-02",
    teamCode: "MIT-002",
    teamName: "Kernel Panic 404",
    joinCode: "MIT9Q2P7",
    status: "APPROVED",
    advancementStatus: "CONFIRMED",
    awardTitle: "Giải Nhì",
    members: [
      {
        userId: "u-201",
        fullName: "Võ Hoàng Nam",
        email: "22110112@student.hcmute.edu.vn",
        role: "LEADER",
        isExternal: false,
        studentCode: "22110112",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "26/11/2026 08:15",
        qualRawScore: 90,
        qualDurationSec: 2250,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-202",
        fullName: "Huỳnh Tấn Phát",
        email: "22110198@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "22110198",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "26/11/2026 08:31",
        qualRawScore: 88,
        qualDurationSec: 2310,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-203",
        fullName: "Bùi Khánh Linh",
        email: "23133041@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "23133041",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Kỹ thuật Dữ liệu (133)",
        otpVerified: true,
        confirmedAt: "26/11/2026 09:02",
        qualRawScore: 86,
        qualDurationSec: 2390,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-204",
        fullName: "Ngô Thành Đạt",
        email: "23110421@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "23110421",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "26/11/2026 09:20",
        qualRawScore: 84,
        qualDurationSec: 2450,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-205",
        fullName: "Trương Nhật Minh",
        email: "nhatminh.truong@gm.uit.edu.vn",
        role: "MEMBER",
        isExternal: true,
        studentCode: "UIT-23520911",
        schoolName: "ĐH Công nghệ Thông tin (UIT)",
        facultyMajor: "Mạng máy tính & Truyền thông",
        otpVerified: true,
        confirmedAt: "26/11/2026 10:12",
        qualRawScore: 88,
        qualDurationSec: 2300,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      }
    ],
    stageScores: { warmup: 17.5, accel: 26, finish: 44.5, audienceVotes: 152 },
    introVideo: {
      url: "https://youtu.be/kernelpanic-mit2026-intro",
      submittedAt: "13/12/2026 14:40",
      status: "APPROVED",
      bgkVideoScore: 95
    }
  },
  {
    id: "team-03",
    teamCode: "MIT-003",
    teamName: "Lambda Nexus",
    joinCode: "MIT4L7M3",
    status: "APPROVED",
    advancementStatus: "CONFIRMED",
    awardTitle: "Giải Ba",
    members: [
      {
        userId: "u-301",
        fullName: "Đỗ Anh Tuấn",
        email: "23110055@student.hcmute.edu.vn",
        role: "LEADER",
        isExternal: false,
        studentCode: "23110055",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "26/11/2026 13:10",
        qualRawScore: 86,
        qualDurationSec: 2400,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-302",
        fullName: "Phan Thùy Dương",
        email: "23110099@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "23110099",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "26/11/2026 13:18",
        qualRawScore: 82,
        qualDurationSec: 2480,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-303",
        fullName: "Cao Đức Mạnh",
        email: "24110202@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "24110202",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "26/11/2026 13:45",
        qualRawScore: 84,
        qualDurationSec: 2410,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-304",
        fullName: "Lý Mỹ Hạnh",
        email: "23162077@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "23162077",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "An toàn Thông tin (162)",
        otpVerified: true,
        confirmedAt: "26/11/2026 14:12",
        qualRawScore: 86,
        qualDurationSec: 2380,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-305",
        fullName: "Tạ Quốc Việt",
        email: "23133018@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "23133018",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Kỹ thuật Dữ liệu (133)",
        otpVerified: true,
        confirmedAt: "26/11/2026 14:40",
        qualRawScore: 82,
        qualDurationSec: 2510,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      }
    ],
    stageScores: { warmup: 16, accel: 25.5, finish: 42, audienceVotes: 129 },
    introVideo: {
      url: "https://youtu.be/lambdanexus-mit2026-intro",
      submittedAt: "13/12/2026 19:02",
      status: "PENDING_REVIEW",
      bgkVideoScore: 84
    }
  },
  {
    id: "team-04",
    teamCode: "MIT-004",
    teamName: "NullPointer Rebels",
    joinCode: "MIT2N6V9",
    status: "APPROVED",
    advancementStatus: "QUALIFIED",
    awardTitle: "Khuyến khích",
    members: [
      {
        userId: "u-401",
        fullName: "Mai Xuân Trường",
        email: "22110331@student.hcmute.edu.vn",
        role: "LEADER",
        isExternal: false,
        studentCode: "22110331",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "27/11/2026 09:05",
        qualRawScore: 88,
        qualDurationSec: 2320,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-402",
        fullName: "Đinh Bảo Trâm",
        email: "23110164@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "23110164",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "27/11/2026 09:30",
        qualRawScore: 82,
        qualDurationSec: 2490,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-403",
        fullName: "Vũ Tiến Dũng",
        email: "tiendung.vu@sgu.edu.vn",
        role: "MEMBER",
        isExternal: true,
        studentCode: "SGU-3123410082",
        schoolName: "ĐH Sài Gòn (SGU)",
        facultyMajor: "Công nghệ Thông tin",
        otpVerified: true,
        confirmedAt: "27/11/2026 10:15",
        qualRawScore: 80,
        qualDurationSec: 2540,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-404",
        fullName: "Nguyễn Hải Đăng",
        email: "24110087@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "24110087",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "27/11/2026 10:42",
        qualRawScore: 80,
        qualDurationSec: 2560,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-405",
        fullName: "Trần Gia Bảo",
        email: "24110118@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "24110118",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "27/11/2026 11:08",
        qualRawScore: 78,
        qualDurationSec: 2620,
        qualViolations: 3,
        qualDisqualified: true, // Edge 46 demo: 1 thành viên bị hủy bài do rời tab >= 3 lần trên Desktop
        participated: true
      }
    ],
    stageScores: { warmup: 15, accel: 24, finish: 40.5, audienceVotes: 108 },
    introVideo: {
      url: "https://drive.google.com/file/d/nullpointer-intro-video",
      submittedAt: "14/12/2026 09:30",
      status: "APPROVED",
      bgkVideoScore: 80
    }
  },
  {
    id: "team-05",
    teamCode: "MIT-005",
    teamName: "CloudCraft Five",
    joinCode: "MIT7C3R8",
    status: "APPROVED",
    advancementStatus: "CONFIRMED",
    awardTitle: "Khuyến khích",
    members: [
      {
        userId: "u-501",
        fullName: "Hoàng Nhật Linh",
        email: "23110277@student.hcmute.edu.vn",
        role: "LEADER",
        isExternal: false,
        studentCode: "23110277",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "27/11/2026 15:02",
        qualRawScore: 80,
        qualDurationSec: 2500,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-502",
        fullName: "Lâm Quốc Khánh",
        email: "23110288@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "23110288",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "27/11/2026 15:19",
        qualRawScore: 78,
        qualDurationSec: 2590,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-503",
        fullName: "Nguyễn Phương Nhi",
        email: "23133090@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "23133090",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Kỹ thuật Dữ liệu (133)",
        otpVerified: true,
        confirmedAt: "27/11/2026 15:35",
        qualRawScore: 76,
        qualDurationSec: 2610,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-504",
        fullName: "Phạm Văn Hậu",
        email: "24162044@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "24162044",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "An toàn Thông tin (162)",
        otpVerified: true,
        confirmedAt: "27/11/2026 15:52",
        qualRawScore: 74,
        qualDurationSec: 2660,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-505",
        fullName: "Trịnh Minh Đức",
        email: "minhduc.trinh@fpt.edu.vn",
        role: "MEMBER",
        isExternal: true,
        studentCode: "FPT-SE182411",
        schoolName: "ĐH FPT TP.HCM",
        facultyMajor: "Kỹ thuật Phần mềm",
        otpVerified: true,
        confirmedAt: "27/11/2026 16:20",
        qualRawScore: 72,
        qualDurationSec: 2700,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      }
    ],
    stageScores: { warmup: 14.5, accel: 23, finish: 39, audienceVotes: 95 },
    introVideo: {
      url: "",
      submittedAt: "",
      status: "NOT_SUBMITTED",
      bgkVideoScore: 0
    }
  },
  {
    id: "team-06",
    teamCode: "MIT-006",
    teamName: "Quantum Ducks",
    joinCode: "MIT5D1W4",
    status: "APPROVED",
    advancementStatus: "STANDBY",
    members: [
      {
        userId: "u-601",
        fullName: "Lê Hoàng Phúc",
        email: "23110510@student.hcmute.edu.vn",
        role: "LEADER",
        isExternal: false,
        studentCode: "23110510",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "28/11/2026 08:20",
        qualRawScore: 78,
        qualDurationSec: 2550,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-602",
        fullName: "Nguyễn Ngọc Trâm",
        email: "23110512@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "23110512",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "28/11/2026 08:40",
        qualRawScore: 76,
        qualDurationSec: 2600,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-603",
        fullName: "Đoàn Thanh Tùng",
        email: "24110333@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "24110333",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "28/11/2026 09:10",
        qualRawScore: 74,
        qualDurationSec: 2640,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-604",
        fullName: "Bạch Kim Ngân",
        email: "24133022@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "24133022",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Kỹ thuật Dữ liệu (133)",
        otpVerified: true,
        confirmedAt: "28/11/2026 09:25",
        qualRawScore: 74,
        qualDurationSec: 2680,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      },
      {
        userId: "u-605",
        fullName: "Phan Văn Kiệt",
        email: "vankiet.phan@ptithcm.edu.vn",
        role: "MEMBER",
        isExternal: true,
        studentCode: "PTIT-N23DCCN041",
        schoolName: "Học viện CNBCVT TP.HCM (PTIT)",
        facultyMajor: "Công nghệ Thông tin",
        otpVerified: true,
        confirmedAt: "28/11/2026 10:01",
        qualRawScore: 78,
        qualDurationSec: 2690,
        qualViolations: 0,
        qualDisqualified: false,
        participated: true
      }
    ],
    stageScores: { warmup: 0, accel: 0, finish: 0, audienceVotes: 0 }
  },
  {
    id: "team-07",
    teamCode: "MIT-007",
    teamName: "CyberPhoenix",
    joinCode: "MIT6P8Z1",
    status: "SUBMITTED",
    advancementStatus: "PENDING",
    members: [
      {
        userId: "u-701",
        fullName: "Trần Hữu Nhân",
        email: "24110401@student.hcmute.edu.vn",
        role: "LEADER",
        isExternal: false,
        studentCode: "24110401",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "29/11/2026 14:00",
        qualRawScore: 0,
        qualDurationSec: 0,
        qualViolations: 0,
        qualDisqualified: false,
        participated: false
      },
      {
        userId: "u-702",
        fullName: "Lê Ngọc Hân",
        email: "24110402@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "24110402",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "29/11/2026 14:15",
        qualRawScore: 0,
        qualDurationSec: 0,
        qualViolations: 0,
        qualDisqualified: false,
        participated: false
      },
      {
        userId: "u-703",
        fullName: "Nguyễn Đức Thịnh",
        email: "24162091@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "24162091",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "An toàn Thông tin (162)",
        otpVerified: true,
        confirmedAt: "29/11/2026 14:32",
        qualRawScore: 0,
        qualDurationSec: 0,
        qualViolations: 0,
        qualDisqualified: false,
        participated: false
      },
      {
        userId: "u-704",
        fullName: "Đỗ Minh Quân",
        email: "minhquan.do@tdtu.edu.vn",
        role: "MEMBER",
        isExternal: true,
        studentCode: "TDTU-52300142",
        schoolName: "ĐH Tôn Đức Thắng (TDTU)",
        facultyMajor: "Khoa học Máy tính",
        otpVerified: true,
        confirmedAt: "29/11/2026 15:08",
        qualRawScore: 0,
        qualDurationSec: 0,
        qualViolations: 0,
        qualDisqualified: false,
        participated: false
      },
      {
        userId: "u-705",
        fullName: "Phạm Bảo Châu",
        email: "24110455@student.hcmute.edu.vn",
        role: "MEMBER",
        isExternal: false,
        studentCode: "24110455",
        schoolName: "ĐH Công nghệ Kỹ thuật TP.HCM (HCM-UTE)",
        facultyMajor: "Công nghệ Thông tin (110)",
        otpVerified: true,
        confirmedAt: "29/11/2026 15:40",
        qualRawScore: 0,
        qualDurationSec: 0,
        qualViolations: 0,
        qualDisqualified: false,
        participated: false
      }
    ],
    stageScores: { warmup: 0, accel: 0, finish: 0, audienceVotes: 0 }
  }
];

export interface ComputedTeamQualResult {
  team: CompetitionTeamRecord;
  participatedCount: number;
  validMemberCount: number;
  hasDisqualifiedMember: boolean;
  teamDisqualifiedByPolicy: boolean;
  aggregatedScore: number;
  totalDurationSec: number;
  totalViolations: number;
  rank: number;
}

export function computeQualifyingStandings(
  teams: CompetitionTeamRecord[],
  scoringMode: TeamScoringMode,
  cheatingPolicy: CheatingPolicy,
  minParticipatedMembers: number
): ComputedTeamQualResult[] {
  const approvedTeams = teams.filter((t) => t.status === "APPROVED");

  const computed = approvedTeams.map((team) => {
    const participatedMembers = team.members.filter((m) => m.participated);
    const hasDisqualifiedMember = team.members.some((m) => m.qualDisqualified);
    const teamDisqualifiedByPolicy =
      team.advancementStatus === "DISQUALIFIED" ||
      (hasDisqualifiedMember && cheatingPolicy === "DISQUALIFY_TEAM");

    const validMembers = participatedMembers.filter((m) => !m.qualDisqualified);
    const sumScore = validMembers.reduce((acc, m) => acc + m.qualRawScore, 0);
    const totalDurationSec = participatedMembers.reduce((acc, m) => acc + m.qualDurationSec, 0);
    const totalViolations = participatedMembers.reduce((acc, m) => acc + m.qualViolations, 0);

    const meetsMin = participatedMembers.length >= minParticipatedMembers;
    let aggregatedScore = 0;
    if (!teamDisqualifiedByPolicy && meetsMin) {
      aggregatedScore =
        scoringMode === "SUM_OF_MEMBERS"
          ? sumScore
          : Number((sumScore / Math.max(1, team.members.length)).toFixed(2));
    }

    return {
      team,
      participatedCount: participatedMembers.length,
      validMemberCount: validMembers.length,
      hasDisqualifiedMember,
      teamDisqualifiedByPolicy,
      aggregatedScore,
      totalDurationSec,
      totalViolations,
      rank: 0
    };
  });

  computed.sort((a, b) => {
    if (a.teamDisqualifiedByPolicy !== b.teamDisqualifiedByPolicy) {
      return a.teamDisqualifiedByPolicy ? 1 : -1;
    }
    if (b.aggregatedScore !== a.aggregatedScore) {
      return b.aggregatedScore - a.aggregatedScore;
    }
    if (a.totalDurationSec !== b.totalDurationSec) {
      return a.totalDurationSec - b.totalDurationSec;
    }
    return a.totalViolations - b.totalViolations;
  });

  return computed.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

export function formatDurationMMSS(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}p ${String(secs).padStart(2, "0")}s`;
}
