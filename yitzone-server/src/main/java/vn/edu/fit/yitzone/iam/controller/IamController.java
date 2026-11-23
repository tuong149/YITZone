package vn.edu.fit.yitzone.iam.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.common.security.DevicePopVerifierService;
import vn.edu.fit.yitzone.common.security.JwtTokenService;
import vn.edu.fit.yitzone.common.security.ScopeContextHolder;
import vn.edu.fit.yitzone.iam.domain.FacultyMajorCatalog;
import vn.edu.fit.yitzone.iam.domain.OrgUnit;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.service.FacultyMajorCatalogService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;

import java.io.IOException;
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
    private final DevicePopVerifierService devicePopVerifierService;
    private final RbacCacheInvalidationService rbacCacheService;
    private final FacultyMajorCatalogService facultyMajorCatalogService;
    private final Environment environment;

    public IamController(
            JwtTokenService jwtTokenService,
            OrgUnitRepository orgUnitRepository,
            DevicePopVerifierService devicePopVerifierService,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService,
            @Autowired(required = false) FacultyMajorCatalogService facultyMajorCatalogService,
            Environment environment
    ) {
        this.jwtTokenService = jwtTokenService;
        this.orgUnitRepository = orgUnitRepository;
        this.devicePopVerifierService = devicePopVerifierService;
        this.rbacCacheService = rbacCacheService;
        this.facultyMajorCatalogService = facultyMajorCatalogService;
        this.environment = environment;
    }

    @PostMapping("/auth/dev-token")
    public ApiResponse<TokenResponse> issueDevToken(@Valid @RequestBody DevLoginRequest request) {
        if (!environment.acceptsProfiles(Profiles.of("dev", "test"))) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Endpoint cấp dev-token chỉ hoạt động trên profile 'dev' hoặc 'test'");
        }
        List<String> requested = request.authorities() == null || request.authorities().isEmpty()
                ? List.of("event:view", "attendance:check_in")
                : request.authorities();
        if (requested.stream().anyMatch(a -> !SAFE_DEV_AUTHORITIES.contains(a))) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Không cho phép tự cấp quyền đặc quyền (ROLE_STANDING_COMMITTEE / Admin) qua dev-token");
        }
        List<String> scopes = List.of("FACULTY");
        if (rbacCacheService != null) {
            rbacCacheService.registerLocalUserScopes(request.userId(), Set.copyOf(scopes));
        }
        String token = jwtTokenService.generateAccessToken(
                request.userId(),
                request.email(),
                1L,
                requested,
                scopes
        );
        return ApiResponse.ok(new TokenResponse(token, "Bearer"));
    }

    @GetMapping("/me")
    public ApiResponse<MeResponse> me(Authentication authentication) {
        String activeScope = ScopeContextHolder.getActiveScopeId() == null ? "FACULTY" : ScopeContextHolder.getActiveScopeId();
        List<String> authorities = authentication.getAuthorities().stream().map(Object::toString).toList();
        Set<String> allowedScopes = ScopeContextHolder.getAllowedScopes();
        List<String> scopes = allowedScopes.isEmpty() ? List.of("FACULTY") : List.copyOf(allowedScopes);
        return ApiResponse.ok(new MeResponse(authentication.getName(), activeScope, authorities, scopes));
    }

    @GetMapping("/org-units")
    public ApiResponse<List<OrgUnit>> listOrgUnits() {
        return ApiResponse.ok(orgUnitRepository.findAll());
    }

    @PostMapping("/device-tokens")
    public ApiResponse<DeviceKeyRegistrationResponse> registerDeviceKey(
            @Valid @RequestBody DeviceKeyRequest request,
            Authentication auth,
            HttpServletRequest servletRequest
    ) {
        String userAgent = servletRequest.getHeader(HttpHeaders.USER_AGENT);
        devicePopVerifierService.registerDeviceKeyForUser(auth.getName(), request.publicKeyJwk(), userAgent);
        String kty = String.valueOf(request.publicKeyJwk().getOrDefault("kty", "EC"));
        return ApiResponse.ok(new DeviceKeyRegistrationResponse(
                auth.getName(),
                "ECDSA P-256",
                true,
                kty
        ));
    }

    @PostMapping("/roster/import")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('rbac', 'manage')")
    public ApiResponse<RosterImportStatusResponse> importOfficialRoster() {
        return ApiResponse.ok(new RosterImportStatusResponse("READY_FOR_CSV_STREAMING"));
    }

    @GetMapping("/majors")
    public ApiResponse<List<FacultyMajorCatalog>> listMajors(
            @RequestParam(required = false) String facultyName,
            @RequestParam(required = false) Boolean fitOnly
    ) {
        if (facultyMajorCatalogService == null) {
            return ApiResponse.ok(List.of());
        }
        return ApiResponse.ok(facultyMajorCatalogService.listAll(facultyName, fitOnly));
    }

    @GetMapping("/majors/resolve/{studentCode}")
    public ApiResponse<MajorResolutionResponse> resolveMajorFromStudentCode(@PathVariable String studentCode) {
        if (facultyMajorCatalogService == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                    "Dịch vụ danh mục Khoa - Ngành chưa sẵn sàng");
        }
        FacultyMajorCatalog entry = facultyMajorCatalogService.resolveFromStudentCode(studentCode)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.NOT_FOUND,
                        HttpStatus.NOT_FOUND,
                        "Không tìm thấy ngành học tương ứng với MSSV: " + studentCode
                ));
        return ApiResponse.ok(new MajorResolutionResponse(
                studentCode,
                entry.getMajorCode(),
                entry.getMajorName(),
                entry.getFacultyName(),
                entry.isFitFaculty()
        ));
    }

    @PostMapping(value = "/majors/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('rbac', 'manage')")
    public ApiResponse<MajorImportResponse> importMajorsCsv(
            @RequestPart("file") MultipartFile file,
            Authentication auth
    ) {
        if (facultyMajorCatalogService == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Dịch vụ danh mục Khoa - Ngành chưa sẵn sàng");
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Tệp CSV danh mục Khoa - Ngành không được để trống");
        }
        try {
            int imported = facultyMajorCatalogService.importFromCsv(file.getInputStream(), auth.getName());
            return ApiResponse.ok(new MajorImportResponse(imported, "IMPORTED"));
        } catch (IOException ex) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Không thể đọc tệp CSV tải lên: " + ex.getMessage());
        }
    }

    public record MajorResolutionResponse(
            String studentCode,
            String majorCode,
            String majorName,
            String facultyName,
            boolean fitFaculty
    ) {}

    public record MajorImportResponse(int importedCount, String status) {}

    public record DevLoginRequest(
            @NotBlank String userId,
            @NotBlank @Email String email,
            List<String> authorities
    ) {}

    public record TokenResponse(String accessToken, String tokenType) {}

    public record MeResponse(
            String userId,
            String activeScopeId,
            List<String> authorities,
            List<String> allowedScopes
    ) {}

    public record DeviceKeyRequest(@NotEmpty Map<String, Object> publicKeyJwk) {}

    public record DeviceKeyRegistrationResponse(
            String userId,
            String algorithm,
            boolean registered,
            String kty
    ) {}

    public record RosterImportStatusResponse(String status) {}
}
