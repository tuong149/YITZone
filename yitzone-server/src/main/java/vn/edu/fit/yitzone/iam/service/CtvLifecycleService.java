package vn.edu.fit.yitzone.iam.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.domain.Notification;
import vn.edu.fit.yitzone.audit.repository.NotificationRepository;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.office.domain.OfficeAsset;
import vn.edu.fit.yitzone.office.domain.OfficeDutyShift;
import vn.edu.fit.yitzone.office.repository.OfficeAssetRepository;
import vn.edu.fit.yitzone.office.repository.OfficeDutyShiftRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Manages CTV member lifecycle (ACTIVE -> ON_LEAVE / LEFT) with mandatory OFIT asset handover check (Edge 34),
 * instant <= 5s permission revocation, and automatic withdrawal from future office duty shifts (UC-IAM-08, FR-IAM-04).
 */
@Service
public class CtvLifecycleService {
    private static final List<OfficeAsset.BorrowStatus> UNRETURNED_STATUSES = List.of(
            OfficeAsset.BorrowStatus.BORROWED,
            OfficeAsset.BorrowStatus.OVERDUE
    );

    private final UserRepository userRepository;
    private final UnitHrService unitHrService;
    private final OfficeAssetRepository officeAssetRepository;
    private final OfficeDutyShiftRepository officeDutyShiftRepository;
    private final NotificationRepository notificationRepository;
    private final EffectivePermissionService effectivePermissionService;
    private final RbacCacheInvalidationService rbacCacheService;
    private final AuditLogService auditLogService;

    public CtvLifecycleService(
            UserRepository userRepository,
            UnitHrService unitHrService,
            @Autowired(required = false) OfficeAssetRepository officeAssetRepository,
            @Autowired(required = false) OfficeDutyShiftRepository officeDutyShiftRepository,
            @Autowired(required = false) NotificationRepository notificationRepository,
            @Autowired(required = false) EffectivePermissionService effectivePermissionService,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService,
            @Autowired(required = false) AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.unitHrService = unitHrService;
        this.officeAssetRepository = officeAssetRepository;
        this.officeDutyShiftRepository = officeDutyShiftRepository;
        this.notificationRepository = notificationRepository;
        this.effectivePermissionService = effectivePermissionService;
        this.rbacCacheService = rbacCacheService;
        this.auditLogService = auditLogService;
    }

