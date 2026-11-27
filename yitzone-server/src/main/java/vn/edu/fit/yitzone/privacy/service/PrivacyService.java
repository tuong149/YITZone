package vn.edu.fit.yitzone.privacy.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;
import vn.edu.fit.yitzone.iam.repository.UserAuthIdentityRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.iam.service.EffectivePermissionService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;
import vn.edu.fit.yitzone.iam.service.RefreshTokenService;
import vn.edu.fit.yitzone.office.domain.OfficeAsset;
import vn.edu.fit.yitzone.office.repository.OfficeAssetRepository;
import vn.edu.fit.yitzone.privacy.domain.ConsentRecord;
import vn.edu.fit.yitzone.privacy.domain.DataPrivacyRequest;
import vn.edu.fit.yitzone.privacy.repository.ConsentRecordRepository;
import vn.edu.fit.yitzone.privacy.repository.DataPrivacyRequestRepository;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Personal Data Protection (PDPL Law 91/2025/QH15, Decree 356/2025 & 330/2026) service (UC-IAM-11, NFR-PRIV-01..04).
 */
@Service
public class PrivacyService {
    private static final String DEFAULT_POLICY_VERSION = "v2026.1";
    private static final List<OfficeAsset.BorrowStatus> UNRETURNED_STATUSES = List.of(
            OfficeAsset.BorrowStatus.BORROWED,
            OfficeAsset.BorrowStatus.OVERDUE
    );

