package vn.edu.fit.yitzone.audit.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {
    private static final int MAX_AUDIT_LIMIT = 100;

    /**
     * Cursor-based pagination by monotonic sequence number (beforeSeq) prevents slow MongoDB SKIP scans (ISS-10).
     */
    @GetMapping("/logs")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('audit', 'view')")
    public ApiResponse<AuditLogPageResponse> listAuditLogs(
            @RequestParam(required = false) Long beforeSeq,
            @RequestParam(defaultValue = "50") int limit
    ) {
        if (limit <= 0 || limit > MAX_AUDIT_LIMIT) {
            throw new BusinessException(ErrorCode.INVALID_PAGE_SIZE, HttpStatus.BAD_REQUEST,
                    "Giới hạn limit của nhật ký kiểm toán phải nằm trong khoảng 1.." + MAX_AUDIT_LIMIT);
        }
        return ApiResponse.ok(new AuditLogPageResponse(
                false,
                beforeSeq == null ? -1L : beforeSeq,
                limit,
                List.of()
        ));
    }

    @GetMapping("/verify-chain")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('audit', 'view')")
    public ApiResponse<AuditChainVerificationResponse> verifyAuditChain() {
        return ApiResponse.ok(new AuditChainVerificationResponse(
                "MAIN_CHAIN",
                false,
                0L
        ));
    }

    public record AuditLogPageResponse(
            boolean hashChainVerified,
            long beforeSeq,
            int limit,
            List<AuditLog> items
    ) {}

    public record AuditChainVerificationResponse(
            String chainId,
            boolean integrityValid,
            long verifiedEntriesCount
    ) {}
}
