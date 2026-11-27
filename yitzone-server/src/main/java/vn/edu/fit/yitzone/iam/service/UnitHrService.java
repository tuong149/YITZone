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
import vn.edu.fit.yitzone.iam.domain.HrProposal;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.repository.HrProposalRepository;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.office.domain.OfficeAsset;
import vn.edu.fit.yitzone.office.repository.OfficeAssetRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 3-tier isolated internal HR management & unit-scoped announcements (UC-IAM-07, FR-IAM-03, SRS Table 3.3A).
 * - Deputy Team Leader / Vice Committee Head: Propose (hr:propose) within own Team/Committee.
 * - Team Leader: Execute directly within own Team.
 * - Committee Head: Approve proposals & transfer CTVs across child Teams within own Committee.
 * - BCH / BTV: Faculty-wide coordination & approval.
 */
@Service
public class UnitHrService {
    private static final List<OfficeAsset.BorrowStatus> UNRETURNED_STATUSES = List.of(
            OfficeAsset.BorrowStatus.BORROWED,
            OfficeAsset.BorrowStatus.OVERDUE
    );

    private final UserRepository userRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final HrProposalRepository hrProposalRepository;
    private final OfficeAssetRepository officeAssetRepository;
    private final NotificationRepository notificationRepository;
    private final EffectivePermissionService effectivePermissionService;
    private final RbacCacheInvalidationService rbacCacheService;
    private final AuditLogService auditLogService;

    public UnitHrService(
            UserRepository userRepository,
            OrgUnitRepository orgUnitRepository,
            HrProposalRepository hrProposalRepository,
            @Autowired(required = false) OfficeAssetRepository officeAssetRepository,
            @Autowired(required = false) NotificationRepository notificationRepository,
            @Autowired(required = false) EffectivePermissionService effectivePermissionService,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService,
            @Autowired(required = false) AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.orgUnitRepository = orgUnitRepository;
        this.hrProposalRepository = hrProposalRepository;
        this.officeAssetRepository = officeAssetRepository;
        this.notificationRepository = notificationRepository;
        this.effectivePermissionService = effectivePermissionService;
        this.rbacCacheService = rbacCacheService;
        this.auditLogService = auditLogService;
    }

    public List<UnitMemberView> listUnitMembers(String unitId, String actorId) {
        User actor = loadActor(actorId);
        OrgUnit targetUnit = resolveUnit(unitId);
        assertCanViewUnit(actor, targetUnit, Instant.now());

        Set<String> scopeUnitIds = resolveUnitAndDescendantIds(targetUnit);
        List<User> candidates = userRepository.findByRoleScopesUnitIdIn(scopeUnitIds);
        Instant now = Instant.now();

        Map<String, OrgUnit> unitMap = loadUnitMap();
        List<UnitMemberView> result = new ArrayList<>();
        for (User u : candidates) {
            User.RoleScope matchingScope = u.getRoleScopes().stream()
                    .filter(rs -> rs != null && rs.isActiveAt(now) && rs.unitId() != null && scopeUnitIds.contains(rs.unitId()))
                    .findFirst()
                    .orElse(null);
            if (matchingScope == null) {
                continue;
            }
            List<String> unreturnedAssets = findUnreturnedAssetSummaries(u.getId());
            OrgUnit memberUnit = unitMap.get(matchingScope.unitId());
            result.add(new UnitMemberView(
                    u.getId(),
                    u.getStudentCode(),
                    u.getFullName(),
                    u.getEmail(),
                    matchingScope.unitId(),
                    memberUnit != null ? memberUnit.getName() : matchingScope.unitId(),
                    matchingScope.roleCode() != null ? matchingScope.roleCode().name() : null,
                    u.getMemberStatus() != null ? u.getMemberStatus().name() : User.MemberStatus.ACTIVE.name(),
                    unreturnedAssets
            ));
        }
        result.sort(Comparator.comparing(UnitMemberView::fullName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));
        return result;
    }

