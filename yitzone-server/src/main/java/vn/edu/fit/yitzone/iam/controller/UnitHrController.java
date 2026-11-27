package vn.edu.fit.yitzone.iam.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.iam.domain.HrProposal;
import vn.edu.fit.yitzone.iam.domain.User;
import vn.edu.fit.yitzone.iam.service.CtvLifecycleService;
import vn.edu.fit.yitzone.iam.service.UnitHrService;

import java.util.List;

/**
 * Isolated 3-tier unit HR management, unit announcements, and CTV lifecycle endpoints (UC-IAM-07, UC-IAM-08).
 */
@RestController
@RequestMapping("/api/v1/iam/units")
public class UnitHrController {
    private final UnitHrService unitHrService;
    private final CtvLifecycleService ctvLifecycleService;

    public UnitHrController(UnitHrService unitHrService, CtvLifecycleService ctvLifecycleService) {
        this.unitHrService = unitHrService;
        this.ctvLifecycleService = ctvLifecycleService;
    }

    @GetMapping("/{unitId}/members")
    public ApiResponse<List<UnitHrService.UnitMemberView>> listUnitMembers(
            @PathVariable String unitId,
            Authentication auth
    ) {
        return ApiResponse.ok(unitHrService.listUnitMembers(unitId, auth.getName()));
    }

    @PostMapping("/{unitId}/members/execute")
    public ApiResponse<UnitHrService.UnitMemberView> executeDirectHrAction(
            @PathVariable String unitId,
            @Valid @RequestBody DirectHrActionBody body,
            Authentication auth
    ) {
        return ApiResponse.ok(unitHrService.executeDirectAction(
                unitId,
                new UnitHrService.DirectHrActionRequest(
                        body.targetIdentifier(),
                        body.actionType(),
                        body.targetTransferUnitId(),
                        body.targetMemberStatus(),
                        body.reason()
                ),
                auth.getName()
        ));
    }

    @GetMapping("/{unitId}/hr-proposals")
    public ApiResponse<List<UnitHrService.HrProposalView>> listProposals(
            @PathVariable String unitId,
            @RequestParam(required = false) HrProposal.ProposalStatus status,
            Authentication auth
    ) {
        return ApiResponse.ok(unitHrService.listProposals(unitId, status, auth.getName()));
    }

    @PostMapping("/{unitId}/hr-proposals")
    public ApiResponse<UnitHrService.HrProposalView> createProposal(
            @PathVariable String unitId,
            @Valid @RequestBody CreateProposalBody body,
            Authentication auth
    ) {
        return ApiResponse.ok(unitHrService.createProposal(
                unitId,
                new UnitHrService.CreateProposalRequest(
                        body.targetIdentifier(),
                        body.proposalType(),
                        body.targetTransferUnitId(),
                        body.targetMemberStatus(),
                        body.reason()
                ),
                auth.getName()
        ));
    }

    @PostMapping("/{unitId}/hr-proposals/{proposalId}/review")
    public ApiResponse<UnitHrService.HrProposalView> reviewProposal(
            @PathVariable String unitId,
            @PathVariable String proposalId,
            @RequestBody ReviewProposalBody body,
            Authentication auth
    ) {
        return ApiResponse.ok(unitHrService.reviewProposal(
                unitId,
                proposalId,
                body.approved(),
                body.reviewNote(),
                auth.getName()
        ));
    }

    @PostMapping("/{unitId}/announcements")
    public ApiResponse<UnitHrService.AnnouncementResult> sendAnnouncement(
            @PathVariable String unitId,
            @Valid @RequestBody UnitAnnouncementBody body,
            Authentication auth
    ) {
        return ApiResponse.ok(unitHrService.sendUnitAnnouncement(unitId, body.title(), body.content(), auth.getName()));
    }

    @PostMapping("/{unitId}/members/{userId}/status")
    public ApiResponse<CtvLifecycleService.StatusTransitionResult> changeCtvStatus(
            @PathVariable String unitId,
            @PathVariable String userId,
            @Valid @RequestBody ChangeCtvStatusBody body,
            Authentication auth
    ) {
        return ApiResponse.ok(ctvLifecycleService.changeCtvStatus(
                unitId,
                userId,
                body.targetStatus(),
                body.handoverAssigneeUserId(),
                body.reason(),
                auth.getName()
        ));
    }

    public record CreateProposalBody(
            @NotBlank String targetIdentifier,
            @NotNull HrProposal.ProposalType proposalType,
            String targetTransferUnitId,
            User.MemberStatus targetMemberStatus,
            String reason
    ) {
    }

    public record DirectHrActionBody(
            @NotBlank String targetIdentifier,
            @NotNull HrProposal.ProposalType actionType,
            String targetTransferUnitId,
            User.MemberStatus targetMemberStatus,
            String reason
    ) {
    }

    public record ReviewProposalBody(boolean approved, String reviewNote) {
    }

    public record UnitAnnouncementBody(String title, @NotBlank String content) {
    }

    public record ChangeCtvStatusBody(
            @NotNull User.MemberStatus targetStatus,
            String handoverAssigneeUserId,
            String reason
    ) {
    }
}

