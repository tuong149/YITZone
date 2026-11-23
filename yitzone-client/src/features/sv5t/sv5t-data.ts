export type CriterionKey = "DAO_DUC" | "HOC_TAP" | "THE_LUC" | "TINH_NGUYEN" | "HOI_NHAP";

export interface CriterionCondition {
  id: string;
  label: string;
  group: "MANDATORY" | "OPTIONAL";
  source: "YITZONE_AUTO" | "EXTERNAL_PROOF";
  linkedBenefit?: "Cộng ĐRL" | "Cộng CTXH" | "Cộng CĐDN" | "Chức vụ Đoàn - Hội" | "Kết quả OJ";
  achieved: boolean;
  evidenceSummary?: string;
  attachedApplicationsCount: number; // Blocks deletion in when > 0
}

export interface Sv5tCriterion {
  key: CriterionKey;
  title: string;
  optionalMinRequired: number;
  conditions: CriterionCondition[];
}

export interface Sv5tApplication {
  id: string;
  userId: string; // Matches reviewer userId to demonstrate COI guard
  mssv: string;
  fullName: string;
  major: string;
  cohort: string;
  submittedAt: string;
  autoEvidenceCount: number;
  externalFilesCount: number;
  preliminaryStatus: "PENDING" | "SCREENED_OK" | "MISSING_DOCS";
  preliminaryNote: string;
  councilStatus: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_SUPPLEMENT";
  appealStatus: "NONE" | "APPEAL_OPEN_72H" | "APPEAL_RESOLVED";
  appealNote?: string;
  criteriaMetCount: number;
}

export interface HonorRollEntry {
  id: string;
  fullName: string;
  mssv: string;
  major: string;
  academicYear: "2025–2026" | "2024–2025";
  tier: "Cấp Trung ương" | "Cấp Thành" | "Cấp Trường" | "Cấp Liên chi hội Khoa";
  certCode: string;
  highlight: string;
  portfolioUsername: string;
}

