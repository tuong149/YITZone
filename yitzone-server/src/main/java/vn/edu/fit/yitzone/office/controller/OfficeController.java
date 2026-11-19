package vn.edu.fit.yitzone.office.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class OfficeController {

    @GetMapping("/duty/schedules")
    public ApiResponse<List<Object>> listDutySchedules() {
        return ApiResponse.ok(List.of());
    }

    @GetMapping("/office/assets")
    public ApiResponse<List<Object>> listOfficeAssets() {
        return ApiResponse.ok(List.of());
    }

    /**
     * Separated leave-requests and swap-requests per RESTful action semantics (ISS-11).
     */
    @PostMapping("/duty/shifts/{id}/leave-requests")
    public ApiResponse<Map<String, Object>> submitLeaveRequest(
            @PathVariable String id,
            @Valid @RequestBody LeaveRequestDto request,
            Authentication auth
    ) {
        return ApiResponse.ok(Map.of(
                "shiftId", id,
                "userId", auth.getName(),
                "makeupShiftId", request.makeupShiftId(),
                "status", "AUTO_APPROVED",
                "submittedAt", Instant.now()
        ));
    }

    @PostMapping("/duty/shifts/{id}/swap-requests")
    public ApiResponse<Map<String, Object>> submitSwapRequest(
            @PathVariable String id,
            @Valid @RequestBody SwapRequestDto request,
            Authentication auth
    ) {
        return ApiResponse.ok(Map.of(
                "shiftId", id,
                "requesterUserId", auth.getName(),
                "targetUserId", request.targetUserId(),
                "targetShiftId", request.targetShiftId(),
                "status", "PENDING_PEER_CONFIRMATION"
        ));
    }

    /**
     * POST barcode-lookup avoids leaking studentCode in GET URL / access logs (ISS-05).
     */
    @PostMapping("/office/borrowers/barcode-lookup")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('inventory', 'scan_barcode')")
    public ApiResponse<Map<String, Object>> lookupBorrowerByBarcode(
            @Valid @RequestBody BorrowerBarcodeLookupRequest request
    ) {
        return ApiResponse.ok(Map.of(
                "studentCode", request.studentCode(),
                "activeBorrows", List.of()
        ));
    }

    public record LeaveRequestDto(
            @NotBlank String makeupShiftId,
            @NotBlank String reason
    ) {}

    public record SwapRequestDto(
            @NotBlank String targetUserId,
            @NotBlank String targetShiftId,
            @NotBlank String reason
    ) {}

    public record BorrowerBarcodeLookupRequest(
            @NotBlank @Pattern(regexp = "^[0-9]{8}$") String studentCode,
            String hardwareType
    ) {}
}
