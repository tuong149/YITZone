import { create } from "zustand";

/** @typedef {| "STAR_5" | "LIKERT_5" | "SINGLE_CHOICE" | "MULTI_CHOICE" | "ESSAY"} SurveyQuestionType */

/** @typedef {"Sau sự kiện" | "Toàn Khoa" | "Nội bộ Ban/Tổ"} SurveyScope */
/** @typedef {"IDENTIFIED" | "ANONYMOUS"} SurveyMode */
/** @typedef {"DRAFT" | "OPEN" | "CLOSED"} SurveyStatus */

/**
 * @typedef {Object} SurveyQuestion
 * @property {string} id
 * @property {SurveyQuestionType} type
 * @property {string} prompt
 * @property {boolean} required
 * @property {string[]} [options]
 * @property {boolean} [allowOther]
 */

/**
 * @typedef {Object} SurveyRatingBucket
 * @property {string} label
 * @property {number} pct
 */

/**
 * @typedef {Object} SurveyRecord
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {SurveyScope} scope
 * @property {SurveyMode} mode
 * @property {SurveyStatus} status
 * @property {number} responsesCount
 * @property {SurveyQuestion[]} questions
 * @property {SurveyRatingBucket[]} ratingBreakdown
 */

/**
 * @typedef {Object} SurveyTemplateRecord
 * @property {string} id
 * @property {string} name
 * @property {SurveyScope} defaultScope
 * @property {SurveyMode} defaultMode
 * @property {SurveyQuestion[]} questions
 */

export const DEFAULT_LIKERT_OPTIONS = [
  "Rất không hài lòng",
  "Chưa hài lòng",
  "Bình thường",
  "Hài lòng",
  "Rất hài lòng"
];

export const QUESTION_TYPE_LABELS = {
  STAR_5: "Đánh giá Sao (1–5)",
  LIKERT_5: "Thang Likert 5 mức",
  SINGLE_CHOICE: "Chọn 1 phương án",
  MULTI_CHOICE: "Chọn nhiều phương án",
  ESSAY: "Tự luận (Góp ý)"
};

const WORKSHOP_QUESTIONS = [
  {
    id: "q-ws-1",
    type: "STAR_5",
    prompt: "Mức độ hài lòng tổng quan về chương trình",
    required: true
  },
  {
    id: "q-ws-2",
    type: "LIKERT_5",
    prompt: "Công tác tổ chức, đón tiếp và điểm danh QR",
    required: true
  },
  {
    id: "q-ws-3",
    type: "SINGLE_CHOICE",
    prompt: "Phần nội dung bạn ấn tượng nhất?",
    required: true,
    options: [
      "Nội dung chuyên môn & thực hành",
      "Diễn giả & chia sẻ thực chiến",
      "Khâu tổ chức & check-in QR"
    ],
    allowOther: true
  },
  {
    id: "q-ws-4",
    type: "MULTI_CHOICE",
    prompt: "Chủ đề hội thảo học thuật bạn mong muốn sắp tới?",
    required: false,
    options: [
      "Cloud Native & Kubernetes",
      "AI ứng dụng & LLM",
      "An toàn thông tin (CTF)",
      "Luyện thi ICPC / Thuật toán",
      "Kỹ năng phỏng vấn & CV"
    ]
  },
  {
    id: "q-ws-5",
    type: "ESSAY",
    prompt: "Góp ý cải thiện cho Ban Tổ chức",
    required: false
  }
];

const INTERNAL_DUTY_QUESTIONS = [
  {
    id: "q-of-1",
    type: "STAR_5",
    prompt: "Mức độ hài lòng chung về phân công ca trực Văn phòng Ban OFIT",
    required: true
  },
  {
    id: "q-of-2",
    type: "LIKERT_5",
    prompt: "Quy trình xin vắng và đăng ký ca bù hiện tại có thuận tiện không?",
    required: true
  },
  {
    id: "q-of-3",
    type: "SINGLE_CHOICE",
    prompt: "Khung giờ trực bạn gặp khó khăn nhất trong học kỳ này?",
    required: true,
    options: ["Ca 1 (07:30–09:30)", "Ca 2 (09:30–11:30)", "Ca 3 (13:00–15:00)", "Ca 4 (15:00–17:00)"],
    allowOther: false
  },
  {
    id: "q-of-4",
    type: "ESSAY",
    prompt: "Đề xuất cải thiện cơ sở vật chất hoặc quy trình trực VP (hoàn toàn ẩn danh)",
    required: false
  }
];