    private final ConsentRecordRepository consentRecordRepository;
    private final DataPrivacyRequestRepository privacyRequestRepository;
    private final UserRepository userRepository;
    private final UserAuthIdentityRepository authIdentityRepository;
    private final OfficeAssetRepository officeAssetRepository;
    private final RefreshTokenService refreshTokenService;
    private final EffectivePermissionService effectivePermissionService;
    private final RbacCacheInvalidationService rbacCacheService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public PrivacyService(
            ConsentRecordRepository consentRecordRepository,
            DataPrivacyRequestRepository privacyRequestRepository,
            UserRepository userRepository,
            @Autowired(required = false) UserAuthIdentityRepository authIdentityRepository,
            @Autowired(required = false) OfficeAssetRepository officeAssetRepository,
            @Autowired(required = false) RefreshTokenService refreshTokenService,
            @Autowired(required = false) EffectivePermissionService effectivePermissionService,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService,
            @Autowired(required = false) AuditLogService auditLogService,
            ObjectMapper objectMapper
    ) {
        this.consentRecordRepository = consentRecordRepository;
        this.privacyRequestRepository = privacyRequestRepository;
        this.userRepository = userRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.officeAssetRepository = officeAssetRepository;
        this.refreshTokenService = refreshTokenService;
        this.effectivePermissionService = effectivePermissionService;
        this.rbacCacheService = rbacCacheService;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    public ConsentRecord recordConsent(String userId, String purposeOrType, String policyVersion, boolean granted) {
        ConsentRecord.ConsentType consentType = resolveConsentType(purposeOrType);
        String version = policyVersion == null || policyVersion.isBlank() ? DEFAULT_POLICY_VERSION : policyVersion.trim();
        Instant now = Instant.now();

        ConsentRecord record = consentRecordRepository
                .findByUserIdAndConsentTypeAndPolicyVersion(userId, consentType, version)
                .orElseGet(ConsentRecord::new);
        record.setUserId(userId);
        record.setConsentType(consentType);
        record.setPolicyVersion(version);
        record.setGranted(granted);
        if (granted) {
            record.setGrantedAt(now);
            record.setRevokedAt(null);
        } else {
            record.setRevokedAt(now);
        }
        ConsentRecord saved = consentRecordRepository.save(record);
        recordAudit(userId, granted ? "PRIVACY_CONSENT_GRANTED" : "PRIVACY_CONSENT_REVOKED", saved.getId(),
                List.of(new AuditLog.ChangedField("consentType", null, consentType.name())),
                "Cập nhật đồng ý xử lý dữ liệu cá nhân (" + version + ")");
        return saved;
    }

    public List<ConsentRecord> listMyConsents(String userId) {
        return consentRecordRepository.findByUserIdOrderByGrantedAtDesc(userId);
    }

    public Map<String, Object> buildPersonalDataSnapshot(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy hồ sơ người dùng"));
        UserAuthIdentity identity = authIdentityRepository != null
                ? authIdentityRepository.findByUserId(userId).orElse(null)
                : null;
        List<ConsentRecord> consents = listMyConsents(userId);
        List<DataPrivacyRequest> requests = privacyRequestRepository.findByUserIdOrderByRequestedAtDesc(userId);

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("userId", user.getId());
        profile.put("fullName", user.getFullName());
        profile.put("email", user.getEmail());
        profile.put("studentCode", user.getStudentCode());
        profile.put("staffId", user.getStaffId());
        profile.put("userType", user.getUserType());
        profile.put("majorCode", user.getMajorCode());
        profile.put("className", user.getClassName());
        profile.put("lifecycleStatus", user.getLifecycleStatus());
        profile.put("memberStatus", user.getMemberStatus());
        profile.put("personalEmail", user.getPersonalEmail());
        profile.put("personalEmailVerified", user.isPersonalEmailVerified());
        profile.put("unionMemberProfile", user.getUnionMemberProfile());
        profile.put("roleScopes", user.getRoleScopes());
        profile.put("termHistory", user.getTermHistory());

        Map<String, Object> authSummary = new LinkedHashMap<>();
        if (identity != null) {
            authSummary.put("emailVerified", identity.isEmailVerified());
            authSummary.put("googleLinked", identity.getGoogleSub() != null && !identity.getGoogleSub().isBlank());
            authSummary.put("hasPassword", identity.getPasswordHash() != null);
            authSummary.put("mfaTotpEnabled", identity.isMfaTotpEnabled());
            authSummary.put("createdAt", identity.getCreatedAt());
        }

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("exportedAt", Instant.now().toString());
        snapshot.put("legalBasis", "Luat BVDLCN 91/2025/QH15, ND 356/2025, ND 330/2026");
        snapshot.put("profile", profile);
        snapshot.put("authSummary", authSummary);
        snapshot.put("consents", consents);
        snapshot.put("privacyRequests", requests);
        return snapshot;
    }

    public ExportedDataFile exportPersonalData(String userId, String rawFormat) {
        String format = "PDF".equalsIgnoreCase(rawFormat) ? "PDF" : "JSON";
        Map<String, Object> snapshot = buildPersonalDataSnapshot(userId);

        byte[] content;
        String contentType;
        String filename;
        try {
            if ("PDF".equals(format)) {
                content = renderPdfSummary(snapshot);
                contentType = "application/pdf";
                filename = "yitzone-personal-data-" + userId + ".pdf";
            } else {
                content = objectMapper.writerWithDefaultPrettyPrinter()
                        .writeValueAsString(snapshot)
                        .getBytes(StandardCharsets.UTF_8);
                contentType = "application/json; charset=UTF-8";
                filename = "yitzone-personal-data-" + userId + ".json";
            }
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không thể xuất tệp bản sao dữ liệu cá nhân: " + ex.getMessage());
        }

        DataPrivacyRequest req = new DataPrivacyRequest();
        req.setUserId(userId);
        req.setRequestType(DataPrivacyRequest.RequestType.DATA_EXPORT);
        req.setExportFormat(format);
        req.setStatus(DataPrivacyRequest.RequestStatus.COMPLETED);
        req.setRequestedAt(Instant.now());
        req.setHandledAt(Instant.now());
        req.setHandledBy("SYSTEM");
        req.setHandlingNote("Xuất bản sao dữ liệu cá nhân định dạng " + format);
        DataPrivacyRequest savedReq = privacyRequestRepository.save(req);

        recordAudit(userId, "PRIVACY_DATA_EXPORTED", savedReq.getId(),
                List.of(new AuditLog.ChangedField("exportFormat", null, format)),
                "Chủ thể dữ liệu tải bản sao dữ liệu cá nhân (" + format + ")");

        return new ExportedDataFile(savedReq.getId(), format, filename, contentType, content);
    }

    public DataPrivacyRequest createPrivacyRequest(
            String userId,
            DataPrivacyRequest.RequestType requestType,
            String reason
    ) {
        if (requestType == null || requestType == DataPrivacyRequest.RequestType.DATA_EXPORT) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Loại yêu cầu phải là RECTIFICATION hoặc ERASURE_ANONYMIZE");
        }
        DataPrivacyRequest req = new DataPrivacyRequest();
        req.setUserId(userId);
        req.setRequestType(requestType);
        req.setReason(reason != null ? reason.trim() : "");
        req.setStatus(DataPrivacyRequest.RequestStatus.PENDING);
        req.setRequestedAt(Instant.now());
        DataPrivacyRequest saved = privacyRequestRepository.save(req);

        recordAudit(userId, "PRIVACY_REQUEST_SUBMITTED", saved.getId(),
                List.of(new AuditLog.ChangedField("requestType", null, requestType.name())),
                req.getReason().isBlank() ? "Gửi yêu cầu quyền chủ thể dữ liệu" : req.getReason());
        return saved;
    }

    public List<DataPrivacyRequest> listMyRequests(String userId) {
        return privacyRequestRepository.findByUserIdOrderByRequestedAtDesc(userId);
    }

