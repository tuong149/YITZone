package vn.edu.fit.yitzone.iam.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.common.security.JwtTokenService;
import vn.edu.fit.yitzone.common.security.ScopeContextHolder;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/iam")
public class IamController {
    private static final Set<String> SAFE_DEV_AUTHORITIES = Set.of(
            "event:view",
            "attendance:check_in",
            "store:view",
            "voting:cast"
    );

    private final JwtTokenService jwtTokenService;
    private final OrgUnitRepository orgUnitRepository;
    private final boolean devTokenEnabled;

    public IamController(
            JwtTokenService jwtTokenService,
            OrgUnitRepository orgUnitRepository,
            @Value("${yitzone.security.enable-dev-token:false}") boolean devTokenEnabled
    ) {
        this.jwtTokenService = jwtTokenService;
        this.orgUnitRepository = orgUnitRepository;
        this.devTokenEnabled = devTokenEnabled;
    }

    @PostMapping("/auth/dev-token")
    public ApiResponse<TokenResponse> issueDevToken(@Valid @RequestBody DevLoginRequest request) {
        if (!devTokenEnabled) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Endpoint cấp dev-token bị khóa trên môi trường Production");
        }
        List<String> requested = request.authorities() == null || request.authorities().isEmpty()
                ? List.of("event:view", "attendance:check_in")
                : request.authorities();
        if (requested.stream().anyMatch(a -> !SAFE_DEV_AUTHORITIES.contains(a))) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Không cho phép tự cấp quyền đặc quyền (ROLE_STANDING_COMMITTEE / Admin) qua dev-token");
        }
        String token = jwtTokenService.generateAccessToken(
                request.userId(),
                request.email(),
                1L,
                requested
        );
        return ApiResponse.ok(new TokenResponse(token, "Bearer"));
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(Authentication authentication) {
        return ApiResponse.ok(Map.of(
                "userId", authentication.getName(),
                "activeScopeId", ScopeContextHolder.getActiveScopeId() == null ? "FACULTY" : ScopeContextHolder.getActiveScopeId(),
                "authorities", authentication.getAuthorities().stream().map(Object::toString).toList()
        ));
    }

    @GetMapping("/org-units")
    public ApiResponse<List<OrgUnit>> listOrgUnits() {
        return ApiResponse.ok(orgUnitRepository.findAll());
    }

    @PostMapping("/device-tokens")
    public ApiResponse<Map<String, Object>> registerDeviceKey(@Valid @RequestBody DeviceKeyRequest request, Authentication auth) {
        return ApiResponse.ok(Map.of(
                "userId", auth.getName(),
                "algorithm", "ECDSA P-256",
                "registered", true,
                "kty", request.publicKeyJwk().getOrDefault("kty", "EC")
        ));
    }

    @PostMapping("/roster/import")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('rbac', 'manage')")
    public ApiResponse<Map<String, Object>> importOfficialRoster() {
        return ApiResponse.ok(Map.of("status", "READY_FOR_CSV_STREAMING"));
    }

    public record DevLoginRequest(
            @NotBlank String userId,
            @NotBlank @Email String email,
            List<String> authorities
    ) {}

    public record TokenResponse(String accessToken, String tokenType) {}

    public record DeviceKeyRequest(@NotEmpty Map<String, Object> publicKeyJwk) {}
}
