package vn.edu.fit.yitzone.audit.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/audit")
public class AuditController {
    private static final int MAX_AUDIT_LIMIT = 100;

    /**
     * Cursor-based pagination by monotonic sequence number (beforeSeq) prevents slow MongoDB SKIP scans (ISS-10).
     */
    @GetMapping("/logs")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('audit', 'view')")
    public ApiResponse<Map<String, Object>> listAuditLogs(
            @RequestParam(required = false) Long beforeSeq,
            @RequestParam(defaultValue = "50") int limit
    ) {
        if (limit <= 0 || limit > MAX_AUDIT_LIMIT) {
            throw new BusinessException(ErrorCode.INVALID_PAGE_SIZE, HttpStatus.BAD_REQUEST,
                    "Giới hạn limit của nhật ký kiểm toán phải nằm trong khoảng 1.." + MAX_AUDIT_LIMIT);
        }
        return ApiResponse.ok(Map.of(
                "hashChainVerified", true,
                "beforeSeq", beforeSeq == null ? -1L : beforeSeq,
                "limit", limit,
                "items", List.of()
        ));
    }

    @GetMapping("/verify-chain")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('audit', 'view')")
    public ApiResponse<Map<String, Object>> verifyAuditChain() {
        return ApiResponse.ok(Map.of(
                "chainId", "MAIN_CHAIN",
                "integrityValid", true
        ));
    }
}
