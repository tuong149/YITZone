/** @typedef {"DAO_DUC" | "HOC_TAP" | "THE_LUC" | "TINH_NGUYEN" | "HOI_NHAP"} CriterionKey */

/**
 * @typedef {Object} CriterionCondition
 * @property {string} id
 * @property {string} label
 * @property {"MANDATORY" | "OPTIONAL"} group
 * @property {"YITZONE_AUTO" | "EXTERNAL_PROOF"} source
 * @property {"Cộng ĐRL" | "Cộng CTXH" | "Cộng CĐDN" | "Chức vụ Đoàn - Hội" | "Kết quả OJ"} [linkedBenefit]
 * @property {boolean} achieved
 * @property {string} [evidenceSummary]
 * @property {number} attachedApplicationsCount
 */

/**
 * @typedef {Object} Sv5tCriterion
 * @property {CriterionKey} key
 * @property {string} title
 * @property {number} optionalMinRequired
 * @property {CriterionCondition[]} conditions
 */

/**
 * @typedef {Object} Sv5tApplication
 * @property {string} id
 * @property {string} userId
 * @property {string} mssv
 * @property {string} fullName
 * @property {string} major
 * @property {string} cohort
 * @property {string} submittedAt
 * @property {number} autoEvidenceCount
 * @property {number} externalFilesCount
 * @property {"PENDING" | "SCREENED_OK" | "MISSING_DOCS"} preliminaryStatus
 * @property {string} preliminaryNote
 * @property {"PENDING" | "APPROVED" | "REJECTED" | "NEEDS_SUPPLEMENT"} councilStatus
 * @property {"NONE" | "APPEAL_OPEN_72H" | "APPEAL_RESOLVED"} appealStatus
 * @property {string} [appealNote]
 * @property {number} criteriaMetCount
 */

/**
 * @typedef {Object} HonorRollEntry
 * @property {string} id
 * @property {string} fullName
 * @property {string} mssv
 * @property {string} major
 * @property {"2025–2026" | "2024–2025"} academicYear
 * @property {"Cấp Trung ương" | "Cấp Thành" | "Cấp Trường" | "Cấp Liên chi hội Khoa"} tier
 * @property {string} certCode
 * @property {string} highlight
 * @property {string} portfolioUsername
 */

export const INITIAL_CRITERIA_TREE = [
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

export const INITIAL_APPLICATIONS = [
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
    criteriaMetCount: 5,
    criteriaReview: [
      { key: "DAO_DUC", title: "Đạo đức tốt", status: "OK", summary: "E-Cert Tọa đàm Tư tưởng HCM · Xác nhận không vi phạm" },
      { key: "HOC_TAP", title: "Học tập tốt", status: "OK", summary: "Bảng điểm năm học (PDF 1.40 MB) · Top 10 Vòng loại FIT ICPC" },
      { key: "THE_LUC", title: "Thể lực tốt", status: "OK", summary: "Giấy xác nhận Thanh niên khỏe · E-Cert FIT Games 2026" },
      { key: "TINH_NGUYEN", title: "Tình nguyện tốt", status: "OK", summary: "02 E-Cert: Mùa Hè Xanh FIT & Ngày Chủ nhật Xanh" },
      { key: "HOI_NHAP", title: "Hội nhập tốt", status: "OK", summary: "TOEIC 785 (JPG 1.80 MB) · E-Cert Seminar Cloud Nhật Bản" }
    ]
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
    criteriaMetCount: 5,
    criteriaReview: [
      { key: "DAO_DUC", title: "Đạo đức tốt", status: "OK", summary: "E-Cert Hành trình về nguồn FIT · Xác nhận ĐRL Xuất sắc" },
      { key: "HOC_TAP", title: "Học tập tốt", status: "OK", summary: "Bảng điểm chính thức (PDF 1.25 MB) · Giải Nhất NCKH cấp Trường" },
      { key: "THE_LUC", title: "Thể lực tốt", status: "OK", summary: "Chứng nhận Thanh niên khỏe · E-Cert Giải Việt dã FIT Games" },
      { key: "TINH_NGUYEN", title: "Tình nguyện tốt", status: "OK", summary: "Chiến sĩ Mùa Hè Xanh tiêu biểu · Hiến máu Sắc Đỏ CNTT" },
      { key: "HOI_NHAP", title: "Hội nhập tốt", status: "OK", summary: "Chứng chỉ IELTS 7.0 (PDF 0.95 MB) · E-Cert Seminar Quốc tế" }
    ]
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
    criteriaMetCount: 4,
    criteriaReview: [
      { key: "DAO_DUC", title: "Đạo đức tốt", status: "OK", summary: "E-Cert Tọa đàm Đạo đức IT · Không vi phạm quy chế" },
      { key: "HOC_TAP", title: "Học tập tốt", status: "OK", summary: "Bảng điểm chính thức (PDF 1.12 MB) · Top 5 CTF Sinh viên" },
      { key: "THE_LUC", title: "Thể lực tốt", status: "MISSING", summary: "Ảnh giấy Thanh niên khỏe bị mờ dấu · Đã bổ sung HCM-UTE Run 5km (phúc khảo)" },
      { key: "TINH_NGUYEN", title: "Tình nguyện tốt", status: "OK", summary: "E-Cert Xuân Tình Nguyện FIT 2026" },
      { key: "HOI_NHAP", title: "Hội nhập tốt", status: "OK", summary: "VSTEP B2 (JPG 1.60 MB) · E-Cert Kỹ năng xã hội" }
    ]
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
    criteriaMetCount: 5,
    criteriaReview: [
      { key: "DAO_DUC", title: "Đạo đức tốt", status: "OK", summary: "E-Cert Sinh hoạt chính trị · CTV Ban Văn phòng OFIT" },
      { key: "HOC_TAP", title: "Học tập tốt", status: "OK", summary: "Bảng điểm chính thức (PDF 1.35 MB) · Tham gia FIT Hackathon" },
      { key: "THE_LUC", title: "Thể lực tốt", status: "OK", summary: "Giấy xác nhận Thanh niên khỏe (JPG 2.10 MB) · FIT Games" },
      { key: "TINH_NGUYEN", title: "Tình nguyện tốt", status: "OK", summary: "E-Cert Mùa Hè Xanh FIT · Hiến máu nhân đạo" },
      { key: "HOI_NHAP", title: "Hội nhập tốt", status: "OK", summary: "TOEIC 720 (PDF 0.88 MB) · Seminar Cloud cùng chuyên gia" }
    ]
  }
];

