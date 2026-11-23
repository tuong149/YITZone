package vn.edu.fit.yitzone.iam.domain;

/**
 * Specific executive titles for the dual-track Faculty Executive Committees:
 * - Youth Union (BCH_DOAN, 15 members): 1 Secretary, 2 Deputy Secretaries, 2 Standing Committee Members, 10 EC Members.
 * - Student Association (BCH_HOI, 15 members): 1 President, 2 Vice Presidents, 12 EC Members.
 *
 * Cross-track constraint:
 * - ASSOCIATION_PRESIDENT must concurrently hold YOUTH_UNION_DEPUTY_SECRETARY.
 *
 * RBAC mapping:
 * - Youth Union Standing Committee (Secretary, Deputy Secretary, Standing Member) + Association Standing
 *   (President, Vice President) -> RoleCode.STANDING_COMMITTEE (7 distinct individuals).
 * - Other EC Members -> RoleCode.EXECUTIVE_COMMITTEE.
 */
public enum ExecutivePositionTitle {
    YOUTH_UNION_SECRETARY(
            "Bí thư Đoàn Khoa",
            "BCH_DOAN",
            RoleCode.STANDING_COMMITTEE,
            1
    ),
    YOUTH_UNION_DEPUTY_SECRETARY(
            "Phó Bí thư Đoàn Khoa",
            "BCH_DOAN",
            RoleCode.STANDING_COMMITTEE,
            2
    ),
    YOUTH_UNION_STANDING_MEMBER(
            "Ủy viên Ban Thường vụ Đoàn Khoa",
            "BCH_DOAN",
            RoleCode.STANDING_COMMITTEE,
            2
    ),
    YOUTH_UNION_EC_MEMBER(
            "Ủy viên BCH Đoàn Khoa",
            "BCH_DOAN",
            RoleCode.EXECUTIVE_COMMITTEE,
            10
    ),
    ASSOCIATION_PRESIDENT(
            "Liên chi hội trưởng",
            "BCH_HOI",
            RoleCode.STANDING_COMMITTEE,
            1
    ),
    ASSOCIATION_VICE_PRESIDENT(
            "Liên chi hội phó",
            "BCH_HOI",
            RoleCode.STANDING_COMMITTEE,
            2
    ),
    ASSOCIATION_EC_MEMBER(
            "Ủy viên BCH Liên Chi hội",
            "BCH_HOI",
            RoleCode.EXECUTIVE_COMMITTEE,
            12
    );

    public static final String YOUTH_UNION_UNIT_CODE = "BCH_DOAN";
    public static final String ASSOCIATION_UNIT_CODE = "BCH_HOI";

    private final String displayName;
    private final String orgUnitCode;
    private final RoleCode roleCode;
    private final int maxQuota;

    ExecutivePositionTitle(String displayName, String orgUnitCode, RoleCode roleCode, int maxQuota) {
        this.displayName = displayName;
        this.orgUnitCode = orgUnitCode;
        this.roleCode = roleCode;
        this.maxQuota = maxQuota;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getOrgUnitCode() {
        return orgUnitCode;
    }

    public RoleCode getRoleCode() {
        return roleCode;
    }

    public int getMaxQuota() {
        return maxQuota;
    }

    public boolean isYouthUnionTrack() {
        return YOUTH_UNION_UNIT_CODE.equals(orgUnitCode);
    }

    public boolean isAssociationTrack() {
        return ASSOCIATION_UNIT_CODE.equals(orgUnitCode);
    }
}
