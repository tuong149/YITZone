package vn.edu.fit.yitzone.iam.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.event.domain.Event;
import vn.edu.fit.yitzone.event.repository.EventRepository;
import vn.edu.fit.yitzone.iam.domain.ExecutivePositionTitle;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.domain.RestructuringBatch;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.RestructuringBatchRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Flexible Personnel Restructuring service supporting both single atomic appointments/dismissals/transfers
 * and scoped unit Restructuring Batches with Diff Preview, Handover Warnings, and scheduled execution
 * (UC-IAM-06, FR-IAM-02, Edge 29).
 */
@Service
public class RestructuringService {
    private static final Logger log = LoggerFactory.getLogger(RestructuringService.class);

    private final UserRepository userRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final RestructuringBatchRepository batchRepository;
    private final ExecutiveAppointmentValidator executiveValidator;
    private final UnitHrService unitHrService;
    private final EventRepository eventRepository;
    private final EffectivePermissionService effectivePermissionService;
    private final RbacCacheInvalidationService rbacCacheService;
    private final AuditLogService auditLogService;

    public RestructuringService(
            UserRepository userRepository,
            OrgUnitRepository orgUnitRepository,
            RestructuringBatchRepository batchRepository,
            ExecutiveAppointmentValidator executiveValidator,
            UnitHrService unitHrService,
            @Autowired(required = false) EventRepository eventRepository,
            @Autowired(required = false) EffectivePermissionService effectivePermissionService,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService,
            @Autowired(required = false) AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.orgUnitRepository = orgUnitRepository;
        this.batchRepository = batchRepository;
        this.executiveValidator = executiveValidator;
        this.unitHrService = unitHrService;
        this.eventRepository = eventRepository;
        this.effectivePermissionService = effectivePermissionService;
        this.rbacCacheService = rbacCacheService;
        this.auditLogService = auditLogService;
    }

    public User appointSingle(SingleAppointmentRequest request, String actorId) {
        Instant now = Instant.now();
        User actor = loadUser(actorId);
        OrgUnit unit = unitHrService.resolveUnit(request.unitId());
        assertCanRestructureUnit(actor, unit, now);

        User target = resolveTargetUser(request.targetIdentifier());
        RoleCode roleCode = request.positionTitle() != null ? request.positionTitle().getRoleCode() : request.roleCode();
        if (roleCode == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Cần chọn vai trò hoặc chức danh bổ nhiệm");
        }

        List<User.RoleScope> scopes = new ArrayList<>(target.getRoleScopes() == null ? List.of() : target.getRoleScopes());
        String scopeType = resolveScopeType(unit);
        String scopeId = "FIT".equals(unit.getId()) ? "FACULTY" : unit.getId();
        scopes.add(new User.RoleScope(
                roleCode,
                request.positionTitle(),
                unit.getId(),
                scopeType,
                scopeId,
                request.termYear() != null ? request.termYear() : "2026-2027",
                now,
                null,
                request.expiresAt()
        ));

        if (isExecutiveUnit(unit.getId()) || request.positionTitle() != null) {
            List<User> simulated = simulateSingleUserRoster(target, scopes);
            executiveValidator.validateExecutiveRosterAndRules(simulated, List.of(), now);
        }

        target.setRoleScopes(scopes);
        if (target.getMemberStatus() == null || target.getMemberStatus() == User.MemberStatus.LEFT) {
            target.setMemberStatus(User.MemberStatus.ACTIVE);
        }
        target.setPermissionVersion(target.getPermissionVersion() + 1L);
        User saved = userRepository.save(target);
        invalidatePermissions(saved);

        recordAudit(actorId, "IAM_PERSONNEL_APPOINTED", saved.getId(),
                List.of(
                        new AuditLog.ChangedField("unitId", null, unit.getId()),
                        new AuditLog.ChangedField("roleCode", null, roleCode.name())
                ),
                request.reason() != null && !request.reason().isBlank() ? request.reason() : "Bổ nhiệm nhân sự lẻ tại " + unit.getId());
        return saved;
    }