    public HrProposalView createProposal(String unitId, CreateProposalRequest request, String actorId) {
        User actor = loadActor(actorId);
        OrgUnit targetUnit = resolveUnit(unitId);
        Instant now = Instant.now();
        assertCanProposeInUnit(actor, targetUnit, now);

        User targetUser = resolveTargetUser(request.targetIdentifier());
        if (request.proposalType() == HrProposal.ProposalType.TRANSFER_TEAM) {
            if (request.targetTransferUnitId() == null || request.targetTransferUnitId().isBlank()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Phiếu đề xuất điều chuyển bắt buộc chọn Tổ đích");
            }
            OrgUnit destUnit = resolveUnit(request.targetTransferUnitId());
            assertSameCommitteeBoundary(targetUnit, destUnit);
        }

        HrProposal proposal = new HrProposal();
        proposal.setUnitId(targetUnit.getId());
        proposal.setTargetUserId(targetUser.getId());
        proposal.setProposalType(request.proposalType());
        proposal.setTargetTransferUnitId(request.targetTransferUnitId());
        proposal.setTargetMemberStatus(request.targetMemberStatus());
        proposal.setReason(request.reason());
        proposal.setStatus(HrProposal.ProposalStatus.PENDING);
        proposal.setProposedBy(actorId);
        proposal.setCreatedAt(now);

        HrProposal saved = hrProposalRepository.save(proposal);
        recordAudit(actorId, "HR_PROPOSAL_CREATED", saved.getId(),
                List.of(new AuditLog.ChangedField("proposalType", null, saved.getProposalType().name()),
                        new AuditLog.ChangedField("unitId", null, targetUnit.getId())),
                request.reason() != null ? request.reason() : "Tạo phiếu đề xuất nhân sự đơn vị " + targetUnit.getId());
        return toProposalView(saved, Map.of(actor.getId(), actor, targetUser.getId(), targetUser));
    }

