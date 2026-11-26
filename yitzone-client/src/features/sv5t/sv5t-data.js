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
 * @property {string} academicYear
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
        attachedApplicationsCount: 0
      },
      {
        id: "dd-m2",
        label: "Tham gia các buổi sinh hoạt chính trị / tọa đàm đạo đức gắn nhãn SV5T",
        group: "MANDATORY",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng ĐRL",
        achieved: false,
        attachedApplicationsCount: 0
      },
      {
        id: "dd-o1",
        label: "Tham gia đội hình tuyên truyền pháp luật hoặc hoạt động Đền ơn đáp nghĩa",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng CTXH",
        achieved: false,
        attachedApplicationsCount: 0
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
        attachedApplicationsCount: 0
      },
      {
        id: "ht-o1",
        label: "Tham gia cuộc thi Học thuật / FIT Hackathon / Online Judge cấp Khoa trở lên",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Kết quả OJ",
        achieved: false,
        attachedApplicationsCount: 0
      },
      {
        id: "ht-o2",
        label: "Có đề tài Nghiên cứu khoa học sinh viên hoặc bài báo hội thảo",
        group: "OPTIONAL",
        source: "EXTERNAL_PROOF",
        achieved: false,
        attachedApplicationsCount: 0
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
        attachedApplicationsCount: 0
      },
      {
        id: "tl-o1",
        label: "Tham gia Hội thao truyền thống Khoa CNTT (FIT Games)",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng ĐRL",
        achieved: false,
        attachedApplicationsCount: 0
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
        achieved: false,
        attachedApplicationsCount: 0
      },
      {
        id: "tn-o1",
        label: "Hiến máu nhân đạo hoặc tham gia hỗ trợ Tiếp sức mùa thi",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng CTXH",
        achieved: false,
        attachedApplicationsCount: 0
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
        attachedApplicationsCount: 0
      },
      {
        id: "hn-o1",
        label: "Hoàn thành khóa kỹ năng thực hành xã hội / Hội thảo quốc tế gắn nhãn CĐDN",
        group: "OPTIONAL",
        source: "YITZONE_AUTO",
        linkedBenefit: "Cộng CĐDN",
        achieved: false,
        attachedApplicationsCount: 0
      },
      {
        id: "hn-o2",
        label: "Tham gia chương trình giao lưu sinh viên quốc tế / CLB Tiếng Anh IT",
        group: "OPTIONAL",
        source: "EXTERNAL_PROOF",
        achieved: false,
        attachedApplicationsCount: 0
      }
    ]
  }
];

export const INITIAL_APPLICATIONS = [];

export const INITIAL_HONOR_ROLL = [];

export function cloneFreshCriteriaTree() {
  return INITIAL_CRITERIA_TREE.map((crit) => ({
    ...crit,
    conditions: crit.conditions.map((cond) => ({
      ...cond,
      attachedApplicationsCount: 0
    }))
  }));
}

export const INITIAL_AWARD_CYCLES = [];