export const INITIAL_CRITERIA_TREE: Sv5tCriterion[] = [
  {
    key: "DAO_DUC",
    title: "Đạo đức tốt",
    optionalMinRequired: 1,
    conditions: [
      {
        id: "dd-m1",
        label: "Không vi phạm pháp luật, quy chế đào tạo và nội quy nhà trường",
        group: "MANDATORY",
        source: "EXTERNAL_PROOF",
        achieved: false,
        attachedApplicationsCount: 18
      },
      {
        id: "dd-m2",
        label: "Tham gia các buổi sinh hoạt chính trị / tọa đàm đạo đức gắn nhãn SV5T",
        group: "MANDATORY",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng ĐRL",
        achieved: true,
        evidenceSummary: "Đã xác thực E-Cert: Tọa đàm Tư tưởng HCM & Bản lĩnh sinh viên IT",
        attachedApplicationsCount: 24
      },
      {
        id: "dd-o1",
        label: "Tham gia đội hình tuyên truyền pháp luật hoặc hoạt động Đền ơn đáp nghĩa",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng CTXH",
        achieved: true,
        evidenceSummary: "Đã xác thực E-Cert: Hành trình về nguồn FIT 2026",
        attachedApplicationsCount: 11
      },
      {
        id: "dd-o2",
        label: "Đảm nhiệm chức vụ BCH Đoàn – Hội / CTV tích cực hoàn thành nhiệm vụ",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Chức vụ Đoàn - Hội",
        achieved: false,
        attachedApplicationsCount: 0
      }
    ]
  },
  {
    key: "HOC_TAP",
    title: "Học tập tốt",
    optionalMinRequired: 1,
    conditions: [
      {
        id: "ht-m1",
        label: "Điểm trung bình chung học tập năm học đạt ngưỡng quy định (Bảng điểm chính thức)",
        group: "MANDATORY",
        source: "EXTERNAL_PROOF",
        achieved: false,
        attachedApplicationsCount: 24
      },
      {
        id: "ht-o1",
        label: "Tham gia cuộc thi Học thuật / FIT Hackathon / Online Judge cấp Khoa trở lên",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Kết quả OJ",
        achieved: true,
        evidenceSummary: "Đã xác thực: Top 10 Vòng loại FIT ICPC & E-Cert Hackathon",
        attachedApplicationsCount: 9
      },
      {
        id: "ht-o2",
        label: "Có đề tài Nghiên cứu khoa học sinh viên hoặc bài báo hội thảo",
        group: "OPTIONAL",
        source: "EXTERNAL_PROOF",
        achieved: false,
        attachedApplicationsCount: 5
      }
    ]
  },
  {
    key: "THE_LUC",
    title: "Thể lực tốt",
    optionalMinRequired: 1,
    conditions: [
      {
        id: "tl-m1",
        label: "Đạt chuẩn \"Thanh niên khỏe\" hoặc minh chứng hoàn thành giải chạy / thể thao cấp Khoa",
        group: "MANDATORY",
        source: "EXTERNAL_PROOF",
        achieved: false,
        attachedApplicationsCount: 16
      },
      {
        id: "tl-o1",
        label: "Tham gia Hội thao truyền thống Khoa CNTT (FIT Games)",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng ĐRL",
        achieved: true,
        evidenceSummary: "Đã xác thực E-Cert: Giải Việt dã FIT Games 2026",
        attachedApplicationsCount: 14
      }
    ]
  },
  {
    key: "TINH_NGUYEN",
    title: "Tình nguyện tốt",
    optionalMinRequired: 1,
    conditions: [
      {
        id: "tn-m1",
        label: "Tham gia ít nhất 01 chiến dịch tình nguyện lớn (Mùa Hè Xanh / Xuân Tình Nguyện) hoặc 05 ngày tình nguyện",
        group: "MANDATORY",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng CTXH",
        achieved: true,
        evidenceSummary: "Đã xác thực 02 E-Cert: Mùa Hè Xanh FIT & Ngày Chủ nhật Xanh",
        attachedApplicationsCount: 22
      },
      {
        id: "tn-o1",
        label: "Hiến máu nhân đạo hoặc tham gia hỗ trợ Tiếp sức mùa thi",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng CTXH",
        achieved: true,
        evidenceSummary: "Đã xác thực E-Cert: Ngày hội Hiến máu Sắc Đỏ CNTT",
        attachedApplicationsCount: 12
      }
    ]
  },
  {
    key: "HOI_NHAP",
    title: "Hội nhập tốt",
    optionalMinRequired: 1,
    conditions: [
      {
        id: "hn-m1",
        label: "Chứng chỉ ngoại ngữ đạt chuẩn quy định (IELTS / TOEIC / VSTEP còn hiệu lực)",
        group: "MANDATORY",
        source: "EXTERNAL_PROOF",
        achieved: false,
        attachedApplicationsCount: 20
      },
      {
        id: "hn-o1",
        label: "Hoàn thành khóa kỹ năng thực hành xã hội / Hội thảo quốc tế gắn nhãn CĐDN",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng CĐDN",
        achieved: true,
        evidenceSummary: "Đã xác thực E-Cert: Seminar Kiến trúc Cloud cùng Chuyên gia Nhật Bản",
        attachedApplicationsCount: 15
      },
      {
        id: "hn-o2",
        label: "Tham gia chương trình giao lưu sinh viên quốc tế / CLB Tiếng Anh IT",
        group: "OPTIONAL",
        source: "EXTERNAL_PROOF",
        achieved: false,
        attachedApplicationsCount: 3
      }
    ]
  }
];

