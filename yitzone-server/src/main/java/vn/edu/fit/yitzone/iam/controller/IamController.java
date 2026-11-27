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
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.domain.UserAuthIdentity;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.UserAuthIdentityRepository;
import vn.edu.fit.yitzone.iam.repository.UserRepository;
import vn.edu.fit.yitzone.iam.service.EffectivePermissionService;
import vn.edu.fit.yitzone.iam.service.FacultyMajorCatalogService;
import vn.edu.fit.yitzone.iam.service.OfficialDirectoryRosterService;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;
import vn.edu.fit.yitzone.iam.service.UserLifecycleProfileService;

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
    private final OfficialDirectoryRosterService rosterService;
    private final UserRepository userRepository;
    private final UserAuthIdentityRepository authIdentityRepository;
    private final EffectivePermissionService effectivePermissionService;
    private final UserLifecycleProfileService lifecycleProfileService;
    private final Environment environment;

    public IamController(
            JwtTokenService jwtTokenService,
            OrgUnitRepository orgUnitRepository,
            DevicePopVerifierService devicePopVerifierService,
            @Autowired(required = false) RbacCacheInvalidationService rbacCacheService,
            @Autowired(required = false) FacultyMajorCatalogService facultyMajorCatalogService,
            @Autowired(required = false) OfficialDirectoryRosterService rosterService,
            @Autowired(required = false) UserRepository userRepository,
            @Autowired(required = false) UserAuthIdentityRepository authIdentityRepository,
            @Autowired(required = false) EffectivePermissionService effectivePermissionService,
            @Autowired(required = false) UserLifecycleProfileService lifecycleProfileService,
            Environment environment
    ) {
        this.jwtTokenService = jwtTokenService;
        this.orgUnitRepository = orgUnitRepository;
        this.devicePopVerifierService = devicePopVerifierService;
        this.rbacCacheService = rbacCacheService;
        this.facultyMajorCatalogService = facultyMajorCatalogService;
        this.rosterService = rosterService;
        this.userRepository = userRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.effectivePermissionService = effectivePermissionService;
        this.lifecycleProfileService = lifecycleProfileService;
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
        String userId = authentication.getName();
        String activeScope = ScopeContextHolder.getActiveScopeId() == null ? "FACULTY" : ScopeContextHolder.getActiveScopeId();
        List<String> authorities = authentication.getAuthorities().stream().map(Object::toString).toList();
        Set<String> allowedScopes = ScopeContextHolder.getAllowedScopes();
        List<String> scopes = allowedScopes.isEmpty() ? List.of("FACULTY") : List.copyOf(allowedScopes);

        User user = userRepository != null ? userRepository.findById(userId).orElse(null) : null;
        UserAuthIdentity identity = authIdentityRepository != null ? authIdentityRepository.findByUserId(userId).orElse(null) : null;
        List<EffectivePermissionService.RoleScopeView> roleScopes = List.of();
        List<User.AssignedModule> assignedModules = List.of();

        if (user != null) {
            assignedModules = user.getAssignedModules() == null ? List.of() : List.copyOf(user.getAssignedModules());
            if (effectivePermissionService != null) {
                EffectivePermissionService.ComputedPermissions computed = effectivePermissionService.resolveForUser(user);
                authorities = computed.authorities();
                scopes = List.copyOf(computed.allowedScopes());
                roleScopes = computed.roleScopes();
            }
        }

        boolean fitFaculty = user != null && user.getStudentCode() != null
                && facultyMajorCatalogService != null
                && facultyMajorCatalogService.isFitStudentCode(user.getStudentCode());

        return ApiResponse.ok(new MeResponse(
                userId,
                user != null ? user.getEmail() : null,
                user != null ? user.getFullName() : null,
                user != null ? user.getStudentCode() : null,
                user != null ? user.getMajorCode() : null,
                fitFaculty,
                identity != null && identity.getPasswordHash() != null,
                identity != null && identity.isMfaTotpEnabled(),
                activeScope,
                authorities,
                scopes,
                roleScopes,
                assignedModules,
                user != null ? user.getUserType() : null,
                user != null ? user.getLifecycleStatus() : null,
                user != null ? user.getMemberStatus() : null,
                user != null ? user.getClassName() : null,
                user != null ? user.getPersonalEmail() : null,
                user != null && user.isPersonalEmailVerified(),
                user != null ? user.getUnionMemberProfile() : null,
                user != null && user.getTermHistory() != null ? List.copyOf(user.getTermHistory()) : List.of()
        ));
    }

    @PutMapping("/me/profile")
    public ApiResponse<User> updateMyProfile(
            @RequestBody UserLifecycleProfileService.UpdateProfileRequest request,
            Authentication auth
    ) {
        if (lifecycleProfileService == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Dịch vụ cập nhật hồ sơ chưa sẵn sàng");
        }
        return ApiResponse.ok(lifecycleProfileService.updateMyProfile(auth.getName(), request));
    }

    @PostMapping("/personal-email/link")
    public ApiResponse<UserLifecycleProfileService.PersonalEmailOtpResult> linkPersonalEmail(
            @Valid @RequestBody LinkPersonalEmailRequest request,
            Authentication auth
    ) {
        if (lifecycleProfileService == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Dịch vụ liên kết email cá nhân chưa sẵn sàng");
        }
        return ApiResponse.ok(lifecycleProfileService.requestPersonalEmailLink(auth.getName(), request.personalEmail()));
    }

    @PostMapping("/personal-email/verify-otp")
    public ApiResponse<UserLifecycleProfileService.PersonalEmailVerifiedResult> verifyPersonalEmailOtp(
            @Valid @RequestBody VerifyPersonalEmailOtpRequest request,
            Authentication auth
    ) {
        if (lifecycleProfileService == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Dịch vụ xác thực email cá nhân chưa sẵn sàng");
        }
        return ApiResponse.ok(lifecycleProfileService.verifyPersonalEmailOtp(auth.getName(), request.otpCode()));
    }

    @PatchMapping("/users/{userId}/lifecycle")
    @PreAuthorize("hasRole('STANDING_COMMITTEE')")
    public ApiResponse<User> updateUserLifecycle(
            @PathVariable String userId,
            @RequestBody UpdateLifecycleRequest request,
            Authentication auth
    ) {
        if (lifecycleProfileService == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Dịch vụ vòng đời tài khoản chưa sẵn sàng");
        }
        return ApiResponse.ok(lifecycleProfileService.updateLifecycleStatus(
                userId,
                request.lifecycleStatus(),
                request.reason(),
                auth.getName()
        ));
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

    @GetMapping("/roster")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<List<OfficialDirectoryRosterService.RosterItemDto>> listOfficialRoster(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        if (rosterService == null) {
            return ApiResponse.ok(List.of());
        }
        return ApiResponse.ok(rosterService.listRoster(search, page, size));
    }

    @PostMapping(value = "/roster/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<OfficialDirectoryRosterService.RosterImportSummary> importOfficialRosterFile(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String term,
            Authentication auth
    ) {
        if (rosterService == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Dịch vụ nhập danh sách Roster chưa sẵn sàng");
        }
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Tệp CSV/Excel danh sách Roster không được để trống");
        }
        try {
            return ApiResponse.ok(rosterService.importRoster(file.getInputStream(), file.getOriginalFilename(), term, auth.getName()));
        } catch (IOException ex) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Không thể đọc tệp Roster tải lên: " + ex.getMessage());
        }
    }

    @PostMapping("/majors")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<FacultyMajorCatalog> createSingleMajor(
            @Valid @RequestBody CreateMajorRequest request,
            Authentication auth
    ) {
        if (facultyMajorCatalogService == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Dịch vụ danh mục Khoa - Ngành chưa sẵn sàng");
        }
        return ApiResponse.ok(facultyMajorCatalogService.createOrUpdateMajor(
                request.majorCode(),
                request.majorName(),
                request.facultyName(),
                request.fitFaculty(),
                request.active(),
                auth.getName()
        ));
    }

    @PutMapping("/majors/{majorCode}")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasRole('SYSTEM_ADMIN') or hasPermission('rbac', 'manage')")
    public ApiResponse<FacultyMajorCatalog> updateMajor(
            @PathVariable String majorCode,
            @RequestBody UpdateMajorRequest request,
            Authentication auth
    ) {
        if (facultyMajorCatalogService == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR,
                    "Dịch vụ danh mục Khoa - Ngành chưa sẵn sàng");
        }
        return ApiResponse.ok(facultyMajorCatalogService.updateMajor(
                majorCode,
                request.majorName(),
                request.facultyName(),
                request.fitFaculty(),
                request.active(),
                auth.getName()
        ));
    }

    @GetMapping("/majors")
    public ApiResponse<List<FacultyMajorCatalog>> listMajors(
            @RequestParam(required = false) String facultyName,
            @RequestParam(required = false) Boolean fitOnly,
            @RequestParam(defaultValue = "false") boolean includeInactive
    ) {
        if (facultyMajorCatalogService == null) {
            return ApiResponse.ok(List.of());
        }
        return ApiResponse.ok(facultyMajorCatalogService.listAll(facultyName, fitOnly, includeInactive));
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
            String email,
            String fullName,
            String studentCode,
            String majorCode,
            boolean fitFaculty,
            boolean hasPassword,
            boolean mfaEnabled,
            String activeScopeId,
            List<String> authorities,
            List<String> allowedScopes,
            List<EffectivePermissionService.RoleScopeView> roleScopes,
            List<User.AssignedModule> assignedModules,
            User.UserType userType,
            User.LifecycleStatus lifecycleStatus,
            User.MemberStatus memberStatus,
            String className,
            String personalEmail,
            boolean personalEmailVerified,
            User.UnionMemberProfile unionMemberProfile,
            List<User.TermHistory> termHistory
    ) {}

    public record LinkPersonalEmailRequest(@NotBlank @Email String personalEmail) {}

    public record VerifyPersonalEmailOtpRequest(@NotBlank String otpCode) {}

    public record UpdateLifecycleRequest(User.LifecycleStatus lifecycleStatus, String reason) {}

    public record CreateMajorRequest(
            @NotBlank String majorCode,
            @NotBlank String majorName,
            @NotBlank String facultyName,
            Boolean fitFaculty,
            Boolean active
    ) {}

    public record UpdateMajorRequest(
            String majorName,
            String facultyName,
            Boolean fitFaculty,
            Boolean active
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
