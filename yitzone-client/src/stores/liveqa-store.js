import { create } from "zustand";

/** @typedef {"PENDING" | "APPROVED" | "ANSWERED" | "REJECTED"} QuestionStatus */

/**
 * @typedef {Object} ModQuestion
 * @property {string} id
 * @property {string} sessionId
 * @property {string} content
 * @property {boolean} anonymous
 * @property {string} realIdentity
 * @property {string} authorDisplay
 * @property {string[]} upvoterIds
 * @property {QuestionStatus} status
 * @property {boolean} onStage
 * @property {boolean} [unmasked]
 */

/**
 * @typedef {Object} ProfanityTerm
 * @property {string} id
 * @property {string} word
 * @property {"Live Q&A & Minigame"} scope
 * @property {boolean} active
 */

/**
 * @typedef {Object} QaSessionOption
 * @property {string} id
 * @property {string} eventId
 * @property {string} label
 * @property {string} pin
 */

export const DEFAULT_QA_SESSION = {
  id: "qa-EVT-2026-CLOUD-s1",
  eventId: "EVT-2026-CLOUD",
  label: "Hội thảo Cloud Native & DevOps 2026 · Buổi 1",
  pin: "482910"
};

const INITIAL_MOD_QUESTIONS = [
  {
    id: "mq-1",
    sessionId: DEFAULT_QA_SESSION.id,
    content: "Sinh viên chuyển ngành vào Khoa CNTT nhưng giữ MSSV cũ có được ghi nhận chuẩn CĐDN không?",
    anonymous: true,
    realIdentity: "22146091 · Võ Thanh Tùng",
    authorDisplay: "Sinh viên Khoa CNTT (Ẩn danh)",
    upvoterIds: ["sv1", "sv2", "sv3", "sv4"],
    status: "APPROVED",
    onStage: true
  },
  {
    id: "mq-2",
    sessionId: DEFAULT_QA_SESSION.id,
    content: "Cho em hỏi chuyển ngành sang CNTT giữ mã số cũ thì có tính CĐDN không ạ?",
    anonymous: true,
    realIdentity: "23110218 · Nguyễn Hoàng Nam",
    authorDisplay: "Sinh viên Khoa CNTT (Ẩn danh)",
    upvoterIds: ["sv2", "sv5"],
    status: "APPROVED",
    onStage: false
  },
  {
    id: "mq-3",
    sessionId: DEFAULT_QA_SESSION.id,
    content: "Lộ trình thực tập Java/React kỳ Xuân 2027 có yêu cầu tối thiểu bao nhiêu tín chỉ tích lũy ạ?",
    anonymous: false,
    realIdentity: "23110218 · Nguyễn Hoàng Nam",
    authorDisplay: "Nguyễn Hoàng Nam · K23 CNTT",
    upvoterIds: ["sv1", "sv3", "sv6"],
    status: "PENDING",
    onStage: false
  },
  {
    id: "mq-4",
    sessionId: DEFAULT_QA_SESSION.id,
    content: "Bình luận công kích cá nhân vi phạm nội quy hội trường",
    anonymous: true,
    realIdentity: "23110999 · Trần Văn X",
    authorDisplay: "Sinh viên Khoa CNTT (Ẩn danh)",
    upvoterIds: [],
    status: "PENDING",
    onStage: false
  }
];

const INITIAL_PROFANITY = [
  { id: "pf-1", word: "lừa đảo", scope: "Live Q&A & Minigame", active: true },
  { id: "pf-2", word: "vô học", scope: "Live Q&A & Minigame", active: true },
  { id: "pf-3", word: "spam", scope: "Live Q&A & Minigame", active: true }
];

export const useLiveQaStore = create((set) => ({
  questions: INITIAL_MOD_QUESTIONS,
  terms: INITIAL_PROFANITY,
  activeSessionId: DEFAULT_QA_SESSION.id,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setQuestions: (updater) => set((state) => ({ questions: updater(state.questions) })),
  setTerms: (updater) => set((state) => ({ terms: updater(state.terms) })),
  submitAudienceQuestion: ({ sessionId, content, anonymous, authorDisplay, realIdentity }) =>
    set((state) => ({
      questions: [
        {
          id: `mq-${Date.now()}`,
          sessionId,
          content,
          anonymous,
          realIdentity,
          authorDisplay,
          upvoterIds: ["me"],
          status: "PENDING",
          onStage: false
        },
        ...state.questions
      ]
    })),
  toggleUpvote: (questionId, voterId) =>
    set((state) => ({
      questions: state.questions.map((q) => {
        if (q.id !== questionId) return q;
        const has = q.upvoterIds.includes(voterId);
        return {
          ...q,
          upvoterIds: has ? q.upvoterIds.filter((id) => id !== voterId) : [...q.upvoterIds, voterId]
        };
      })
    }))
}));
