package vn.edu.fit.yitzone.office.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.time.Instant;
import java.util.List;

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
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> submitLeaveRequest(
            @PathVariable String id,
            @Valid @RequestBody LeaveRequestDto request,
            Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok(new LeaveRequestResponse(
                id,
                auth.getName(),
                request.makeupShiftId(),
                "PENDING_VERIFICATION",
                Instant.now()
        )));
    }

    @PostMapping("/duty/shifts/{id}/swap-requests")
    public ResponseEntity<ApiResponse<SwapRequestResponse>> submitSwapRequest(
            @PathVariable String id,
            @Valid @RequestBody SwapRequestDto request,
            Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok(new SwapRequestResponse(
                id,
                auth.getName(),
                request.targetUserId(),
                request.targetShiftId(),
                "PENDING_PEER_CONFIRMATION"
        )));
    }

    /**
     * POST barcode-lookup avoids leaking studentCode in GET URL / access logs (ISS-05).
     */
    @PostMapping("/office/borrowers/barcode-lookup")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('inventory', 'scan_barcode')")
    public ApiResponse<BorrowerBarcodeLookupResponse> lookupBorrowerByBarcode(
            @Valid @RequestBody BorrowerBarcodeLookupRequest request
    ) {
        return ApiResponse.ok(new BorrowerBarcodeLookupResponse(
                request.studentCode(),
                List.of()
        ));
    }

    public record LeaveRequestDto(
            @NotBlank String makeupShiftId,
            @NotBlank String reason
    ) {}

    public record LeaveRequestResponse(
            String shiftId,
            String userId,
            String makeupShiftId,
            String status,
            Instant submittedAt
    ) {}

    public record SwapRequestDto(
            @NotBlank String targetUserId,
            @NotBlank String targetShiftId,
            @NotBlank String reason
    ) {}

    public record SwapRequestResponse(
            String shiftId,
            String requesterUserId,
            String targetUserId,
            String targetShiftId,
            String status
    ) {}

    public record BorrowerBarcodeLookupRequest(
            @NotBlank @Pattern(regexp = "^[0-9]{8}$") String studentCode,
            String hardwareType
    ) {}

    public record BorrowerBarcodeLookupResponse(
            String studentCode,
            List<Object> activeBorrows
    ) {}
}