export const INITIAL_APPLICATIONS: Sv5tApplication[] = [
  {
    id: "app-01",
    userId: "22110345",
    mssv: "22110345",
    fullName: "Nguyễn Minh Khôi (Tài khoản đang đăng nhập)",
    major: "Công nghệ Thông tin",
    cohort: "K22",
    submittedAt: "19/11/2026 · 20:14",
    autoEvidenceCount: 6,
    externalFilesCount: 3,
    preliminaryStatus: "SCREENED_OK",
    preliminaryNote: "Đủ 5/5 tiêu chí theo rà soát sơ bộ Ban SV5T.",
    councilStatus: "PENDING",
    appealStatus: "NONE",
    criteriaMetCount: 5
  },
  {
    id: "app-02",
    userId: "22110214",
    mssv: "22110214",
    fullName: "Trần Lê Bảo Ngọc",
    major: "Kỹ thuật Dữ liệu",
    cohort: "K22",
    submittedAt: "18/11/2026 · 15:40",
    autoEvidenceCount: 7,
    externalFilesCount: 4,
    preliminaryStatus: "SCREENED_OK",
    preliminaryNote: "Hồ sơ đầy đủ minh chứng E-Cert và IELTS 7.0 còn hạn.",
    councilStatus: "APPROVED",
    appealStatus: "NONE",
    criteriaMetCount: 5
  },
  {
    id: "app-03",
    userId: "23110188",
    mssv: "23110188",
    fullName: "Lê Quốc Bảo",
    major: "An toàn Thông tin",
    cohort: "K23",
    submittedAt: "19/11/2026 · 09:22",
    autoEvidenceCount: 5,
    externalFilesCount: 2,
    preliminaryStatus: "MISSING_DOCS",
    preliminaryNote: "Thiếu minh chứng giấy xác nhận Thanh niên khỏe (tiêu chí Thể lực).",
    councilStatus: "NEEDS_SUPPLEMENT",
    appealStatus: "APPEAL_OPEN_72H",
    appealNote: "Đã nộp bổ sung chứng nhận hoàn thành giải chạy HCM-UTE Run 5km ngày 10/11/2026.",
    criteriaMetCount: 4
  },
  {
    id: "app-04",
    userId: "23110402",
    mssv: "23110402",
    fullName: "Phạm Thảo Vy",
    major: "Công nghệ Thông tin",
    cohort: "K23",
    submittedAt: "20/11/2026 · 11:05",
    autoEvidenceCount: 6,
    externalFilesCount: 3,
    preliminaryStatus: "PENDING",
    preliminaryNote: "Mới nộp — chờ CTV Ban SV5T thẩm tra sơ bộ.",
    councilStatus: "PENDING",
    appealStatus: "NONE",
    criteriaMetCount: 5
  }
];

export const INITIAL_HONOR_ROLL: HonorRollEntry[] = [
  {
    id: "hr-1",
    fullName: "Trần Lê Bảo Ngọc",
    mssv: "22110214",
    major: "Kỹ thuật Dữ liệu",
    academicYear: "2025–2026",
    tier: "Cấp Trung ương",
    certCode: "YIT-SV5T-2026-0001",
    highlight: "Nghiên cứu khoa học giải Nhất cấp Trường · Chiến sĩ Mùa Hè Xanh tiêu biểu",
    portfolioUsername: "baongoc-fit"
  },
  {
    id: "hr-2",
    fullName: "Đặng Hoàng Phúc",
    mssv: "21110620",
    major: "Công nghệ Thông tin",
    academicYear: "2025–2026",
    tier: "Cấp Thành",
    certCode: "YIT-SV5T-2026-0014",
    highlight: "Giải Nhì ICPC Khu vực · Đội trưởng Đội hình Phổ cập Tin học Cộng đồng",
    portfolioUsername: "hoangphuc-dev"
  },
  {
    id: "hr-3",
    fullName: "Nguyễn Thị Thanh Trúc",
    mssv: "22110498",
    major: "An toàn Thông tin",
    academicYear: "2025–2026",
    tier: "Cấp Trường",
    certCode: "YIT-SV5T-2026-0032",
    highlight: "Top 5 CTF Sinh viên An toàn Thông tin · Trưởng nhóm Truyền thông EMFIT",
    portfolioUsername: "thanhtruc-sec"
  },
  {
    id: "hr-4",
    fullName: "Võ Gia Huy",
    mssv: "23110290",
    major: "Công nghệ Thông tin",
    academicYear: "2025–2026",
    tier: "Cấp Liên chi hội Khoa",
    certCode: "YIT-SV5T-2026-0065",
    highlight: "Hoàn thành xuất sắc 5/5 tiêu chí · CTV tiêu biểu Ban Văn phòng OFIT",
    portfolioUsername: "giahuy-k23"
  },
  {
    id: "hr-5",
    fullName: "Lê Minh Quân",
    mssv: "21110112",
    major: "Kỹ thuật Phần mềm",
    academicYear: "2024–2025",
    tier: "Cấp Thành",
    certCode: "YIT-SV5T-2025-0009",
    highlight: "Tác giả bài báo hội thảo khoa học quốc tế · Thủ lĩnh CLB Học thuật FIT",
    portfolioUsername: "minhquan-se"
  }
];