const FACULTY_ACADEMIC_QUESTIONS = [
  {
    id: "q-ac-1",
    type: "MULTI_CHOICE",
    prompt: "Bạn quan tâm nhất đến nhóm chuyên đề học thuật nào trong Học kỳ 2?",
    required: true,
    options: [
      "Backend & Kiến trúc hệ thống phân tán",
      "Frontend hiện đại & UI Engineering",
      "AI / Machine Learning ứng dụng",
      "DevOps, Docker & CI/CD",
      "An ninh mạng & CTF"
    ]
  },
  {
    id: "q-ac-2",
    type: "SINGLE_CHOICE",
    prompt: "Hình thức tổ chức bạn ưu tiên tham gia?",
    required: true,
    options: [
      "Workshop thực hành trực tiếp tại phòng máy",
      "Hội thảo chuyên đề tại Hội trường lớn",
      "Chuỗi Talkshow trực tuyến buổi tối"
    ],
    allowOther: true
  },
  {
    id: "q-ac-3",
    type: "LIKERT_5",
    prompt: "Mức độ phù hợp của lịch tổ chức hoạt động học thuật hiện tại với thời khóa biểu",
    required: true
  },
  {
    id: "q-ac-4",
    type: "ESSAY",
    prompt: "Đề xuất diễn giả, doanh nghiệp hoặc chủ đề cụ thể bạn muốn Khoa mời",
    required: false
  }
];

function cloneQuestions(questions) {
  return questions.map((q) => ({
    ...q,
    id: `q-${crypto.randomUUID().slice(0, 8)}`,
    options: q.options ? [...q.options] : undefined
  }));
}

const INITIAL_SURVEYS = [
  {
    id: "evt-cloud-2026",
    title: "Đánh giá Hội thảo Cloud Native & DevOps 2026",
    description:
      "Hoàn thành khảo sát ngắn sau Check-out để mở khóa E-Certificate sự kiện. Dữ liệu giúp BTC nâng cao chất lượng các buổi chuyên đề.",
    scope: "Sau sự kiện",
    mode: "IDENTIFIED",
    status: "OPEN",
    responsesCount: 42,
    questions: WORKSHOP_QUESTIONS,
    ratingBreakdown: [
      { label: "5 sao · Rất hài lòng", pct: 64 },
      { label: "4 sao · Hài lòng", pct: 26 },
      { label: "3 sao · Bình thường", pct: 8 },
      { label: "1–2 sao · Cần cải thiện", pct: 2 }
    ]
  },
  {
    id: "anon-ofit-2026",
    title: "Khảo sát Ẩn danh Chất lượng Trực VP Ban OFIT",
    description:
      "Mỗi thành viên nộp tối đa 1 lần. Câu trả lời được tách bảng khỏi tài khoản và chỉ mở thống kê khi đạt tối thiểu 5 phản hồi.",
    scope: "Nội bộ Ban/Tổ",
    mode: "ANONYMOUS",
    status: "OPEN",
    responsesCount: 3,
    questions: INTERNAL_DUTY_QUESTIONS,
    ratingBreakdown: [
      { label: "5 sao · Rất hài lòng", pct: 67 },
      { label: "4 sao · Hài lòng", pct: 33 },
      { label: "3 sao · Bình thường", pct: 0 },
      { label: "1–2 sao · Cần cải thiện", pct: 0 }
    ]
  },
  {
    id: "all-fit-hk1",
    title: "Lấy ý kiến Chủ đề Học thuật Học kỳ 2 (2026–2027)",
    description:
      "Khảo sát ẩn danh toàn Khoa CNTT nhằm lựa chọn chuỗi workshop, diễn giả và khung giờ phù hợp nhất cho sinh viên.",
    scope: "Toàn Khoa",
    mode: "ANONYMOUS",
    status: "OPEN",
    responsesCount: 68,
    questions: FACULTY_ACADEMIC_QUESTIONS,
    ratingBreakdown: [
      { label: "5 sao · Rất hài lòng", pct: 58 },
      { label: "4 sao · Hài lòng", pct: 31 },
      { label: "3 sao · Bình thường", pct: 9 },
      { label: "1–2 sao · Cần cải thiện", pct: 2 }
    ]
  }
];

