package vn.edu.fit.yitzone.iam.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.domain.PermissionModule;
import vn.edu.fit.yitzone.iam.repository.PermissionModuleRepository;

import java.util.List;
import java.util.Set;

/**
 * Manages the 20 Business Permission Modules and enforces SRS FR-RBAC-02 security invariants (UC-IAM-09).
 */
@Service
public class PermissionModuleService {
    private static final Set<String> SENSITIVE_SEPARATED_PERMS = Set.of("liveqa:moderate", "liveqa:unmask");

    private final PermissionModuleRepository permissionModuleRepository;

    public PermissionModuleService(PermissionModuleRepository permissionModuleRepository) {
        this.permissionModuleRepository = permissionModuleRepository;
    }

    public List<PermissionModule> listAll() {
        return permissionModuleRepository.findAll();
    }

    public PermissionModule saveModule(PermissionModule module) {
        validateInvariants(module);
        return permissionModuleRepository.save(module);
    }

    public void validateInvariants(PermissionModule module) {
        if (module == null || module.getModuleCode() == null || module.getModuleCode().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Mã gói quyền không hợp lệ");
        }
        List<String> perms = module.getIncludedPermissions() == null ? List.of() : module.getIncludedPermissions();

        if (module.getModuleCode().startsWith("MOD_DEPT_")) {
            boolean containsHr = perms.stream().anyMatch(p -> p.startsWith("hr:"));
            if (containsHr) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Vi phạm nguyên tắc tách quyền (FR-RBAC-02): Không được gộp quyền nhân sự (hr:*) vào gói chuyên môn " + module.getModuleCode());
            }
        }

        if (perms.containsAll(SENSITIVE_SEPARATED_PERMS)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Vi phạm nguyên tắc tách quyền nhạy cảm: Không được gộp chung liveqa:moderate và liveqa:unmask trong cùng 1 gói");
        }

        if ("MOD_YITBOT_FULL".equals(module.getModuleCode()) && !module.isNonDelegable()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Gói MOD_YITBOT_FULL bắt buộc phải ở trạng thái nonDelegable = true");
        }
    }
}
