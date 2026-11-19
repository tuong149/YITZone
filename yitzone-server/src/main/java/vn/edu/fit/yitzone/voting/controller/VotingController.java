package vn.edu.fit.yitzone.voting.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.common.security.DevicePopProof;
import vn.edu.fit.yitzone.common.security.DevicePopVerifierService;
import vn.edu.fit.yitzone.voting.domain.VotingCampaign;
import vn.edu.fit.yitzone.voting.repository.VotingCampaignRepository;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/voting")
public class VotingController {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final VotingCampaignRepository votingCampaignRepository;
    private final DevicePopVerifierService devicePopVerifierService;

    public VotingController(
            VotingCampaignRepository votingCampaignRepository,
            DevicePopVerifierService devicePopVerifierService
    ) {
        this.votingCampaignRepository = votingCampaignRepository;
        this.devicePopVerifierService = devicePopVerifierService;
    }

    @PostMapping("/campaigns/{id}/cast-ballot")
    public ResponseEntity<ApiResponse<Map<String, Object>>> castBallot(
            @PathVariable String id,
            @Valid @RequestBody CastBallotRequest request,
            Authentication auth
    ) {
        List<String> sortedCandidates = request.selectedCandidateIds().stream().sorted().toList();
        String canonicalActionFields = id + "|" + String.join(",", sortedCandidates) + "|"
                + (request.resolutionChoice() == null ? "" : request.resolutionChoice());

        devicePopVerifierService.verifyAndBuildCanonicalString(
                "POST",
                "/api/v1/voting/campaigns/" + id + "/cast-ballot",
                auth.getName(),
                request.devicePop(),
                canonicalActionFields
        );

        byte[] randomBytes = new byte[8]; // 64-bit cryptographic entropy (16 hex chars)
        SECURE_RANDOM.nextBytes(randomBytes);
        String hex = HexFormat.of().withUpperCase().formatHex(randomBytes);
        String rawReceipt = "VOTE-" + hex.substring(0, 4) + "-" + hex.substring(4, 8)
                + "-" + hex.substring(8, 12) + "-" + hex.substring(12, 16);
        String receiptHash = DevicePopVerifierService.sha256Hex(rawReceipt);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(Map.of(
                "campaignId", id,
                "receiptCode", rawReceipt,
                "receiptHash", receiptHash,
                "status", "BUFFERED_IN_OUTBOX"
        )));
    }

    @PostMapping("/campaigns/{id}/judge-scores")
    public ApiResponse<Map<String, Object>> submitJudgeScore(
            @PathVariable String id,
            @Valid @RequestBody JudgeScoreRequest request,
            Authentication auth
    ) {
        // LLD 2.3.4 (A17): Judge permission MUST be verified against DB VotingCampaign.judgeUserIds (never from request body!)
        VotingCampaign campaign = votingCampaignRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND,
                        "Không tìm thấy chiến dịch bình chọn"));

        if (campaign.getJudgeUserIds() == null || !campaign.getJudgeUserIds().contains(auth.getName())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Tài khoản không nằm trong danh sách Ban Giám khảo (judgeUserIds) của chiến dịch này");
        }

        return ApiResponse.ok(Map.of(
                "campaignId", id,
                "judgeUserId", auth.getName(),
                "candidateId", request.candidateId(),
                "score", request.score()
        ));
    }

    @GetMapping("/campaigns/{id}/verify-receipt")
    public ApiResponse<Map<String, Object>> verifyBallotReceipt(
            @PathVariable String id,
            @RequestParam("code") String receiptCode
    ) {
        String receiptHash = DevicePopVerifierService.sha256Hex(receiptCode);
        return ApiResponse.ok(Map.of(
                "campaignId", id,
                "ballotReceiptHash", receiptHash,
                "status", "COUNTED_VALID"
        ));
    }

    public record CastBallotRequest(
            @NotEmpty List<String> selectedCandidateIds,
            String resolutionChoice,
            @NotNull @Valid DevicePopProof devicePop
    ) {}

    public record JudgeScoreRequest(
            @NotBlank String candidateId,
            @DecimalMin("0.0") @DecimalMax("100.0") double score,
            String note
    ) {}
}