    public List<DataPrivacyRequest> listAllRequests(DataPrivacyRequest.RequestStatus status) {
        if (status != null) {
            return privacyRequestRepository.findByStatusOrderByRequestedAtAsc(status);
        }
        return privacyRequestRepository.findAll();
    }

    public DataPrivacyRequest processRequest(
            String requestId,
            boolean approved,
            String handlingNote,
            String actorId
    ) {
        DataPrivacyRequest req = privacyRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy yêu cầu quyền riêng tư: " + requestId));
        if (req.getStatus() == DataPrivacyRequest.RequestStatus.COMPLETED
                || req.getStatus() == DataPrivacyRequest.RequestStatus.REJECTED) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Yêu cầu quyền riêng tư đã được xử lý trước đó");
        }

        Instant now = Instant.now();
        if (!approved) {
            req.setStatus(DataPrivacyRequest.RequestStatus.REJECTED);
            req.setHandledBy(actorId);
            req.setHandledAt(now);
            req.setHandlingNote(handlingNote);
            DataPrivacyRequest saved = privacyRequestRepository.save(req);
            recordAudit(actorId, "PRIVACY_REQUEST_REJECTED", saved.getId(),
                    List.of(new AuditLog.ChangedField("status", "PENDING", "REJECTED")),
                    handlingNote != null ? handlingNote : "Từ chối yêu cầu quyền riêng tư");
            return saved;
        }

        if (req.getRequestType() == DataPrivacyRequest.RequestType.ERASURE_ANONYMIZE) {
            anonymizeUserAccount(req.getUserId(), actorId, handlingNote, now);
        }

        req.setStatus(DataPrivacyRequest.RequestStatus.COMPLETED);
        req.setHandledBy(actorId);
        req.setHandledAt(now);
        req.setHandlingNote(handlingNote != null && !handlingNote.isBlank()
                ? handlingNote
                : "Đã hoàn tất xử lý theo NFR-PRIV-04 (bảo lưu Audit Log, tài chính & khen thưởng chính thức)");
        DataPrivacyRequest saved = privacyRequestRepository.save(req);

