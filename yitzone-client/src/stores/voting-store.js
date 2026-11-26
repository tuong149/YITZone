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

export const INITIAL_VOTING_CAMPAIGNS = [];

export const useVotingStore = create((set) => ({
  campaigns: INITIAL_VOTING_CAMPAIGNS,
  activeStageCampaignId: null,
  setCampaigns: (campaigns) => set({ campaigns }),
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