    public List<HrProposalView> listProposals(String unitId, HrProposal.ProposalStatus status, String actorId) {
        User actor = loadActor(actorId);
        OrgUnit targetUnit = resolveUnit(unitId);
        assertCanViewUnit(actor, targetUnit, Instant.now());

        Set<String> scopeUnitIds = resolveUnitAndDescendantIds(targetUnit);
        List<HrProposal> proposals = status != null
                ? hrProposalRepository.findByUnitIdInAndStatusOrderByCreatedAtDesc(scopeUnitIds, status)
                : hrProposalRepository.findAll().stream()
                .filter(p -> p.getUnitId() != null && scopeUnitIds.contains(p.getUnitId()))
                .sorted(Comparator.comparing(HrProposal::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        Map<String, User> userCache = new LinkedHashMap<>();
        for (HrProposal p : proposals) {
            if (p.getProposedBy() != null && !userCache.containsKey(p.getProposedBy())) {
                userRepository.findById(p.getProposedBy()).ifPresent(u -> userCache.put(u.getId(), u));
            }
            if (p.getTargetUserId() != null && !userCache.containsKey(p.getTargetUserId())) {
                userRepository.findById(p.getTargetUserId()).ifPresent(u -> userCache.put(u.getId(), u));
            }
        }
        return proposals.stream().map(p -> toProposalView(p, userCache)).toList();
    }

    public HrProposalView reviewProposal(
            String unitId,
            String proposalId,
            boolean approved,
            String reviewNote,
            String actorId
    ) {
        User actor = loadActor(actorId);
        OrgUnit targetUnit = resolveUnit(unitId);
        Instant now = Instant.now();

        HrProposal proposal = hrProposalRepository.findById(proposalId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy phiếu đề xuất nhân sự: " + proposalId));

        Set<String> allowedUnits = resolveUnitAndDescendantIds(targetUnit);
        if (!allowedUnits.contains(proposal.getUnitId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Phiếu đề xuất không thuộc phạm vi đơn vị " + targetUnit.getId());
        }
        if (proposal.getStatus() != HrProposal.ProposalStatus.PENDING) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Phiếu đề xuất đã được xử lý trước đó");
        }

        OrgUnit proposalUnit = resolveUnit(proposal.getUnitId());
        if (proposal.getProposalType() == HrProposal.ProposalType.TRANSFER_TEAM) {
            assertCanApproveCommitteeLevel(actor, proposalUnit, now);
        } else {
            assertCanExecuteInUnit(actor, proposalUnit, now);
        }

        proposal.setStatus(approved ? HrProposal.ProposalStatus.APPROVED : HrProposal.ProposalStatus.REJECTED);
        proposal.setReviewedBy(actorId);
        proposal.setReviewedAt(now);
        proposal.setReviewNote(reviewNote);
        HrProposal saved = hrProposalRepository.save(proposal);

        if (approved) {
            User targetUser = userRepository.findById(proposal.getTargetUserId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                            "Không tìm thấy nhân sự mục tiêu"));
            applyHrMutation(targetUser, proposalUnit, proposal.getProposalType(),
                    proposal.getTargetTransferUnitId(), proposal.getTargetMemberStatus(), now);
        }

        recordAudit(actorId, approved ? "HR_PROPOSAL_APPROVED" : "HR_PROPOSAL_REJECTED", saved.getId(),
                List.of(new AuditLog.ChangedField("status", "PENDING", saved.getStatus().name())),
                reviewNote != null && !reviewNote.isBlank() ? reviewNote : "Xử lý phiếu đề xuất nhân sự");

        Map<String, User> userCache = new LinkedHashMap<>();
        userRepository.findById(proposal.getProposedBy()).ifPresent(u -> userCache.put(u.getId(), u));
        userRepository.findById(proposal.getTargetUserId()).ifPresent(u -> userCache.put(u.getId(), u));
        return toProposalView(saved, userCache);
    }

    public UnitMemberView executeDirectAction(String unitId, DirectHrActionRequest request, String actorId) {
        User actor = loadActor(actorId);
        OrgUnit targetUnit = resolveUnit(unitId);
        Instant now = Instant.now();

        if (request.actionType() == HrProposal.ProposalType.TRANSFER_TEAM) {
            assertCanApproveCommitteeLevel(actor, targetUnit, now);
            if (request.targetTransferUnitId() == null || request.targetTransferUnitId().isBlank()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Thiếu đơn vị đích khi điều chuyển nhân sự");
            }
            OrgUnit destUnit = resolveUnit(request.targetTransferUnitId());
            assertSameCommitteeBoundary(targetUnit, destUnit);
        } else {
            assertCanExecuteInUnit(actor, targetUnit, now);
        }

        User targetUser = resolveTargetUser(request.targetIdentifier());
        applyHrMutation(targetUser, targetUnit, request.actionType(),
                request.targetTransferUnitId(), request.targetMemberStatus(), now);

        recordAudit(actorId, "HR_DIRECT_" + request.actionType().name(), targetUser.getId(),
                List.of(new AuditLog.ChangedField("unitId", targetUnit.getId(),
                        request.targetTransferUnitId() != null ? request.targetTransferUnitId() : targetUnit.getId())),
                request.reason() != null && !request.reason().isBlank() ? request.reason() : "Thực thi nghiệp vụ nhân sự nội bộ");

        OrgUnit finalUnit = request.targetTransferUnitId() != null && !request.targetTransferUnitId().isBlank()
                ? resolveUnit(request.targetTransferUnitId())
                : targetUnit;
        return new UnitMemberView(
                targetUser.getId(),
                targetUser.getStudentCode(),
                targetUser.getFullName(),
                targetUser.getEmail(),
                finalUnit.getId(),
                finalUnit.getName(),
                RoleCode.COLLABORATOR.name(),
                targetUser.getMemberStatus() != null ? targetUser.getMemberStatus().name() : User.MemberStatus.ACTIVE.name(),
                findUnreturnedAssetSummaries(targetUser.getId())
        );
    }

    public AnnouncementResult sendUnitAnnouncement(String unitId, String title, String content, String actorId) {
        User actor = loadActor(actorId);
        OrgUnit targetUnit = resolveUnit(unitId);
        Instant now = Instant.now();
        assertCanAnnounceInUnit(actor, targetUnit, now);

        Set<String> scopeUnitIds = resolveUnitAndDescendantIds(targetUnit);
        List<User> recipients = userRepository.findByRoleScopesUnitIdIn(scopeUnitIds).stream()
                .filter(u -> u.getRoleScopes().stream()
                        .anyMatch(rs -> rs != null && rs.isActiveAt(now) && scopeUnitIds.contains(rs.unitId())))
                .toList();

        int sentCount = 0;
        if (notificationRepository != null) {
            for (User recipient : recipients) {
                Notification n = new Notification();
                n.setRecipientUserId(recipient.getId());
                n.setScopeUnitId(targetUnit.getId());
                n.setTitle(title == null || title.isBlank() ? "[Thông báo nội bộ " + targetUnit.getCode() + "]" : title.trim());
                n.setBody(content.trim());
                n.setType(Notification.NotificationType.BROADCAST);
                n.setLinkUrl("/admin/unit-hr");
                n.setRead(false);
                n.setCreatedAt(now);
                notificationRepository.save(n);
                sentCount++;
            }
        } else {
            sentCount = recipients.size();
        }

        recordAudit(actorId, "HR_UNIT_ANNOUNCEMENT_SENT", targetUnit.getId(),
                List.of(new AuditLog.ChangedField("recipientCount", 0, sentCount)),
                "Gửi thông báo nội bộ cô lập phạm vi " + targetUnit.getId());
        return new AnnouncementResult(targetUnit.getId(), sentCount, now);
    }

    public void assertCanExecuteInUnit(User actor, OrgUnit targetUnit, Instant now) {
        if (hasFacultyWideHrAuthority(actor, now)) {
            return;
        }
        if (hasRoleCoveringUnit(actor, targetUnit, RoleCode.COMMITTEE_HEAD, now)) {
            return;
        }
        if (targetUnit.getUnitType() == OrgUnit.UnitType.TEAM
                && hasExactUnitRole(actor, targetUnit.getId(), RoleCode.TEAM_LEADER, now)) {
            return;
        }
        throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                "Bạn không có thẩm quyền thực hiện trực tiếp thao tác nhân sự trong đơn vị " + targetUnit.getCode()
                        + " (Tổ phó/Phó Ban chỉ được tạo Phiếu Đề xuất theo Bảng 3.3A)");
    }

    public void assertCanApproveCommitteeLevel(User actor, OrgUnit targetUnit, Instant now) {
        if (hasFacultyWideHrAuthority(actor, now)) {
            return;
        }
        if (hasRoleCoveringUnit(actor, targetUnit, RoleCode.COMMITTEE_HEAD, now)) {
            return;
        }
        throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                "Chỉ Trưởng Ban trực thuộc (hoặc BCH/BTV) mới có quyền phê duyệt & điều chuyển giữa các Tổ trong Ban " + targetUnit.getCode());
    }