    public StatusTransitionResult changeCtvStatus(
            String unitId,
            String targetUserId,
            User.MemberStatus targetStatus,
            String handoverAssigneeUserId,
            String reason,
            String actorId
    ) {
        if (targetStatus == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Trạng thái CTV mục tiêu không được để trống");
        }
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                        "Không tìm thấy người thực hiện thao tác"));
        OrgUnit targetUnit = unitHrService.resolveUnit(unitId);
        Instant now = Instant.now();
        unitHrService.assertCanExecuteInUnit(actor, targetUnit, now);

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy cộng tác viên: " + targetUserId));

        int handedOverAssets = 0;
        if (targetStatus == User.MemberStatus.LEFT && officeAssetRepository != null) {
            List<OfficeAsset> unreturnedAssets = officeAssetRepository
                    .findByBorrowLogsBorrowerUserIdAndBorrowLogsStatusIn(targetUserId, UNRETURNED_STATUSES);
            List<String> blockers = new ArrayList<>();
            for (OfficeAsset asset : unreturnedAssets) {
                for (OfficeAsset.BorrowLog log : asset.getBorrowLogs()) {
                    if (targetUserId.equals(log.borrowerUserId()) && UNRETURNED_STATUSES.contains(log.status())) {
                        blockers.add(asset.getAssetCode() + " - " + asset.getName());
                    }
                }
            }
            if (!blockers.isEmpty()) {
                if (handoverAssigneeUserId == null || handoverAssigneeUserId.isBlank()) {
                    throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                            "Không thể chuyển sang Đã rời (Edge 34): CTV còn giữ tài sản Ban Văn phòng chưa trả: "
                                    + String.join(", ", blockers)
                                    + ". Bắt buộc xác nhận trả đồ hoặc chỉ định người nhận bàn giao.");
                }
                userRepository.findById(handoverAssigneeUserId.trim())
                        .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                                "Người nhận bàn giao tài sản không tồn tại: " + handoverAssigneeUserId));
                for (OfficeAsset asset : unreturnedAssets) {
                    List<OfficeAsset.BorrowLog> updatedLogs = new ArrayList<>();
                    for (OfficeAsset.BorrowLog log : asset.getBorrowLogs()) {
                        if (targetUserId.equals(log.borrowerUserId()) && UNRETURNED_STATUSES.contains(log.status())) {
                            updatedLogs.add(new OfficeAsset.BorrowLog(
                                    log.borrowId(),
                                    handoverAssigneeUserId.trim(),
                                    log.eventId(),
                                    log.qty(),
                                    log.conditionOnBorrow(),
                                    log.borrowedAt(),
                                    log.returnedAt(),
                                    log.damagedOnReturnQty(),
                                    "Bàn giao từ " + targetUser.getFullName() + " khi rời đơn vị",
                                    log.status()
                            ));
                            handedOverAssets++;
                        } else {
                            updatedLogs.add(log);
                        }
                    }
                    asset.setBorrowLogs(updatedLogs);
                    officeAssetRepository.save(asset);
                }
            }
        }

        User.MemberStatus previousStatus = targetUser.getMemberStatus();
        targetUser.setMemberStatus(targetStatus);

        int removedFutureShifts = 0;
        if (targetStatus == User.MemberStatus.ON_LEAVE || targetStatus == User.MemberStatus.LEFT) {
            Set<String> affectedUnitIds = unitHrService.resolveUnitAndDescendantIds(targetUnit);
            List<User.RoleScope> updatedScopes = new ArrayList<>();
            List<User.TermHistory> history = new ArrayList<>(targetUser.getTermHistory() == null ? List.of() : targetUser.getTermHistory());
            if (targetUser.getRoleScopes() != null) {
                for (User.RoleScope rs : targetUser.getRoleScopes()) {
                    if (rs.isActiveAt(now) && rs.unitId() != null && affectedUnitIds.contains(rs.unitId())) {
                        updatedScopes.add(new User.RoleScope(
                                rs.roleCode(), rs.positionTitle(), rs.unitId(), rs.scopeType(), rs.scopeId(),
                                rs.termYear(), rs.startAt(), now, rs.expiresAt()
                        ));
                        history.add(new User.TermHistory(
                                rs.termYear(), rs.unitId(), String.valueOf(rs.roleCode()), rs.startAt(), now
                        ));
                    } else {
                        updatedScopes.add(rs);
                    }
                }
            }
            targetUser.setRoleScopes(updatedScopes);
            targetUser.setTermHistory(history);

            if (targetUser.getAssignedModules() != null) {
                List<User.AssignedModule> remainingModules = targetUser.getAssignedModules().stream()
                        .filter(am -> !(am.moduleCode() != null && am.moduleCode().startsWith("MOD_DEPT_")
                                && (am.scopeId() == null || affectedUnitIds.contains(am.scopeId()))))
                        .toList();
                targetUser.setAssignedModules(new ArrayList<>(remainingModules));
            }

            targetUser.setPermissionVersion(targetUser.getPermissionVersion() + 1L);
            userRepository.save(targetUser);

            if (effectivePermissionService != null) {
                effectivePermissionService.evictLocalCache(targetUserId);
            }
            if (rbacCacheService != null) {
                rbacCacheService.invalidateUserPermissions(targetUserId, targetUser.getPermissionVersion());
            }

            removedFutureShifts = withdrawFromFutureOfficeShifts(targetUser, now);
        } else {
            userRepository.save(targetUser);
        }

        if (auditLogService != null) {
            auditLogService.record(
                    actorId,
                    null,
                    "CTV_STATUS_CHANGED",
                    "USER",
                    targetUserId,
                    List.of(
                            new AuditLog.ChangedField("memberStatus",
                                    previousStatus != null ? previousStatus.name() : null, targetStatus.name()),
                            new AuditLog.ChangedField("removedFutureShifts", 0, removedFutureShifts),
                            new AuditLog.ChangedField("handedOverAssets", 0, handedOverAssets)
                    ),
                    reason != null && !reason.isBlank() ? reason : "Chuyển trạng thái CTV sang " + targetStatus.name(),
                    null,
                    null
            );
        }

        return new StatusTransitionResult(
                targetUserId,
                targetStatus.name(),
                removedFutureShifts,
                handedOverAssets,
                targetUser.getPermissionVersion()
        );
    }

    private int withdrawFromFutureOfficeShifts(User targetUser, Instant now) {
        if (officeDutyShiftRepository == null) {
            return 0;
        }
        LocalDate today = LocalDate.now();
        List<OfficeDutyShift> futureShifts = officeDutyShiftRepository
                .findByAssignedAttendeesUserIdAndShiftDateGreaterThanEqual(targetUser.getId(), today);
        int withdrawn = 0;
        for (OfficeDutyShift shift : futureShifts) {
            List<OfficeDutyShift.AssignedAttendee> remainingAttendees = shift.getAssignedAttendees().stream()
                    .filter(a -> !targetUser.getId().equals(a.userId()))
                    .toList();
            List<String> remainingRegs = shift.getRegisteredUserIds().stream()
                    .filter(uid -> !targetUser.getId().equals(uid))
                    .toList();
            if (remainingAttendees.size() != shift.getAssignedAttendees().size()) {
                shift.setAssignedAttendees(new ArrayList<>(remainingAttendees));
                shift.setRegisteredUserIds(new ArrayList<>(remainingRegs));
                officeDutyShiftRepository.save(shift);
                withdrawn++;
            }
        }
        if (withdrawn > 0 && notificationRepository != null) {
            List<User> ofitMembers = userRepository.findByRoleScopesUnitId("OFIT");
            for (User ofitUser : ofitMembers) {
                Notification alert = new Notification();
                alert.setRecipientUserId(ofitUser.getId());
                alert.setScopeUnitId("OFIT");
                alert.setTitle("[OFIT] Cảnh báo ca trực trống sau khi CTV nghỉ hoạt động");
                alert.setBody("CTV " + targetUser.getFullName() + " vừa chuyển trạng thái nghỉ/rời đơn vị. Hệ thống đã tự động rút tên khỏi "
                        + withdrawn + " ca trực văn phòng tương lai. Vui lòng điều phối người trực thay thế.");
                alert.setType(Notification.NotificationType.DUTY_SWAP);
                alert.setLinkUrl("/admin/office");
                alert.setRead(false);
                alert.setCreatedAt(now);
                notificationRepository.save(alert);
            }
        }
        return withdrawn;
    }

    public record StatusTransitionResult(
            String userId,
            String newStatus,
            int removedFutureShifts,
            int handedOverAssets,
            long newPermissionVersion
    ) {
    }
}
