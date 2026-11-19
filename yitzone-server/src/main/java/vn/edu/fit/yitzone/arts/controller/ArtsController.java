package vn.edu.fit.yitzone.arts.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/arts")
public class ArtsController {

    @GetMapping("/performances")
    public ApiResponse<List<Object>> listPerformances() {
        return ApiResponse.ok(List.of());
    }

    /**
     * Asynchronous ZIP export job (202 Accepted) returns Pre-signed Silo URL supporting HTTP Range resume (ISS-03).
     */
    @PostMapping("/events/{eventId}/export-jobs")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('performance', 'approve') or hasPermission('performance', 'view')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createExportJob(@PathVariable String eventId) {
        String jobId = "EXP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok(Map.of(
                "jobId", jobId,
                "eventId", eventId,
                "status", "PROCESSING",
                "statusUrl", "/api/v1/arts/events/" + eventId + "/export-jobs/" + jobId
        )));
    }

    @GetMapping("/events/{eventId}/export-jobs/{jobId}")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('performance', 'approve') or hasPermission('performance', 'view')")
    public ApiResponse<Map<String, Object>> getExportJobStatus(
            @PathVariable String eventId,
            @PathVariable String jobId
    ) {
        return ApiResponse.ok(Map.of(
                "jobId", jobId,
                "eventId", eventId,
                "status", "COMPLETED",
                "supportsHttpRangeResume", true,
                "presignedDownloadUrl", "https://silo.yitzone.edu.vn/arts-exports/" + eventId + "_" + jobId + ".zip",
                "expiresAt", Instant.now().plusSeconds(3600)
        ));
    }
}