        recordAudit(actorId, "PRIVACY_REQUEST_COMPLETED", saved.getId(),
                List.of(new AuditLog.ChangedField("status", "PENDING", "COMPLETED")),
                saved.getHandlingNote());
        return saved;
    }

    private void anonymizeUserAccount(String targetUserId, String actorId, String note, Instant now) {
        if (officeAssetRepository != null) {
            List<OfficeAsset> unreturned = officeAssetRepository
                    .findByBorrowLogsBorrowerUserIdAndBorrowLogsStatusIn(targetUserId, UNRETURNED_STATUSES);
            boolean hasActiveLoan = unreturned.stream()
                    .flatMap(a -> a.getBorrowLogs().stream())
                    .anyMatch(l -> targetUserId.equals(l.borrowerUserId()) && UNRETURNED_STATUSES.contains(l.status()));
            if (hasActiveLoan) {
                throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                        "Không thể ẩn danh hóa tài khoản khi còn tài sản Văn phòng chưa hoàn trả");
            }
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy tài khoản cần ẩn danh hóa"));

        user.setFullName("Tai khoan da an danh");
        user.setEmail("anonymized-" + targetUserId + "@deleted.yitzone.local");
        user.setPersonalEmail(null);
        user.setPersonalEmailVerified(false);
        user.setPersonalEmailVerifiedAt(null);
        user.setClassName(null);
        user.setUnionMemberProfile(null);
        user.setPortraitPhotoUrl(null);
        user.setLifecycleStatus(User.LifecycleStatus.ARCHIVED);
        user.setMemberStatus(User.MemberStatus.LEFT);

        List<User.RoleScope> closedScopes = new ArrayList<>();
        if (user.getRoleScopes() != null) {
            for (User.RoleScope rs : user.getRoleScopes()) {
                if (rs.isActiveAt(now)) {
                    closedScopes.add(new User.RoleScope(
                            rs.roleCode(), rs.positionTitle(), rs.unitId(), rs.scopeType(), rs.scopeId(),
                            rs.termYear(), rs.startAt(), now, rs.expiresAt()
                    ));
                } else {
                    closedScopes.add(rs);
                }
            }
        }
        user.setRoleScopes(closedScopes);
        user.setAssignedModules(new ArrayList<>());
        user.setPermissionVersion(user.getPermissionVersion() + 1L);
        userRepository.save(user);

        if (authIdentityRepository != null) {
            authIdentityRepository.findByUserId(targetUserId).ifPresent(identity -> {
                long nextRtVer = identity.getRefreshTokenVersion() + 1L;
                identity.setEmail(user.getEmail());
                identity.setGoogleSub(null);
                identity.setPasswordHash(null);
                identity.setMfaTotpEnabled(false);
                identity.setMfaTotpSecretEncrypted(null);
                identity.setRefreshTokenVersion(nextRtVer);
                identity.setUpdatedAt(now);
                authIdentityRepository.save(identity);
                if (refreshTokenService != null) {
                    refreshTokenService.revokeAllUserTokens(targetUserId, nextRtVer);
                }
            });
        }
        if (effectivePermissionService != null) {
            effectivePermissionService.evictLocalCache(targetUserId);
        }
        if (rbacCacheService != null) {
            rbacCacheService.invalidateUserPermissions(targetUserId, user.getPermissionVersion());
        }

        recordAudit(actorId, "PRIVACY_USER_ANONYMIZED", targetUserId,
                List.of(new AuditLog.ChangedField("lifecycleStatus", "ACTIVE", "ARCHIVED_ANONYMIZED")),
                note != null && !note.isBlank() ? note : "Ẩn danh hóa PII chủ thể dữ liệu (bảo lưu AuditLog & khen thưởng)");
    }

    private byte[] renderPdfSummary(Map<String, Object> snapshot) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document doc = new Document();
        PdfWriter.getInstance(doc, baos);
        doc.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

        doc.add(new Paragraph("YITZone - Personal Data Export Report", titleFont));
        doc.add(new Paragraph("Exported At: " + snapshot.get("exportedAt"), bodyFont));
        doc.add(new Paragraph("Legal Basis: " + snapshot.get("legalBasis"), bodyFont));
        doc.add(new Paragraph(" "));

        @SuppressWarnings("unchecked")
        Map<String, Object> profile = (Map<String, Object>) snapshot.get("profile");
        doc.add(new Paragraph("1. User Profile", sectionFont));
        if (profile != null) {
            for (Map.Entry<String, Object> entry : profile.entrySet()) {
                doc.add(new Paragraph(" - " + entry.getKey() + ": " + String.valueOf(entry.getValue()), bodyFont));
            }
        }
        doc.add(new Paragraph(" "));

        @SuppressWarnings("unchecked")
        Map<String, Object> authSummary = (Map<String, Object>) snapshot.get("authSummary");
        doc.add(new Paragraph("2. Authentication Summary", sectionFont));
        if (authSummary != null) {
            for (Map.Entry<String, Object> entry : authSummary.entrySet()) {
                doc.add(new Paragraph(" - " + entry.getKey() + ": " + String.valueOf(entry.getValue()), bodyFont));
            }
        }
        doc.add(new Paragraph(" "));

        @SuppressWarnings("unchecked")
        List<ConsentRecord> consents = (List<ConsentRecord>) snapshot.get("consents");
        doc.add(new Paragraph("3. Consent Records (" + (consents == null ? 0 : consents.size()) + ")", sectionFont));
        if (consents != null) {
            for (ConsentRecord c : consents) {
                doc.add(new Paragraph(" - " + c.getConsentType() + " | version=" + c.getPolicyVersion()
                        + " | granted=" + c.isGranted() + " | at=" + c.getGrantedAt(), bodyFont));
            }
        }

        doc.close();
        return baos.toByteArray();
    }

    private ConsentRecord.ConsentType resolveConsentType(String raw) {
        if (raw == null || raw.isBlank()) {
            return ConsentRecord.ConsentType.INITIAL_PRIVACY;
        }
        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        if ("PDPL_BASIC".equals(normalized) || "INITIAL_PRIVACY".equals(normalized)) {
            return ConsentRecord.ConsentType.INITIAL_PRIVACY;
        }
        if ("PHOTO_CHECKIN".equals(normalized) || "PORTRAIT_TICKET".equals(normalized)) {
            return ConsentRecord.ConsentType.PORTRAIT_TICKET;
        }
        if ("YITBOT_DEIDENTIFIED".equals(normalized) || "AI_USAGE".equals(normalized)) {
            return ConsentRecord.ConsentType.AI_USAGE;
        }
        if ("LOCATION_CHECKIN".equals(normalized)) {
            return ConsentRecord.ConsentType.LOCATION_CHECKIN;
        }
        try {
            return ConsentRecord.ConsentType.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            return ConsentRecord.ConsentType.INITIAL_PRIVACY;
        }
    }

    private void recordAudit(String actorId, String action, String targetId, List<AuditLog.ChangedField> fields, String reason) {
        if (auditLogService != null) {
            auditLogService.record(actorId, null, action, "PRIVACY", targetId, fields, reason, null, null);
        }
    }

    public record ExportedDataFile(
            String requestId,
            String format,
            String filename,
            String contentType,
            byte[] content
    ) {
    }
}