    public void assertCanViewUnit(User actor, OrgUnit targetUnit, Instant now) {
        if (hasFacultyWideHrAuthority(actor, now)) {
            return;
        }
        if (hasRoleCoveringUnit(actor, targetUnit, RoleCode.COMMITTEE_HEAD, now)
                || hasRoleCoveringUnit(actor, targetUnit, RoleCode.VICE_COMMITTEE_HEAD, now)
                || hasExactUnitRole(actor, targetUnit.getId(), RoleCode.TEAM_LEADER, now)
                || hasExactUnitRole(actor, targetUnit.getId(), RoleCode.DEPUTY_TEAM_LEADER, now)
                || hasExactUnitRole(actor, targetUnit.getId(), RoleCode.COLLABORATOR, now)) {
            return;
        }
        // Team Leader / Deputy Team Leader can view summary of their parent committee
        if (targetUnit.getUnitType() == OrgUnit.UnitType.COMMITTEE) {
            Set<String> childUnitIds = resolveUnitAndDescendantIds(targetUnit);
            boolean belongsToChildTeam = actor.getRoleScopes().stream()
                    .anyMatch(rs -> rs != null && rs.isActiveAt(now)
                            && rs.unitId() != null && childUnitIds.contains(rs.unitId())
                            && (rs.roleCode() == RoleCode.TEAM_LEADER || rs.roleCode() == RoleCode.DEPUTY_TEAM_LEADER));
            if (belongsToChildTeam) {
                return;
            }
        }
        throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                "Truy cập bị từ chối (403): Dữ liệu nhân sự được cô lập theo đơn vị Ban/Tổ — bạn không thuộc " + targetUnit.getCode());
    }

    private void assertCanProposeInUnit(User actor, OrgUnit targetUnit, Instant now) {
        if (hasFacultyWideHrAuthority(actor, now)) {
            return;
        }
        if (hasRoleCoveringUnit(actor, targetUnit, RoleCode.COMMITTEE_HEAD, now)
                || hasRoleCoveringUnit(actor, targetUnit, RoleCode.VICE_COMMITTEE_HEAD, now)) {
            return;
        }
        if (targetUnit.getUnitType() == OrgUnit.UnitType.TEAM
                && (hasExactUnitRole(actor, targetUnit.getId(), RoleCode.TEAM_LEADER, now)
                || hasExactUnitRole(actor, targetUnit.getId(), RoleCode.DEPUTY_TEAM_LEADER, now))) {
            return;
        }
        throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                "Bạn không có quyền tạo phiếu đề xuất nhân sự trong đơn vị " + targetUnit.getCode());
    }

    private void assertCanAnnounceInUnit(User actor, OrgUnit targetUnit, Instant now) {
        assertCanProposeInUnit(actor, targetUnit, now);
    }

    private void applyHrMutation(
            User targetUser,
            OrgUnit sourceUnit,
            HrProposal.ProposalType type,
            String targetTransferUnitId,
            User.MemberStatus targetMemberStatus,
            Instant now
    ) {
        List<User.RoleScope> scopes = new ArrayList<>(targetUser.getRoleScopes() == null ? List.of() : targetUser.getRoleScopes());
        if (type == HrProposal.ProposalType.ONBOARD_CTV) {
            boolean alreadyActive = scopes.stream()
                    .anyMatch(rs -> rs.isActiveAt(now) && Objects.equals(rs.unitId(), sourceUnit.getId()));
            if (!alreadyActive) {
                String scopeType = sourceUnit.getUnitType() == OrgUnit.UnitType.TEAM ? "TEAM" : "COMMITTEE";
                scopes.add(new User.RoleScope(
                        RoleCode.COLLABORATOR, null, sourceUnit.getId(), scopeType, sourceUnit.getId(),
                        sourceUnit.getTermYear(), now, null, null
                ));
            }
            targetUser.setMemberStatus(User.MemberStatus.ACTIVE);
        } else if (type == HrProposal.ProposalType.TRANSFER_TEAM && targetTransferUnitId != null) {
            OrgUnit destUnit = resolveUnit(targetTransferUnitId);
            List<User.TermHistory> history = new ArrayList<>(targetUser.getTermHistory() == null ? List.of() : targetUser.getTermHistory());
            List<User.RoleScope> updated = new ArrayList<>();
            for (User.RoleScope rs : scopes) {
                if (rs.isActiveAt(now) && Objects.equals(rs.unitId(), sourceUnit.getId())) {
                    updated.add(new User.RoleScope(
                            rs.roleCode(), rs.positionTitle(), rs.unitId(), rs.scopeType(), rs.scopeId(),
                            rs.termYear(), rs.startAt(), now, rs.expiresAt()
                    ));
                    history.add(new User.TermHistory(
                            rs.termYear(), sourceUnit.getName(), String.valueOf(rs.roleCode()), rs.startAt(), now
                    ));
                } else {
                    updated.add(rs);
                }
            }
            String destScopeType = destUnit.getUnitType() == OrgUnit.UnitType.TEAM ? "TEAM" : "COMMITTEE";
            updated.add(new User.RoleScope(
                    RoleCode.COLLABORATOR, null, destUnit.getId(), destScopeType, destUnit.getId(),
                    destUnit.getTermYear(), now, null, null
            ));
            scopes = updated;
            targetUser.setTermHistory(history);
        } else if (type == HrProposal.ProposalType.CHANGE_MEMBER_STATUS && targetMemberStatus != null) {
            targetUser.setMemberStatus(targetMemberStatus);
        }

        targetUser.setRoleScopes(scopes);
        targetUser.setPermissionVersion(targetUser.getPermissionVersion() + 1L);
        userRepository.save(targetUser);

        if (effectivePermissionService != null) {
            effectivePermissionService.evictLocalCache(targetUser.getId());
        }
        if (rbacCacheService != null) {
            rbacCacheService.invalidateUserPermissions(targetUser.getId(), targetUser.getPermissionVersion());
        }
    }

    private void assertSameCommitteeBoundary(OrgUnit sourceUnit, OrgUnit destUnit) {
        String sourceRoot = resolveCommitteeRoot(sourceUnit);
        String destRoot = resolveCommitteeRoot(destUnit);
        if (sourceRoot != null && destRoot != null && !sourceRoot.equals(destRoot)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Trưởng Ban chỉ được điều chuyển CTV giữa các Tổ trực thuộc cùng Ban (" + sourceRoot + "), không được chuyển sang Ban " + destRoot);
        }
    }

    private String resolveCommitteeRoot(OrgUnit unit) {
        if (unit.getUnitType() == OrgUnit.UnitType.COMMITTEE) {
            return unit.getId();
        }
        if (unit.getParentId() != null && !"FIT".equals(unit.getParentId())) {
            return unit.getParentId();
        }
        return unit.getId();
    }

    public Set<String> resolveUnitAndDescendantIds(OrgUnit targetUnit) {
        Set<String> ids = new LinkedHashSet<>();
        ids.add(targetUnit.getId());
        for (OrgUnit u : orgUnitRepository.findAll()) {
            if (u.getAncestors() != null && u.getAncestors().contains(targetUnit.getId())) {
                ids.add(u.getId());
            } else if (Objects.equals(u.getParentId(), targetUnit.getId())) {
                ids.add(u.getId());
            }
        }
        return ids;
    }

    public OrgUnit resolveUnit(String unitIdOrCode) {
        String clean = unitIdOrCode == null ? "" : unitIdOrCode.trim().toUpperCase(Locale.ROOT);
        return orgUnitRepository.findById(clean)
                .or(() -> orgUnitRepository.findByCode(clean))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy đơn vị tổ chức: " + unitIdOrCode));
    }

    public List<String> findUnreturnedAssetSummaries(String userId) {
        if (officeAssetRepository == null || userId == null) {
            return List.of();
        }
        List<OfficeAsset> assets = officeAssetRepository
                .findByBorrowLogsBorrowerUserIdAndBorrowLogsStatusIn(userId, UNRETURNED_STATUSES);
        List<String> summaries = new ArrayList<>();
        for (OfficeAsset asset : assets) {
            if (asset.getBorrowLogs() == null) continue;
            for (OfficeAsset.BorrowLog log : asset.getBorrowLogs()) {
                if (userId.equals(log.borrowerUserId()) && UNRETURNED_STATUSES.contains(log.status())) {
                    summaries.add(asset.getAssetCode() + " - " + asset.getName() + " (SL: " + log.qty() + ")");
                }
            }
        }
        return summaries;
    }

    private User loadActor(String actorId) {
        return userRepository.findById(actorId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, HttpStatus.UNAUTHORIZED,
                        "Không tìm thấy tài khoản thực hiện thao tác"));
    }

    private User resolveTargetUser(String identifier) {
        String clean = identifier == null ? "" : identifier.trim();
        return userRepository.findByStudentCode(clean)
                .or(() -> userRepository.findByEmail(clean.toLowerCase(Locale.ROOT)))
                .or(() -> userRepository.findById(clean))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản nhân sự: " + clean));
    }

    private boolean hasFacultyWideHrAuthority(User actor, Instant now) {
        return actor.getRoleScopes() != null && actor.getRoleScopes().stream()
                .anyMatch(rs -> rs != null && rs.isActiveAt(now)
                        && (rs.roleCode() == RoleCode.STANDING_COMMITTEE || rs.roleCode() == RoleCode.EXECUTIVE_COMMITTEE));
    }

    private boolean hasRoleCoveringUnit(User actor, OrgUnit targetUnit, RoleCode roleCode, Instant now) {
        if (actor.getRoleScopes() == null) return false;
        return actor.getRoleScopes().stream()
                .anyMatch(rs -> rs != null && rs.isActiveAt(now) && rs.roleCode() == roleCode
                        && rs.unitId() != null
                        && (rs.unitId().equals(targetUnit.getId())
                        || (targetUnit.getAncestors() != null && targetUnit.getAncestors().contains(rs.unitId()))));
    }

    private boolean hasExactUnitRole(User actor, String unitId, RoleCode roleCode, Instant now) {
        if (actor.getRoleScopes() == null) return false;
        return actor.getRoleScopes().stream()
                .anyMatch(rs -> rs != null && rs.isActiveAt(now) && rs.roleCode() == roleCode && Objects.equals(rs.unitId(), unitId));
    }

    private Map<String, OrgUnit> loadUnitMap() {
        Map<String, OrgUnit> map = new LinkedHashMap<>();
        for (OrgUnit u : orgUnitRepository.findAll()) {
            map.put(u.getId(), u);
        }
        return map;
    }

    private HrProposalView toProposalView(HrProposal p, Map<String, User> userCache) {
        User proposer = userCache.get(p.getProposedBy());
        User target = userCache.get(p.getTargetUserId());
        return new HrProposalView(
                p.getId(),
                p.getUnitId(),
                p.getProposedBy(),
                proposer != null ? proposer.getFullName() : p.getProposedBy(),
                p.getTargetUserId(),
                target != null ? (target.getStudentCode() != null ? target.getStudentCode() + " - " + target.getFullName() : target.getFullName()) : p.getTargetUserId(),
                p.getProposalType(),
                p.getTargetTransferUnitId(),
                p.getTargetMemberStatus(),
                p.getReason(),
                p.getStatus(),
                p.getCreatedAt(),
                p.getReviewedBy(),
                p.getReviewedAt(),
                p.getReviewNote()
        );
    }

    private void recordAudit(String actorId, String action, String targetId, List<AuditLog.ChangedField> fields, String reason) {
        if (auditLogService != null) {
            auditLogService.record(actorId, null, action, "HR_UNIT", targetId, fields, reason, null, null);
        }
    }

    public record UnitMemberView(
            String id,
            String studentCode,
            String fullName,
            String email,
            String unitId,
            String unitName,
            String roleCode,
            String status,
            List<String> unreturnedAssets
    ) {
    }

    public record CreateProposalRequest(
            String targetIdentifier,
            HrProposal.ProposalType proposalType,
            String targetTransferUnitId,
            User.MemberStatus targetMemberStatus,
            String reason
    ) {
    }

    public record DirectHrActionRequest(
            String targetIdentifier,
            HrProposal.ProposalType actionType,
            String targetTransferUnitId,
            User.MemberStatus targetMemberStatus,
            String reason
    ) {
    }

    public record HrProposalView(
            String id,
            String unitId,
            String proposedBy,
            String proposerName,
            String targetUserId,
            String targetSummary,
            HrProposal.ProposalType proposalType,
            String targetTransferUnitId,
            User.MemberStatus targetMemberStatus,
            String reason,
            HrProposal.ProposalStatus status,
            Instant createdAt,
            String reviewedBy,
            Instant reviewedAt,
            String reviewNote
    ) {
    }

    public record AnnouncementResult(String unitId, int recipientCount, Instant sentAt) {
    }
}
