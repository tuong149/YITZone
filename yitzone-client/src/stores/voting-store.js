import { create } from "zustand";

/** @typedef {"DRAFT" | "OPEN" | "CLOSED"} CampaignStatus */
/** @typedef {"EVENT" | "STANDALONE"} CampaignSource */

/**
 * @typedef {Object} CandidateItem
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} [subtitle]
 * @property {number} audienceVotes
 * @property {number} judgeScore
 */

/**
 * @typedef {Object} AdminVotingCampaign
 * @property {string} id
 * @property {string} title
 * @property {string} pin
 * @property {CampaignSource} source
 * @property {string} [eventId]
 * @property {string} [eventLabel]
 * @property {string} [sessionLabel]
 * @property {boolean} requireAttendance
 * @property {CampaignStatus} status
 * @property {boolean} isSecretBallot
 * @property {boolean} [secretUnsealed]
 * @property {boolean} usesJudges
 * @property {number} judgeWeight
 * @property {boolean} freezeMode
 * @property {number} voterCount
 * @property {number} [expectedVoters]
 * @property {CandidateItem[]} candidates
 */

export const INITIAL_VOTING_CAMPAIGNS = [
  {
    id: "gala-fit-2026",
    title: "Bình chọn Tiết mục Yêu thích — Đêm Gala FIT 2026",
    pin: "904218",
    source: "EVENT",
    eventId: "EVT-2026-MASTERING-IT",
    eventLabel: "Đêm Gala Văn nghệ FIT 2026",
    sessionLabel: "Buổi 1 · Đêm công diễn",
    requireAttendance: true,
    status: "OPEN",
    isSecretBallot: false,
    usesJudges: true,
    judgeWeight: 60,
    freezeMode: false,
    voterCount: 429,
    candidates: [
      { id: "c-1", code: "01", name: "Mashup Tuổi trẻ FIT (Đội Hát ARTIT)", audienceVotes: 148, judgeScore: 91 },
      { id: "c-2", code: "02", name: "Nhảy Hiện đại Cyber Pulse (Tổ Nhảy ARTIT)", audienceVotes: 162, judgeScore: 88 },
      { id: "c-3", code: "03", name: "Hòa tấu Guitar & Cajon (CLB Acoustic FIT)", audienceVotes: 119, judgeScore: 94 }
    ]
  },
  {
    id: "congress-2026",
    title: "Biểu quyết Nghị quyết Đại hội Đoàn Khoa CNTT 2026",
    pin: "612804",
    source: "EVENT",
    eventId: "EVT-2026-CLOUD",
    eventLabel: "Đại hội Đại biểu Đoàn Khoa CNTT",
    sessionLabel: "Phiên toàn thể",
    requireAttendance: true,
    status: "OPEN",
    isSecretBallot: true,
    secretUnsealed: false,
    usesJudges: false,
    judgeWeight: 0,
    freezeMode: false,
    voterCount: 118,
    expectedVoters: 150,
    candidates: [
      { id: "r-1", code: "01", name: "Tán thành Nghị quyết Đại hội nhiệm kỳ 2026–2027", audienceVotes: 112, judgeScore: 0 },
      { id: "r-2", code: "02", name: "Không tán thành", audienceVotes: 2, judgeScore: 0 },
      { id: "r-3", code: "03", name: "Không có ý kiến", audienceVotes: 4, judgeScore: 0 }
    ]
  },
  {
    id: "fit-shirt-2026",
    title: "Bình chọn Mẫu Áo Khoa CNTT Phiên bản 2026",
    pin: "315902",
    source: "STANDALONE",
    requireAttendance: false,
    status: "OPEN",
    isSecretBallot: false,
    usesJudges: false,
    judgeWeight: 0,
    freezeMode: false,
    voterCount: 612,
    candidates: [
      { id: "s-1", code: "01", name: "Mẫu Cobalt Constellation", audienceVotes: 294, judgeScore: 0 },
      { id: "s-2", code: "02", name: "Mẫu Midnight Navy Tech", audienceVotes: 218, judgeScore: 0 },
      { id: "s-3", code: "03", name: "Mẫu Orbital White", audienceVotes: 100, judgeScore: 0 }
    ]
  }
];

export const useVotingStore = create((set) => ({
  campaigns: INITIAL_VOTING_CAMPAIGNS,
  activeStageCampaignId: INITIAL_VOTING_CAMPAIGNS[0].id,
  setActiveStageCampaignId: (id) => set({ activeStageCampaignId: id }),
  upsertCampaign: (campaign) =>
    set((state) => ({
      campaigns: [campaign, ...state.campaigns.filter((c) => c.id !== campaign.id)]
    })),
  updateCampaign: (campaignId, updater, fallback) =>
    set((state) => {
      const exists = state.campaigns.some((c) => c.id === campaignId);
      if (exists) {
        return {
          campaigns: state.campaigns.map((c) => (c.id === campaignId ? updater(c) : c))
        };
      }
      if (!fallback) return state;
      return {
        campaigns: [...state.campaigns, updater(fallback)]
      };
    })
}));
