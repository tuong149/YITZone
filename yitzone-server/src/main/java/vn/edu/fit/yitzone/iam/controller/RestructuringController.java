package vn.edu.fit.yitzone.iam.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.iam.domain.RestructuringBatch;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.service.RestructuringService;

import java.time.Instant;
import java.util.List;

/**
 * Single & Scoped Batch Personnel Restructuring endpoints (UC-IAM-06, Edge 29).
 */
@RestController
@RequestMapping("/api/v1/iam")
public class RestructuringController {
    private final RestructuringService restructuringService;

    public RestructuringController(RestructuringService restructuringService) {
        this.restructuringService = restructuringService;
    }

    @PostMapping("/personnel/appoint")
    public ApiResponse<User> appointSingle(
            @Valid @RequestBody RestructuringService.SingleAppointmentRequest req,
            Authentication auth
    ) {
        return ApiResponse.ok(restructuringService.appointSingle(req, auth.getName()));
    }

    @PostMapping("/personnel/dismiss")
    public ApiResponse<User> dismissSingle(
            @Valid @RequestBody RestructuringService.SingleDismissRequest req,
            Authentication auth
    ) {
        return ApiResponse.ok(restructuringService.dismissSingle(req, auth.getName()));
    }

    @PostMapping("/personnel/transfer")
    public ApiResponse<User> transferSingle(
            @Valid @RequestBody RestructuringService.SingleTransferRequest req,
            Authentication auth
    ) {
        return ApiResponse.ok(restructuringService.transferSingle(req, auth.getName()));
    }

    @GetMapping("/restructuring-batches")
    public ApiResponse<List<RestructuringBatch>> listBatches() {
        return ApiResponse.ok(restructuringService.listBatches());
    }

    @PostMapping("/restructuring-batches")
    public ApiResponse<RestructuringBatch> createBatch(
            @Valid @RequestBody CreateBatchBody body,
            Authentication auth
    ) {
        return ApiResponse.ok(restructuringService.createBatch(
                new RestructuringService.CreateBatchRequest(
                        body.title(),
                        body.termYear(),
                        body.targetUnitIds(),
                        body.changes(),
                        body.effectiveAt()
                ),
                auth.getName()
        ));
    }

    @PutMapping("/restructuring-batches/{id}")
    public ApiResponse<RestructuringBatch> updateBatch(
            @PathVariable String id,
            @RequestBody RestructuringService.UpdateBatchRequest body,
            Authentication auth
    ) {
        return ApiResponse.ok(restructuringService.updateBatch(id, body, auth.getName()));
    }

    @PostMapping("/restructuring-batches/{id}/preview-diff")
    public ApiResponse<RestructuringService.DiffPreviewResponse> previewDiff(
            @PathVariable String id,
            Authentication auth
    ) {
        return ApiResponse.ok(restructuringService.previewDiff(id, auth.getName()));
    }

    @PostMapping("/restructuring-batches/{id}/publish")
    public ApiResponse<RestructuringBatch> publishBatch(
            @PathVariable String id,
            @RequestBody(required = false) PublishBatchBody body,
            Authentication auth
    ) {
        Instant effectiveAt = body != null ? body.effectiveAt() : null;
        String reason = body != null ? body.reason() : null;
        return ApiResponse.ok(restructuringService.publishBatch(id, effectiveAt, reason, auth.getName()));
    }

    public record CreateBatchBody(
            @NotBlank String title,
            String termYear,
            List<String> targetUnitIds,
            List<RestructuringBatch.PersonnelChangeItem> changes,
            Instant effectiveAt
    ) {
    }

    public record PublishBatchBody(
            Instant effectiveAt,
            String reason
    ) {
    }
}