    public User dismissSingle(SingleDismissRequest request, String actorId) {
        Instant now = Instant.now();
        User actor = loadUser(actorId);
        OrgUnit unit = unitHrService.resolveUnit(request.unitId());
        assertCanRestructureUnit(actor, unit, now);

        User target = resolveTargetUser(request.targetIdentifier());
        List<User.RoleScope> updatedScopes = new ArrayList<>();
        List<User.TermHistory> history = new ArrayList<>(target.getTermHistory() == null ? List.of() : target.getTermHistory());
        boolean dismissedAny = false;

        for (User.RoleScope rs : target.getRoleScopes() == null ? List.<User.RoleScope>of() : target.getRoleScopes()) {
            boolean matchesUnit = Objects.equals(rs.unitId(), unit.getId());
            boolean matchesRole = request.roleCode() == null || rs.roleCode() == request.roleCode();
            if (rs.isActiveAt(now) && matchesUnit && matchesRole) {
                updatedScopes.add(new User.RoleScope(
                        rs.roleCode(), rs.positionTitle(), rs.unitId(), rs.scopeType(), rs.scopeId(),
                        rs.termYear(), rs.startAt(), now, rs.expiresAt()
                ));
                history.add(new User.TermHistory(
                        rs.termYear(),
                        unit.getName(),
                        rs.positionTitle() != null ? rs.positionTitle().getDisplayName() : String.valueOf(rs.roleCode()),
                        rs.startAt(),
                        now
                ));
                dismissedAny = true;
            } else {
                updatedScopes.add(rs);
            }
        }
        if (!dismissedAny) {
            throw new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                    "Nhân sự không có chức vụ đang tại nhiệm tại đơn vị " + unit.getCode());
        }

        target.setRoleScopes(updatedScopes);
        target.setTermHistory(history);
        target.setPermissionVersion(target.getPermissionVersion() + 1L);
        User saved = userRepository.save(target);
        invalidatePermissions(saved);