export const INITIAL_HONOR_ROLL = [
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

export function cloneFreshCriteriaTree() {
  return INITIAL_CRITERIA_TREE.map((crit) => ({
    ...crit,
    conditions: crit.conditions.map((cond) => ({
      ...cond,
      attachedApplicationsCount: 0
    }))
  }));
}

export const INITIAL_AWARD_CYCLES = [
  {
    id: "sv5t-2025-2026",
    name: "Sinh viên 5 tốt Khoa CNTT — Năm học 2025–2026",
    academicYear: "2025–2026",
    status: "OPEN",
    openAt: "2026-10-15T08:00",
    deadline: "2026-11-30T23:59",
    appealHours: "72",
    goalRegisteredCount: 184,
    autoReadyCount: 92,
    publishedAt: null,
    criteriaTree: INITIAL_CRITERIA_TREE,
    applications: INITIAL_APPLICATIONS
  },
  {
    id: "sv5t-2024-2025",
    name: "Sinh viên 5 tốt Khoa CNTT — Năm học 2024–2025",
    academicYear: "2024–2025",
    status: "PUBLISHED",
    openAt: "2025-10-10T08:00",
    deadline: "2025-11-28T23:59",
    appealHours: "72",
    goalRegisteredCount: 162,
    autoReadyCount: 88,
    publishedAt: "15:30 05/12/2025",
    criteriaTree: INITIAL_CRITERIA_TREE,
    applications: [
      {
        id: "app-2425-01",
        userId: "21110112",
        mssv: "21110112",
        fullName: "Lê Minh Quân",
        major: "Kỹ thuật Phần mềm",
        cohort: "K21",
        submittedAt: "24/11/2025 · 18:10",
        autoEvidenceCount: 8,
        externalFilesCount: 4,
        preliminaryStatus: "SCREENED_OK",
        preliminaryNote: "Hồ sơ xuất sắc, đủ 5/5 tiêu chí và bài báo hội thảo quốc tế.",
        councilStatus: "APPROVED",
        appealStatus: "NONE",
        criteriaMetCount: 5,
        criteriaReview: [
          { key: "DAO_DUC", title: "Đạo đức tốt", status: "OK", summary: "ĐRL Xuất sắc · E-Cert Sinh hoạt chính trị" },
          { key: "HOC_TAP", title: "Học tập tốt", status: "OK", summary: "GPA 3.72 · Tác giả bài báo hội thảo khoa học" },
          { key: "THE_LUC", title: "Thể lực tốt", status: "OK", summary: "Chứng nhận Thanh niên khỏe · FIT Games 2025" },
          { key: "TINH_NGUYEN", title: "Tình nguyện tốt", status: "OK", summary: "E-Cert Mùa Hè Xanh FIT 2025" },
          { key: "HOI_NHAP", title: "Hội nhập tốt", status: "OK", summary: "IELTS 7.5 · Thủ lĩnh CLB Học thuật FIT" }
        ]
      },
      {
        id: "app-2425-02",
        userId: "21110620",
        mssv: "21110620",
        fullName: "Đặng Hoàng Phúc",
        major: "Công nghệ Thông tin",
        cohort: "K21",
        submittedAt: "25/11/2025 · 10:25",
        autoEvidenceCount: 7,
        externalFilesCount: 3,
        preliminaryStatus: "SCREENED_OK",
        preliminaryNote: "Đủ 5/5 tiêu chí, Giải Nhì ICPC Khu vực.",
        councilStatus: "APPROVED",
        appealStatus: "NONE",
        criteriaMetCount: 5,
        criteriaReview: [
          { key: "DAO_DUC", title: "Đạo đức tốt", status: "OK", summary: "E-Cert Hành trình về nguồn FIT 2025" },
          { key: "HOC_TAP", title: "Học tập tốt", status: "OK", summary: "Bảng điểm chính thức · Giải Nhì ICPC Khu vực" },
          { key: "THE_LUC", title: "Thể lực tốt", status: "OK", summary: "Giấy xác nhận Thanh niên khỏe" },
          { key: "TINH_NGUYEN", title: "Tình nguyện tốt", status: "OK", summary: "Đội trưởng Đội hình Phổ cập Tin học Cộng đồng" },
          { key: "HOI_NHAP", title: "Hội nhập tốt", status: "OK", summary: "TOEIC 820 · Seminar quốc tế FIT" }
        ]
      }
    ]
  },
  {
    id: "sv5t-2026-2027-draft",
    name: "Sinh viên 5 tốt Khoa CNTT — Năm học 2026–2027",
    academicYear: "2026–2027",
    status: "DRAFT",
    openAt: "2027-10-15T08:00",
    deadline: "2027-11-30T23:59",
    appealHours: "72",
    goalRegisteredCount: 0,
    autoReadyCount: 0,
    publishedAt: null,
    criteriaTree: cloneFreshCriteriaTree(),
    applications: []
  }
];
