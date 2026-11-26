import { create } from "zustand";
import { useAuthStore } from "@/stores/auth-store";

/**
 * @typedef {Object} SessionActivityConfig
 * @property {boolean} liveQa
 * @property {boolean} liveVoting
 * @property {boolean} [liveVotingSecret]
 * @property {boolean} minigame
 * @property {boolean} quizExam
 * @property {number} [quizMinutes]
 * @property {number} [quizPassRate]
 * @property {"SUM_OF_MEMBERS" | "AVG_OF_MEMBERS"} [quizTeamScoringMode]
 * @property {number} [quizQualifyTopN]
 */

export function createDefaultSessionActivities(
  overrides = {}
) {
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

/**
 * @typedef {Object} EventSessionRecord
 * @property {string} id
 * @property {string} step
 * @property {string} name
 * @property {string} date
 * @property {string} timeRange
 * @property {string} location
 * @property {string} topic
 * @property {string} checkIn
 * @property {string} checkOut
 * @property {SessionActivityConfig} activities
 */

/**
 * @typedef {Object} BtcRoleDraft
 * @property {string} id
 * @property {string} title
 * @property {boolean} enabled
 */

/** @typedef {| "DRAFT" | "PENDING_BTV" | "PUBLISHED" | "REG_CLOSED" | "ONGOING" | "COMPLETED"} EventLifecycleStatus */

/**
 * @typedef {Object} StoredEventRecord
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} coverImage
 * @property {string} day
 * @property {string} month
 * @property {string} dateSummary
 * @property {string} timeShort
 * @property {string} location
 * @property {string} lockNote
 * @property {string} closeAt
 * @property {"FACULTY" | "DEPT_INTERNAL"} scope
 * @property {"PUBLIC_FACULTY" | "INTERNAL_CTV"} visibility
 * @property {EventLifecycleStatus} status
 * @property {string[]} benefits
 * @property {string} [sv5tTag]
 * @property {number} registeredCount
 * @property {number} waitlistCount
 * @property {number} capacity
 * @property {string[]} highlights
 * @property {EventSessionRecord[]} sessions
 * @property {string[]} btcRoles
 * @property {RegistrationFormMode} formMode
 * @property {RegistrationFormField[]} formFields
 * @property {boolean} hasExam
 * @property {number} [examMinutes]
 * @property {number} [examPassRate]
 * @property {string} [examPath]
 * @property {boolean} isTeamCompetition
 * @property {number} [minTeamSize]
 * @property {number} [maxTeamSize]
 * @property {number} [qualifyTopN]
 * @property {"SUM_OF_MEMBERS" | "AVG_OF_MEMBERS"} [scoringMode]
 * @property {boolean} [allowExternal]
 * @property {string} [revisionNote]
 */

/**
 * @typedef {Object} StudentRegistrationRecord
 * @property {string} eventId
 * @property {string} registeredAt
 * @property {Record<string, string | string[] | boolean>} answers
 */

/**
 * @typedef {Object} WizardSessionDraft
 * @property {string} id
 * @property {string} name
 * @property {string} date
 * @property {string} timeRange
 * @property {string} location
 * @property {SessionActivityConfig} activities
 */

/**
 * @typedef {Object} EventWizardDraft
 * @property {string | null} editingEventId
 * @property {1 | 2 | 3 | 4 | 5} step
 * @property {string} coverImage
 * @property {string} title
 * @property {"FACULTY" | "DEPT_INTERNAL"} scope
 * @property {string} capacity
 * @property {string} registrationCloseAt
 * @property {string} description
 * @property {string[]} selectedBenefits
 * @property {WizardSessionDraft[]} sessions
 * @property {boolean} enableTeamRounds
 * @property {string} minTeamSize
 * @property {string} maxTeamSize
 * @property {boolean} allowExternal
 * @property {RegistrationFormMode} formMode
 * @property {RegistrationFormField[]} formFields
 * @property {BtcRoleDraft[]} btcRoles
 * @property {string | null} lastSavedAt
 */

export const DEFAULT_WIZARD_SESSIONS = [
  {
    id: "ses-1",
    name: "Buổi 1 · Phiên chính",
    date: "",
    timeRange: "08:00 – 11:30",
    location: "",
    activities: createDefaultSessionActivities()
  }
];

export const DEFAULT_BTC_ROLES = [
  { id: "btc-1", title: "MC", enabled: true },
  { id: "btc-2", title: "Lễ tân", enabled: true },
  { id: "btc-3", title: "Hậu cần", enabled: true },
  { id: "btc-4", title: "Điều phối", enabled: true },
  { id: "btc-5", title: "Truyền thông", enabled: true },
  { id: "btc-6", title: "Văn nghệ", enabled: false },
  { id: "btc-7", title: "Kỹ thuật", enabled: true }
];

export function createInitialWizardDraft() {
  return {
    editingEventId: null,
    step: 1,
    coverImage: "/images/hero-campus.jpg",
    title: "",
    scope: "FACULTY",
    capacity: "200",
    registrationCloseAt: "",
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
const REG_STORAGE_PREFIX = "yitzone-event-registrations-v1";

function getRegStorageKey(userId) {
  return userId ? `${REG_STORAGE_PREFIX}:${userId}` : null;
}

function loadDraftFromStorage() {
  if (typeof window === "undefined") return createInitialWizardDraft();
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return createInitialWizardDraft();
    const parsed = JSON.parse(raw);
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

function saveDraftToStorage(draft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore quota errors
  }
}

function loadRegistrationsFromStorage(userId) {
  if (typeof window === "undefined") return {};
  const key = getRegStorageKey(userId);
  if (!key) return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveRegistrationsToStorage(
  userId,
  regs
) {
  if (typeof window === "undefined") return;
  const key = getRegStorageKey(userId);
  if (!key) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(regs));
  } catch {
    // Ignore quota errors
  }
}

const INITIAL_EVENTS = [];

const LEGACY_SPOTLIGHT_STORAGE_KEY = "yitzone-home-spotlight-v1";
const SPOTLIGHT_STORAGE_KEY = "yitzone-home-spotlight-v2";

function loadSpotlightConfig() {
  const defaults = {
    eventId: null,
    showCoverImage: true,
    showCapacityBar: true
  };
  if (typeof window === "undefined") return defaults;
  try {
    window.localStorage.removeItem(LEGACY_SPOTLIGHT_STORAGE_KEY);
    const raw = window.localStorage.getItem(SPOTLIGHT_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...(parsed && typeof parsed === "object" ? parsed : {})
    };
  } catch {
    return defaults;
  }
}

function saveSpotlightConfig(config) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SPOTLIGHT_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

export const useEventStore = create((set) => ({
  events: INITIAL_EVENTS,
  registrations: loadRegistrationsFromStorage(useAuthStore.getState().userId),
  wizardDraft: loadDraftFromStorage(),
  homeSpotlight: loadSpotlightConfig(),

  setSpotlightEvent: (eventId) =>
    set((state) => {
      const next = { ...state.homeSpotlight, eventId };
      saveSpotlightConfig(next);
      return { homeSpotlight: next };
    }),

  updateHomeSpotlight: (patch) =>
    set((state) => {
      const next = { ...state.homeSpotlight, ...patch };
      saveSpotlightConfig(next);
      return { homeSpotlight: next };
    }),

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
      const userId = useAuthStore.getState().userId;
      if (!userId || state.registrations[eventId]) return state;
      const targetEvent = state.events.find((e) => e.id === eventId);
      if (targetEvent && targetEvent.capacity > 0 && targetEvent.registeredCount >= targetEvent.capacity) {
        return state;
      }
      const nextRegs = {
        ...state.registrations,
        [eventId]: {
          eventId,
          registeredAt: new Date().toLocaleString("vi-VN"),
          answers
        }
      };
      saveRegistrationsToStorage(userId, nextRegs);
      return {
        registrations: nextRegs,
        events: state.events.map((e) =>
          e.id === eventId ? { ...e, registeredCount: e.registeredCount + 1 } : e
        )
      };
    }),

  cancelRegistration: (eventId) =>
    set((state) => {
      const userId = useAuthStore.getState().userId;
      if (!userId || !state.registrations[eventId]) return state;
      const nextRegs = { ...state.registrations };
      delete nextRegs[eventId];
      saveRegistrationsToStorage(userId, nextRegs);
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
      const next = {
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
      const mergedBtcRoles = DEFAULT_BTC_ROLES.map((r) => ({
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

      const nextDraft = {
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

let prevAuthUserId = useAuthStore.getState().userId;
useAuthStore.subscribe((state) => {
  if (state.userId !== prevAuthUserId) {
    prevAuthUserId = state.userId;
    useEventStore.setState({
      registrations: loadRegistrationsFromStorage(state.userId)
    });
  }
});
