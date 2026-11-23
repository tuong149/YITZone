package vn.edu.fit.yitzone.iam.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.ExecutivePositionTitle;
import vn.edu.fit.yitzone.iam.domain.RestructuringBatch;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Enforces dual-track Executive Committee personnel governance (UC-IAM-06):
 * 1. Appointment authority separation:
 *    - Appointments/dismissals in BCH_DOAN require active STANDING_COMMITTEE in BCH_DOAN.
 *    - Appointments/dismissals in BCH_HOI require active STANDING_COMMITTEE in BCH_HOI.
 *    - Shared 4 Committees / 9 Teams under FIT can be managed by any active STANDING_COMMITTEE.
 * 2. Exact title quotas:
 *    - BCH_DOAN (15): 1 Secretary, 2 Deputy Secretaries, 2 Standing Members, 10 EC Members.
 *    - BCH_HOI (15): 1 Association President, 2 Vice Presidents, 12 EC Members.
 * 3. Cross-track rule:
 *    - ASSOCIATION_PRESIDENT must concurrently hold YOUTH_UNION_DEPUTY_SECRETARY.
 *    - Dismissing YOUTH_UNION_DEPUTY_SECRETARY from the current ASSOCIATION_PRESIDENT emits a mandatory warning.
 */
@Service
public class ExecutiveAppointmentValidator {

    public void assertCanManageExecutiveUnit(User actor, String targetUnitId, Instant now) {
        if (actor == null || targetUnitId == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Thiếu thông tin người thực hiện hoặc đơn vị kiện toàn");
        }
        boolean isYouthUnionBody = ExecutivePositionTitle.YOUTH_UNION_UNIT_CODE.equals(targetUnitId);
        boolean isAssociationBody = ExecutivePositionTitle.ASSOCIATION_UNIT_CODE.equals(targetUnitId);

        if (isYouthUnionBody) {
            boolean allowed = hasActiveStandingRoleInUnit(actor, ExecutivePositionTitle.YOUTH_UNION_UNIT_CODE, now);
            if (!allowed) {
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Chỉ Ban Thường vụ Đoàn Khoa (BCH_DOAN) mới có thẩm quyền bổ nhiệm/miễn nhiệm nhân sự BCH Đoàn");
            }
            return;
        }
        if (isAssociationBody) {
            boolean allowed = hasActiveStandingRoleInUnit(actor, ExecutivePositionTitle.ASSOCIATION_UNIT_CODE, now);
            if (!allowed) {
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Chỉ Thường trực Liên Chi hội (BCH_HOI: LCH Trưởng / LCH Phó) mới có thẩm quyền bổ nhiệm/miễn nhiệm nhân sự BCH Hội");
            }
            return;
        }

        // Shared units (FIT, 4 Committees, 9 Teams): any active STANDING_COMMITTEE in either track is allowed
        boolean isAnyStanding = actor.getRoleScopes().stream()
                .anyMatch(rs -> rs.roleCode() == RoleCode.STANDING_COMMITTEE && rs.isActiveAt(now));
        if (!isAnyStanding) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Thao tác kiện toàn đơn vị yêu cầu quyền Ban Thường vụ / Thường trực LCH");
        }
    }

    public List<RestructuringBatch.HandoverWarning> validateExecutiveRosterAndRules(
            List<User> resultingUsers,
            List<RestructuringBatch.PersonnelChangeItem> plannedChanges,
            Instant now
    ) {
        Map<ExecutivePositionTitle, Integer> counts = new EnumMap<>(ExecutivePositionTitle.class);
        for (ExecutivePositionTitle title : ExecutivePositionTitle.values()) {
            counts.put(title, 0);
        }

        for (User user : resultingUsers) {
            boolean isYouthUnionDeputySecretary = false;
            boolean isAssociationPresident = false;

            for (User.RoleScope rs : user.getRoleScopes()) {
                if (!rs.isActiveAt(now) || rs.positionTitle() == null) {
                    continue;
                }
                ExecutivePositionTitle title = rs.positionTitle();
                if (!title.getOrgUnitCode().equals(rs.unitId())) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                            "Chức danh " + title.getDisplayName() + " phải thuộc đơn vị " + title.getOrgUnitCode());
                }
                if (rs.roleCode() != title.getRoleCode()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                            "Chức danh " + title.getDisplayName() + " phải gắn với vai trò " + title.getRoleCode());
                }
                counts.merge(title, 1, Integer::sum);

                if (title == ExecutivePositionTitle.YOUTH_UNION_DEPUTY_SECRETARY) {
                    isYouthUnionDeputySecretary = true;
                }
                if (title == ExecutivePositionTitle.ASSOCIATION_PRESIDENT) {
                    isAssociationPresident = true;
                }
            }

            if (isAssociationPresident && !isYouthUnionDeputySecretary) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Vi phạm quy chế cơ cấu: Liên chi hội trưởng (" + user.getFullName()
                                + ") bắt buộc phải đồng thời là 1 trong 2 Phó Bí thư Đoàn Khoa");
            }
        }

        for (Map.Entry<ExecutivePositionTitle, Integer> entry : counts.entrySet()) {
            ExecutivePositionTitle title = entry.getKey();
            int actual = entry.getValue();
            if (actual > title.getMaxQuota()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Vượt định biên chức danh " + title.getDisplayName() + ": tối đa "
                                + title.getMaxQuota() + " người (hiện tại " + actual + ")");
            }
        }

        List<RestructuringBatch.HandoverWarning> warnings = new ArrayList<>();
        if (plannedChanges != null) {
            for (RestructuringBatch.PersonnelChangeItem item : plannedChanges) {
                if (item.action() == RestructuringBatch.ChangeAction.RESIGN_OR_DISMISS
                        && item.previousPositionTitle() == ExecutivePositionTitle.YOUTH_UNION_DEPUTY_SECRETARY) {
                    boolean stillAssociationPresident = resultingUsers.stream()
                            .filter(u -> item.userId().equals(u.getId()))
                            .flatMap(u -> u.getRoleScopes().stream())
                            .anyMatch(rs -> rs.isActiveAt(now)
                                    && rs.positionTitle() == ExecutivePositionTitle.ASSOCIATION_PRESIDENT);
                    if (stillAssociationPresident) {
                        warnings.add(new RestructuringBatch.HandoverWarning(
                                item.userId(),
                                "CROSS_TRACK_LCH_PRESIDENT_DEPENDENCY",
                                "Nhân sự đang giữ chức Liên chi hội trưởng (BCH_HOI); cần phối hợp Thường trực LCH kiện toàn vị trí LCH Trưởng đồng bộ."
                        ));
                    }
                }
            }
        }
        return warnings;
    }

    private boolean hasActiveStandingRoleInUnit(User actor, String expectedUnitId, Instant now) {
        return actor.getRoleScopes().stream()
                .anyMatch(rs -> rs.roleCode() == RoleCode.STANDING_COMMITTEE
                        && expectedUnitId.equals(rs.unitId())
                        && rs.isActiveAt(now));
    }
}