const INITIAL_TEMPLATES = [
  {
    id: "st-1",
    name: "Mẫu chuẩn Đánh giá Hội thảo / Workshop",
    defaultScope: "Sau sự kiện",
    defaultMode: "IDENTIFIED",
    questions: WORKSHOP_QUESTIONS
  },
  {
    id: "st-2",
    name: "Mẫu khảo sát Nhu cầu Học thuật Toàn Khoa",
    defaultScope: "Toàn Khoa",
    defaultMode: "ANONYMOUS",
    questions: FACULTY_ACADEMIC_QUESTIONS
  },
  {
    id: "st-3",
    name: "Mẫu đánh giá Nội bộ Cuối học kỳ 4 Ban – 9 Tổ",
    defaultScope: "Nội bộ Ban/Tổ",
    defaultMode: "ANONYMOUS",
    questions: INTERNAL_DUTY_QUESTIONS
  }
];

export const useSurveyStore = create((set, get) => ({
  surveys: INITIAL_SURVEYS,
  templates: INITIAL_TEMPLATES,

  createSurvey: ({ title, description, scope, mode, templateId }) => {
    const template = templateId ? get().templates.find((t) => t.id === templateId) : undefined;
    const baseQuestions = template
      ? cloneQuestions(template.questions)
      : [
          {
            id: `q-${crypto.randomUUID().slice(0, 8)}`,
            type: "STAR_5",
            prompt: "Mức độ hài lòng tổng quan của bạn",
            required: true
          }
        ];

    const created = {
      id: `sur-${crypto.randomUUID().slice(0, 8)}`,
      title: title.trim(),
      description:
        description?.trim() ||
        (mode === "ANONYMOUS"
          ? "Khảo sát ẩn danh tách bảng tài khoản. Thống kê chi tiết chỉ mở khi đạt tối thiểu 5 phản hồi."
          : "Hoàn thành khảo sát để đóng góp ý kiến cho Khoa CNTT HCM-UTE."),
      scope,
      mode,
      status: "DRAFT",
      responsesCount: 0,
      questions: baseQuestions,
      ratingBreakdown: [
        { label: "5 sao · Rất hài lòng", pct: 0 },
        { label: "4 sao · Hài lòng", pct: 0 },
        { label: "3 sao · Bình thường", pct: 0 },
        { label: "1–2 sao · Cần cải thiện", pct: 0 }
      ]
    };

    set((state) => ({ surveys: [created, ...state.surveys] }));
    return created;
  },

  updateSurvey: (id, patch) =>
    set((state) => ({
      surveys: state.surveys.map((s) => (s.id === id ? { ...s, ...patch } : s))
    })),

  setSurveyStatus: (id, status) =>
    set((state) => ({
      surveys: state.surveys.map((s) => (s.id === id ? { ...s, status } : s))
    })),

  duplicateSurvey: (id) => {
    const target = get().surveys.find((s) => s.id === id);
    if (!target) return null;
    const copy = {
      ...target,
      id: `sur-${crypto.randomUUID().slice(0, 8)}`,
      title: `${target.title} (Bản sao)`,
      status: "DRAFT",
      responsesCount: 0,
      questions: cloneQuestions(target.questions)
    };
    set((state) => ({ surveys: [copy, ...state.surveys] }));
    return copy;
  },

  deleteSurvey: (id) => {
    const target = get().surveys.find((s) => s.id === id);
    if (!target || target.responsesCount > 0) return false;
    set((state) => ({ surveys: state.surveys.filter((s) => s.id !== id) }));
    return true;
  },

  recordSurveySubmission: (id) =>
    set((state) => ({
      surveys: state.surveys.map((s) =>
        s.id === id ? { ...s, responsesCount: s.responsesCount + 1 } : s
      )
    })),

  createTemplate: ({ name, defaultScope, defaultMode, questions }) => {
    const created = {
      id: `tpl-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      defaultScope,
      defaultMode,
      questions:
        questions && questions.length > 0
          ? cloneQuestions(questions)
          : [
              {
                id: `q-${crypto.randomUUID().slice(0, 8)}`,
                type: "STAR_5",
                prompt: "Mức độ hài lòng tổng quan",
                required: true
              },
              {
                id: `q-${crypto.randomUUID().slice(0, 8)}`,
                type: "ESSAY",
                prompt: "Góp ý cải thiện cho Ban Tổ chức",
                required: false
              }
            ]
    };
    set((state) => ({ templates: [created, ...state.templates] }));
    return created;
  },

  updateTemplateQuestions: (id, questions) =>
    set((state) => ({
      templates: state.templates.map((t) => (t.id === id ? { ...t, questions } : t))
    })),

  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id)
    }))
}));
