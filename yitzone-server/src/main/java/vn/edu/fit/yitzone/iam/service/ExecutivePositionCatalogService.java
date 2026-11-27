package vn.edu.fit.yitzone.iam.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.ExecutivePositionCatalog;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.repository.ExecutivePositionCatalogRepository;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * CRUD service for dynamic executive position titles (UC-IAM-09).
 */
@Service
public class ExecutivePositionCatalogService {
    private final ExecutivePositionCatalogRepository repository;
    private final AuditLogService auditLogService;

    public ExecutivePositionCatalogService(
            ExecutivePositionCatalogRepository repository,
            @Autowired(required = false) AuditLogService auditLogService
    ) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    public List<ExecutivePositionCatalog> listAll(boolean includeInactive) {
        return repository.findAll().stream()
                .filter(item -> includeInactive || item.isActive())
                .sorted(Comparator.comparing(ExecutivePositionCatalog::getOrgUnitCode, Comparator.nullsLast(String::compareTo))
                        .thenComparing(ExecutivePositionCatalog::getCode, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    public ExecutivePositionCatalog createTitle(
            String code,
            String displayName,
            String orgUnitCode,
            RoleCode mappedRoleCode,
            int maxQuota,
            String actorId
    ) {
        String normalizedCode = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        if (normalizedCode.isBlank() || displayName == null || displayName.isBlank() || orgUnitCode == null || orgUnitCode.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Mã chức danh, Tên chức danh và Mã đơn vị không được để trống");
        }
        if (maxQuota < 1 || maxQuota > 200) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Định biên chức danh phải nằm trong khoảng 1 đến 200");
        }
        if (repository.findByCode(normalizedCode).isPresent()) {
            throw new BusinessException(ErrorCode.CONFLICT, HttpStatus.CONFLICT,
                    "Mã chức danh '" + normalizedCode + "' đã tồn tại");
        }

        ExecutivePositionCatalog created = new ExecutivePositionCatalog(
                normalizedCode,
                displayName.trim(),
                orgUnitCode.trim().toUpperCase(Locale.ROOT),
                mappedRoleCode == null ? RoleCode.EXECUTIVE_COMMITTEE : mappedRoleCode,
                maxQuota,
                false,
                true,
                Instant.now(),
                actorId
        );
        ExecutivePositionCatalog saved = repository.save(created);
        recordAudit(actorId, "RBAC_POSITION_TITLE_CREATED", saved.getCode(),
                List.of(new AuditLog.ChangedField("displayName", null, saved.getDisplayName()),
                        new AuditLog.ChangedField("maxQuota", null, saved.getMaxQuota())),
                "Tạo mới chức danh điều hành " + saved.getCode());
        return saved;
    }

    public ExecutivePositionCatalog updateTitle(
            String code,
            String displayName,
            String orgUnitCode,
            RoleCode mappedRoleCode,
            Integer maxQuota,
            Boolean active,
            String actorId
    ) {
        String normalizedCode = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        ExecutivePositionCatalog existing = repository.findByCode(normalizedCode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy chức danh điều hành: " + normalizedCode));

        String oldName = existing.getDisplayName();
        int oldQuota = existing.getMaxQuota();
        boolean oldActive = existing.isActive();

        if (displayName != null && !displayName.isBlank()) {
            existing.setDisplayName(displayName.trim());
        }
        if (orgUnitCode != null && !orgUnitCode.isBlank()) {
            existing.setOrgUnitCode(orgUnitCode.trim().toUpperCase(Locale.ROOT));
        }
        if (mappedRoleCode != null) {
            existing.setMappedRoleCode(mappedRoleCode);
        }
        if (maxQuota != null) {
            if (maxQuota < 1 || maxQuota > 200) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Định biên chức danh phải nằm trong khoảng 1 đến 200");
            }
            existing.setMaxQuota(maxQuota);
        }
        if (active != null) {
            existing.setActive(active);
        }
        existing.setUpdatedAt(Instant.now());
        existing.setUpdatedBy(actorId);

        ExecutivePositionCatalog saved = repository.save(existing);
        recordAudit(actorId, "RBAC_POSITION_TITLE_UPDATED", saved.getCode(),
                List.of(
                        new AuditLog.ChangedField("displayName", oldName, saved.getDisplayName()),
                        new AuditLog.ChangedField("maxQuota", oldQuota, saved.getMaxQuota()),
                        new AuditLog.ChangedField("active", oldActive, saved.isActive())
                ),
                "Cập nhật chức danh điều hành " + saved.getCode());
        return saved;
    }

    private void recordAudit(String actorId, String action, String targetId, List<AuditLog.ChangedField> fields, String reason) {
        if (auditLogService != null) {
            auditLogService.record(actorId, null, action, "EXECUTIVE_POSITION_TITLE", targetId, fields, reason, null, null);
        }
    }
}