        recordAudit(actorId, "IAM_PERSONNEL_DISMISSED", saved.getId(),
                List.of(new AuditLog.ChangedField("dismissedUnitId", unit.getId(), null)),
                request.reason() != null && !request.reason().isBlank() ? request.reason() : "Thôi giữ chức / Miễn nhiệm tại " + unit.getId());
        return saved;
    }

    public User transferSingle(SingleTransferRequest request, String actorId) {
        Instant now = Instant.now();
        User actor = loadUser(actorId);
        OrgUnit fromUnit = unitHrService.resolveUnit(request.fromUnitId());
        OrgUnit toUnit = unitHrService.resolveUnit(request.toUnitId());
        assertCanRestructureUnit(actor, fromUnit, now);
        assertCanRestructureUnit(actor, toUnit, now);

        User target = resolveTargetUser(request.targetIdentifier());
        List<User.RoleScope> updatedScopes = new ArrayList<>();
        List<User.TermHistory> history = new ArrayList<>(target.getTermHistory() == null ? List.of() : target.getTermHistory());

        for (User.RoleScope rs : target.getRoleScopes() == null ? List.<User.RoleScope>of() : target.getRoleScopes()) {
            if (rs.isActiveAt(now) && Objects.equals(rs.unitId(), fromUnit.getId())) {
                updatedScopes.add(new User.RoleScope(
                        rs.roleCode(), rs.positionTitle(), rs.unitId(), rs.scopeType(), rs.scopeId(),
                        rs.termYear(), rs.startAt(), now, rs.expiresAt()
                ));
                history.add(new User.TermHistory(
                        rs.termYear(),
                        fromUnit.getName(),
                        rs.positionTitle() != null ? rs.positionTitle().getDisplayName() : String.valueOf(rs.roleCode()),
                        rs.startAt(),
                        now
                ));
            } else {
                updatedScopes.add(rs);
            }
        }

        RoleCode nextRole = request.newPositionTitle() != null ? request.newPositionTitle().getRoleCode() : request.newRoleCode();
        if (nextRole == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Cần chỉ định chức vụ/vai trò mới khi điều chuyển");
        }
        updatedScopes.add(new User.RoleScope(
                nextRole,
                request.newPositionTitle(),
                toUnit.getId(),
                resolveScopeType(toUnit),
                "FIT".equals(toUnit.getId()) ? "FACULTY" : toUnit.getId(),
                request.termYear() != null ? request.termYear() : "2026-2027",
                now,
                null,
                null
        ));

        if (isExecutiveUnit(fromUnit.getId()) || isExecutiveUnit(toUnit.getId()) || request.newPositionTitle() != null) {
            List<User> simulated = simulateSingleUserRoster(target, updatedScopes);
            executiveValidator.validateExecutiveRosterAndRules(simulated, List.of(), now);
        }

        target.setRoleScopes(updatedScopes);
        target.setTermHistory(history);
        target.setPermissionVersion(target.getPermissionVersion() + 1L);
        User saved = userRepository.save(target);
        invalidatePermissions(saved);

        recordAudit(actorId, "IAM_PERSONNEL_TRANSFERRED", saved.getId(),
                List.of(
                        new AuditLog.ChangedField("unitId", fromUnit.getId(), toUnit.getId()),
                        new AuditLog.ChangedField("newRoleCode", null, nextRole.name())
                ),
                request.reason() != null && !request.reason().isBlank() ? request.reason() : "Điều chuyển / Thăng chức nguyên tử");
        return saved;
    }

    public List<RestructuringBatch> listBatches() {
        return batchRepository.findAllByOrderByCreatedAtDesc();
    }

    public RestructuringBatch createBatch(CreateBatchRequest request, String actorId) {
        Instant now = Instant.now();
        User actor = loadUser(actorId);
        if (request.targetUnitIds() == null || request.targetUnitIds().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Đợt kiện toàn bắt buộc chọn ít nhất 01 đơn vị mục tiêu");
        }
        List<String> normalizedUnits = new ArrayList<>();
        for (String unitId : request.targetUnitIds()) {
            OrgUnit unit = unitHrService.resolveUnit(unitId);
            assertCanRestructureUnit(actor, unit, now);
            normalizedUnits.add(unit.getId());
        }

        RestructuringBatch batch = new RestructuringBatch();
        batch.setTitle(request.title().trim());
        batch.setTermYear(request.termYear() != null ? request.termYear().trim() : "2026-2027");
        batch.setTargetUnitIds(normalizedUnits);
        batch.setChanges(request.changes() == null ? new ArrayList<>() : new ArrayList<>(request.changes()));
        batch.setStatus(RestructuringBatch.BatchStatus.DRAFT);
        batch.setEffectiveAt(request.effectiveAt());
        batch.setCreatedBy(actorId);
        batch.setCreatedAt(now);

        RestructuringBatch saved = batchRepository.save(batch);
        recordAudit(actorId, "IAM_RESTRUCTURING_BATCH_CREATED", saved.getId(),
                List.of(new AuditLog.ChangedField("targetUnitIds", null, String.join(",", normalizedUnits))),
                "Khởi tạo dự thảo Đợt kiện toàn: " + saved.getTitle());
        return saved;
    }

    public RestructuringBatch updateBatch(String batchId, UpdateBatchRequest request, String actorId) {
        RestructuringBatch batch = loadBatch(batchId);
        if (batch.getStatus() != RestructuringBatch.BatchStatus.DRAFT) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Chỉ có thể chỉnh sửa đợt kiện toàn ở trạng thái DRAFT");
        }
        User actor = loadUser(actorId);
        Instant now = Instant.now();
        if (request.targetUnitIds() != null && !request.targetUnitIds().isEmpty()) {
            List<String> normalizedUnits = new ArrayList<>();
            for (String unitId : request.targetUnitIds()) {
                OrgUnit unit = unitHrService.resolveUnit(unitId);
                assertCanRestructureUnit(actor, unit, now);
                normalizedUnits.add(unit.getId());
            }
            batch.setTargetUnitIds(normalizedUnits);
        }
        if (request.title() != null && !request.title().isBlank()) {
            batch.setTitle(request.title().trim());
        }
        if (request.termYear() != null && !request.termYear().isBlank()) {
            batch.setTermYear(request.termYear().trim());
        }
        if (request.changes() != null) {
            batch.setChanges(new ArrayList<>(request.changes()));
        }
        batch.setEffectiveAt(request.effectiveAt());
        return batchRepository.save(batch);
    }

    public DiffPreviewResponse previewDiff(String batchId, String actorId) {
        RestructuringBatch batch = loadBatch(batchId);
        Instant now = Instant.now();
        User actor = loadUser(actorId);
        for (String unitId : batch.getTargetUnitIds()) {
            assertCanRestructureUnit(actor, unitHrService.resolveUnit(unitId), now);
        }

        Set<String> scopedUnitIds = resolveAllScopedUnitIds(batch.getTargetUnitIds());
        List<DiffPreviewItem> diffs = new ArrayList<>();
        List<RestructuringBatch.HandoverWarning> warnings = new ArrayList<>();
        Map<String, User> userById = new HashMap<>();
        for (User u : userRepository.findAll()) {
            userById.put(u.getId(), u);
        }

        List<User> simulatedUsers = simulateBatchRoster(userById, batch, scopedUnitIds, now);
        warnings.addAll(executiveValidator.validateExecutiveRosterAndRules(simulatedUsers, batch.getChanges(), now));

        for (RestructuringBatch.PersonnelChangeItem item : batch.getChanges()) {
            User target = userById.get(item.userId());
            String fullName = target != null ? target.getFullName() : item.userId();
            String studentCode = target != null ? target.getStudentCode() : null;
            String beforeDesc = formatRoleDesc(item.previousRoleCode(), item.previousPositionTitle(), item.previousUnitId());
            String afterDesc = item.action() == RestructuringBatch.ChangeAction.KEEP
                    ? beforeDesc
                    : item.action() == RestructuringBatch.ChangeAction.RESIGN_OR_DISMISS
                    ? "Thôi giữ chức (lưu termHistory)"
                    : formatRoleDesc(item.newRoleCode(), item.newPositionTitle(), item.newUnitId());

            diffs.add(new DiffPreviewItem(
                    item.userId(),
                    studentCode,
                    fullName,
                    item.action(),
                    beforeDesc,
                    afterDesc,
                    item.note()
            ));

            if (item.action() == RestructuringBatch.ChangeAction.RESIGN_OR_DISMISS
                    || item.action() == RestructuringBatch.ChangeAction.CHANGE_ROLE) {
                List<String> unreturnedAssets = unitHrService.findUnreturnedAssetSummaries(item.userId());
                if (!unreturnedAssets.isEmpty()) {
                    warnings.add(new RestructuringBatch.HandoverWarning(
                            item.userId(),
                            "UNRETURNED_OFFICE_ASSETS",
                            fullName + " còn giữ tài sản VP chưa trả: " + String.join(", ", unreturnedAssets)
                    ));
                }
                List<String> activeEvents = findActiveManagedEvents(item.userId(), item.previousUnitId());
                if (!activeEvents.isEmpty()) {
                    warnings.add(new RestructuringBatch.HandoverWarning(
                            item.userId(),
                            "ONGOING_MANAGED_EVENTS",
                            fullName + " còn sự kiện đang phụ trách dang dở: " + String.join(", ", activeEvents)
                    ));
                }
            }
        }

        batch.setHandoverWarnings(warnings);
        batchRepository.save(batch);
        return new DiffPreviewResponse(batch.getId(), batch.getTitle(), batch.getTargetUnitIds(), diffs, warnings);
    }

    public RestructuringBatch publishBatch(String batchId, Instant effectiveAt, String reason, String actorId) {
        RestructuringBatch batch = loadBatch(batchId);
        if (batch.getStatus() == RestructuringBatch.BatchStatus.APPLIED
                || batch.getStatus() == RestructuringBatch.BatchStatus.CANCELLED) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Đợt kiện toàn đã ở trạng thái " + batch.getStatus());
        }
        Instant now = Instant.now();
        User actor = loadUser(actorId);
        for (String unitId : batch.getTargetUnitIds()) {
            assertCanRestructureUnit(actor, unitHrService.resolveUnit(unitId), now);
        }

        // Validate executive quotas & generate handover warnings prior to publish
        previewDiff(batchId, actorId);
        batch = loadBatch(batchId);
        batch.setApprovedBy(actorId);
        batch.setEffectiveAt(effectiveAt != null ? effectiveAt : now);

        if (effectiveAt != null && effectiveAt.isAfter(now)) {
            batch.setStatus(RestructuringBatch.BatchStatus.SCHEDULED);
            RestructuringBatch scheduled = batchRepository.save(batch);
            recordAudit(actorId, "IAM_RESTRUCTURING_BATCH_SCHEDULED", scheduled.getId(),
                    List.of(new AuditLog.ChangedField("effectiveAt", null, effectiveAt.toString())),
                    reason != null && !reason.isBlank() ? reason : "Hẹn giờ ban hành Đợt kiện toàn");
            return scheduled;
        }

        return applyBatchNow(batch, actorId, reason);
    }

    @Scheduled(fixedDelay = 30_000L)
    public void processDueScheduledBatches() {
        try {
            Instant now = Instant.now();
            List<RestructuringBatch> due = batchRepository
                    .findByStatusAndEffectiveAtLessThanEqual(RestructuringBatch.BatchStatus.SCHEDULED, now);
            for (RestructuringBatch batch : due) {
                applyBatchNow(batch, batch.getApprovedBy() != null ? batch.getApprovedBy() : "SCHEDULER",
                        "Tự động ban hành Đợt kiện toàn theo lịch hẹn");
            }
        } catch (Exception ex) {
            log.debug("Skipped scheduled restructuring batch run: {}", ex.getMessage());
        }
    }

    public RestructuringBatch applyBatchNow(RestructuringBatch batch, String actorId, String reason) {
        Instant now = Instant.now();
        Set<String> scopedUnitIds = resolveAllScopedUnitIds(batch.getTargetUnitIds());
        Set<String> touchedUserIds = new HashSet<>();

        for (RestructuringBatch.PersonnelChangeItem item : batch.getChanges()) {
            if (item.action() == RestructuringBatch.ChangeAction.KEEP) {
                continue;
            }
            User target = userRepository.findById(item.userId()).orElse(null);
            if (target == null) {
                continue;
            }
            applyChangeItemToUser(target, item, scopedUnitIds, batch.getTermYear(), now);
            target.setPermissionVersion(target.getPermissionVersion() + 1L);
            User saved = userRepository.save(target);
            invalidatePermissions(saved);
            touchedUserIds.add(saved.getId());
        }

        batch.setStatus(RestructuringBatch.BatchStatus.APPLIED);
        batch.setAppliedAt(now);
        RestructuringBatch applied = batchRepository.save(batch);

        recordAudit(actorId, "IAM_RESTRUCTURING_BATCH_APPLIED", applied.getId(),
                List.of(
                        new AuditLog.ChangedField("targetUnitIds", null, String.join(",", batch.getTargetUnitIds())),
                        new AuditLog.ChangedField("affectedUsers", 0, touchedUserIds.size())
                ),
                reason != null && !reason.isBlank() ? reason : "Ban hành Đợt kiện toàn " + applied.getTitle());
        return applied;
    }

    private void applyChangeItemToUser(
            User target,
            RestructuringBatch.PersonnelChangeItem item,
            Set<String> scopedUnitIds,
            String termYear,
            Instant now
    ) {
        List<User.RoleScope> updatedScopes = new ArrayList<>();
        List<User.TermHistory> history = new ArrayList<>(target.getTermHistory() == null ? List.of() : target.getTermHistory());

        for (User.RoleScope rs : target.getRoleScopes() == null ? List.<User.RoleScope>of() : target.getRoleScopes()) {
            boolean inSelectedUnits = rs.unitId() != null && scopedUnitIds.contains(rs.unitId());
            boolean matchesPrevious = item.previousUnitId() == null || Objects.equals(rs.unitId(), item.previousUnitId());
            if (rs.isActiveAt(now) && inSelectedUnits && matchesPrevious
                    && (item.action() == RestructuringBatch.ChangeAction.RESIGN_OR_DISMISS
                    || item.action() == RestructuringBatch.ChangeAction.CHANGE_ROLE)) {
                updatedScopes.add(new User.RoleScope(
                        rs.roleCode(), rs.positionTitle(), rs.unitId(), rs.scopeType(), rs.scopeId(),
                        rs.termYear(), rs.startAt(), now, rs.expiresAt()
                ));
                history.add(new User.TermHistory(
                        rs.termYear(),
                        rs.unitId(),
                        rs.positionTitle() != null ? rs.positionTitle().getDisplayName() : String.valueOf(rs.roleCode()),
                        rs.startAt(),
                        now
                ));
            } else {
                // Scopes belonging to unselected units remain completely untouched (Edge 29)
                updatedScopes.add(rs);
            }
        }

        if (item.action() == RestructuringBatch.ChangeAction.CHANGE_ROLE
                || item.action() == RestructuringBatch.ChangeAction.NEW_APPOINTMENT) {
            String newUnitId = item.newUnitId() != null ? item.newUnitId() : item.previousUnitId();
            RoleCode newRole = item.newPositionTitle() != null ? item.newPositionTitle().getRoleCode() : item.newRoleCode();
            if (newUnitId != null && newRole != null) {
                OrgUnit destUnit = orgUnitRepository.findById(newUnitId).orElse(null);
                updatedScopes.add(new User.RoleScope(
                        newRole,
                        item.newPositionTitle(),
                        newUnitId,
                        destUnit != null ? resolveScopeType(destUnit) : "COMMITTEE",
                        "FIT".equals(newUnitId) ? "FACULTY" : newUnitId,
                        termYear,
                        now,
                        null,
                        null
                ));
            }
        }

        target.setRoleScopes(updatedScopes);
        target.setTermHistory(history);
    }

    private List<User> simulateSingleUserRoster(User target, List<User.RoleScope> candidateScopes) {
        List<User> all = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            if (u.getId().equals(target.getId())) {
                all.add(cloneUserWithScopes(u, candidateScopes));
            } else {
                all.add(u);
            }
        }
        return all;
    }

    private List<User> simulateBatchRoster(
            Map<String, User> userById,
            RestructuringBatch batch,
            Set<String> scopedUnitIds,
            Instant now
    ) {
        Map<String, User> cloned = new HashMap<>();
        for (Map.Entry<String, User> e : userById.entrySet()) {
            cloned.put(e.getKey(), cloneUserWithScopes(e.getValue(),
                    new ArrayList<>(e.getValue().getRoleScopes() == null ? List.of() : e.getValue().getRoleScopes())));
        }
        for (RestructuringBatch.PersonnelChangeItem item : batch.getChanges()) {
            if (item.action() == RestructuringBatch.ChangeAction.KEEP) continue;
            User sim = cloned.get(item.userId());
            if (sim != null) {
                applyChangeItemToUser(sim, item, scopedUnitIds, batch.getTermYear(), now);
            }
        }
        return new ArrayList<>(cloned.values());
    }

    private User cloneUserWithScopes(User source, List<User.RoleScope> scopes) {
        User copy = new User();
        copy.setId(source.getId());
        copy.setFullName(source.getFullName());
        copy.setRoleScopes(new ArrayList<>(scopes));
        return copy;
    }

    private void assertCanRestructureUnit(User actor, OrgUnit unit, Instant now) {
        if (isExecutiveUnit(unit.getId())) {
            executiveValidator.assertCanManageExecutiveUnit(actor, unit.getId(), now);
            return;
        }
        boolean isStanding = actor.getRoleScopes() != null && actor.getRoleScopes().stream()
                .anyMatch(rs -> rs != null && rs.isActiveAt(now) && rs.roleCode() == RoleCode.STANDING_COMMITTEE);
        if (isStanding) {
            return;
        }
        // Committee Head can restructure teams under their own committee
        boolean isOwningCommitteeHead = actor.getRoleScopes() != null && actor.getRoleScopes().stream()
                .anyMatch(rs -> rs != null && rs.isActiveAt(now) && rs.roleCode() == RoleCode.COMMITTEE_HEAD
                        && rs.unitId() != null
                        && (rs.unitId().equals(unit.getId())
                        || (unit.getAncestors() != null && unit.getAncestors().contains(rs.unitId()))));
        if (!isOwningCommitteeHead) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Chỉ Ban Thường vụ (toàn Khoa) hoặc Trưởng Ban (trong Ban/Tổ trực thuộc) mới được kiện toàn đơn vị " + unit.getCode());
        }
    }

    private boolean isExecutiveUnit(String unitId) {
        return ExecutivePositionTitle.YOUTH_UNION_UNIT_CODE.equals(unitId)
                || ExecutivePositionTitle.ASSOCIATION_UNIT_CODE.equals(unitId);
    }

    private Set<String> resolveAllScopedUnitIds(List<String> targetUnitIds) {
        Set<String> scoped = new LinkedHashSet<>();
        for (String unitId : targetUnitIds) {
            OrgUnit u = unitHrService.resolveUnit(unitId);
            scoped.addAll(unitHrService.resolveUnitAndDescendantIds(u));
        }
        return scoped;
    }

    private List<String> findActiveManagedEvents(String userId, String unitId) {
        if (eventRepository == null) {
            return List.of();
        }
        List<String> active = new ArrayList<>();
        for (Event ev : eventRepository.findAll()) {
            String st = ev.getStatus() == null ? "" : ev.getStatus().toUpperCase(Locale.ROOT);
            boolean unfinished = !"FINALIZED".equals(st) && !"CANCELLED".equals(st) && !"COMPLETED".equals(st);
            boolean related = Objects.equals(ev.getCreatedBy(), userId)
                    || (unitId != null && Objects.equals(ev.getOrganizerUnitId(), unitId));
            if (unfinished && related) {
                active.add(ev.getTitle());
            }
        }
        return active;
    }

    private void invalidatePermissions(User user) {
        if (effectivePermissionService != null) {
            effectivePermissionService.evictLocalCache(user.getId());
        }
        if (rbacCacheService != null) {
            rbacCacheService.invalidateUserPermissions(user.getId(), user.getPermissionVersion());
        }
    }

    private String resolveScopeType(OrgUnit unit) {
        if (unit.getUnitType() == OrgUnit.UnitType.FACULTY_UNION) return "FACULTY";
        if (unit.getUnitType() == OrgUnit.UnitType.TEAM) return "TEAM";
        return "COMMITTEE";
    }

    private String formatRoleDesc(RoleCode roleCode, ExecutivePositionTitle title, String unitId) {
        String label = title != null ? title.getDisplayName() : (roleCode != null ? roleCode.name() : "Chưa có");
        return unitId != null ? label + " (" + unitId + ")" : label;
    }

    private User loadUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED, "Không tìm thấy tài khoản"));
    }

    private User resolveTargetUser(String identifier) {
        String clean = identifier == null ? "" : identifier.trim();
        return userRepository.findByStudentCode(clean)
                .or(() -> userRepository.findByEmail(clean.toLowerCase(Locale.ROOT)))
                .or(() -> userRepository.findById(clean))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy nhân sự: " + clean));
    }

    private RestructuringBatch loadBatch(String batchId) {
        return batchRepository.findById(batchId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy đợt kiện toàn: " + batchId));
    }

    private void recordAudit(String actorId, String action, String targetId, List<AuditLog.ChangedField> fields, String reason) {
        if (auditLogService != null) {
            auditLogService.record(actorId, null, action, "RESTRUCTURING", targetId, fields, reason, null, null);
        }
    }

    public record SingleAppointmentRequest(
            String targetIdentifier,
            String unitId,
            RoleCode roleCode,
            ExecutivePositionTitle positionTitle,
            String termYear,
            Instant expiresAt,
            String reason
    ) {
    }

    public record SingleDismissRequest(
            String targetIdentifier,
            String unitId,
            RoleCode roleCode,
            String reason
    ) {
    }

    public record SingleTransferRequest(
            String targetIdentifier,
            String fromUnitId,
            String toUnitId,
            RoleCode newRoleCode,
            ExecutivePositionTitle newPositionTitle,
            String termYear,
            String reason
    ) {
    }

    public record CreateBatchRequest(
            String title,
            String termYear,
            List<String> targetUnitIds,
            List<RestructuringBatch.PersonnelChangeItem> changes,
            Instant effectiveAt
    ) {
    }

    public record UpdateBatchRequest(
            String title,
            String termYear,
            List<String> targetUnitIds,
            List<RestructuringBatch.PersonnelChangeItem> changes,
            Instant effectiveAt
    ) {
    }

    public record DiffPreviewItem(
            String userId,
            String studentCode,
            String fullName,
            RestructuringBatch.ChangeAction action,
            String beforeRole,
            String afterRole,
            String note
    ) {
    }

    public record DiffPreviewResponse(
            String batchId,
            String title,
            List<String> targetUnitIds,
            List<DiffPreviewItem> diffs,
            List<RestructuringBatch.HandoverWarning> handoverWarnings
    ) {
    }
}
