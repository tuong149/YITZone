package vn.edu.fit.yitzone.iam.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.iam.domain.RoleCode;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.service.AccountAdminService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/iam/accounts")
public class AccountAdminController {
    private final AccountAdminService accountAdminService;

    public AccountAdminController(AccountAdminService accountAdminService) {
        this.accountAdminService = accountAdminService;
    }

    @GetMapping
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<List<AccountAdminService.AccountSummary>> listAccounts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String userType,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.ok(accountAdminService.listAccounts(search, userType, status));
    }

    @PostMapping
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<AccountAdminService.AccountSummary> createAccount(
            @Valid @RequestBody CreateAccountBody body,
            Authentication auth
    ) {
        return ApiResponse.ok(accountAdminService.createAccount(
                new AccountAdminService.CreateAccountRequest(
                        body.fullName(),
                        body.email(),
                        body.studentCode(),
                        body.userType(),
                        body.roleCode(),
                        body.scopeId(),
                        body.initialPassword()
                ),
                auth
        ));
    }

    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<AccountAdminService.AccountSummary> updateStatus(
            @PathVariable String userId,
            @RequestBody UpdateStatusBody body,
            Authentication auth
    ) {
        return ApiResponse.ok(accountAdminService.updateAccountStatus(
                userId,
                new AccountAdminService.UpdateStatusRequest(
                        body.lifecycleStatus(),
                        body.locked(),
                        body.reason()
                ),
                auth
        ));
    }

    @PostMapping("/{userId}/reset-password")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<Map<String, Object>> resetPassword(
            @PathVariable String userId,
            @Valid @RequestBody ResetPasswordBody body,
            Authentication auth
    ) {
        accountAdminService.resetPassword(
                userId,
                new AccountAdminService.ResetPasswordRequest(body.newPassword(), body.reason()),
                auth
        );
        return ApiResponse.ok(Map.of("reset", true, "userId", userId));
    }

    public record CreateAccountBody(
            @NotBlank String fullName,
            @NotBlank @Email String email,
            String studentCode,
            User.UserType userType,
            RoleCode roleCode,
            String scopeId,
            String initialPassword
    ) {
    }

    public record UpdateStatusBody(
            User.LifecycleStatus lifecycleStatus,
            Boolean locked,
            String reason
    ) {
    }

    public record ResetPasswordBody(
            @NotBlank String newPassword,
            String reason
    ) {
    }
}
