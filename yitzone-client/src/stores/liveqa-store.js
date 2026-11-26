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
  id: "",
  eventId: "",
  label: "Chưa có phiên Live Q&A đang mở",
  pin: ""
};

const INITIAL_MOD_QUESTIONS = [];

const INITIAL_PROFANITY = [];

export const useLiveQaStore = create((set) => ({
  questions: INITIAL_MOD_QUESTIONS,
  terms: INITIAL_PROFANITY,
  activeSessionId: "",
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
