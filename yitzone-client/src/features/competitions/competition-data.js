/** @typedef {| "DRAFT" | "SUBMITTED" | "WAITLISTED" | "APPROVED" | "REJECTED" | "DISQUALIFIED"} TeamStatus */

/** @typedef {| "PENDING" | "QUALIFIED" | "STANDBY" | "ELIMINATED" | "CONFIRMED" | "WITHDRAWN" | "DISQUALIFIED"} AdvancementStatus */

/** @typedef {"SUM_OF_MEMBERS" | "AVG_OF_MEMBERS"} TeamScoringMode */
/** @typedef {"ZERO_MEMBER_SCORE" | "DISQUALIFY_TEAM"} CheatingPolicy */

/**
 * @typedef {Object} TeamMemberRecord
 * @property {string} userId
 * @property {string} fullName
 * @property {string} email
 * @property {"LEADER" | "MEMBER"} role
 * @property {boolean} isExternal
 * @property {string} studentCode
 * @property {string} schoolName
 * @property {string} facultyMajor
 * @property {boolean} otpVerified
 * @property {string} confirmedAt
 * @property {number} qualRawScore
 * @property {number} qualDurationSec
 * @property {number} qualViolations
 * @property {boolean} qualDisqualified
 * @property {boolean} participated
 */

/**
 * @typedef {Object} CompetitionTeamRecord
 * @property {string} id
 * @property {string} teamCode
 * @property {string} teamName
 * @property {string} joinCode
 * @property {TeamStatus} status
 * @property {AdvancementStatus} advancementStatus
 * @property {string} [awardTitle]
 * @property {string} [note]
 * @property {TeamMemberRecord[]} members
 * @property {any} stageScores
 * @property {any} [introVideo]
 */

/**
 * @typedef {Object} StageSegmentConfig
 * @property {"warmup" | "accel" | "finish"} code
 * @property {string} title
 * @property {number} weightPercent
 * @property {number} maxScore
 * @property {string} criteriaNote
 */

export const MASTERING_IT_META = {
  id: "",
  eventId: "",
  title: "Cuộc thi Học thuật Đa vòng theo Đội",
  subtitle:
    "Quản lý đăng ký đội thi, vòng loại cá nhân gộp điểm và chấm điểm chặng Chung kết sân khấu.",
  academicYear: "2026–2027",
  semester: "HK1",
  minTeamSize: 5,
  maxTeamSize: 5,
  maxTeams: 40,
  qualifyTopN: 5,
  allowExternalStudents: true,
  rosterLockAt: "Theo cấu hình sự kiện",
  qualRoundTime: "Theo cấu hình sự kiện",
  finalRoundTime: "Theo cấu hình sự kiện",
  confirmDeadline: "Theo cấu hình sự kiện",
  benefitsForUte: ["Cộng ĐRL", "Cộng CĐDN"]
};

export const STAGE_SEGMENTS = [
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

export const INITIAL_COMPETITION_TEAMS = [];

/**
 * @typedef {Object} ComputedTeamQualResult
 * @property {CompetitionTeamRecord} team
 * @property {number} participatedCount
 * @property {number} validMemberCount
 * @property {boolean} hasDisqualifiedMember
 * @property {boolean} teamDisqualifiedByPolicy
 * @property {number} aggregatedScore
 * @property {number} totalDurationSec
 * @property {number} totalViolations
 * @property {number} rank
 */

export function computeQualifyingStandings(
  teams,
  scoringMode,
  cheatingPolicy,
  minParticipatedMembers
) {
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

export function formatDurationMMSS(totalSec) {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}p ${String(secs).padStart(2, "0")}s`;
}
