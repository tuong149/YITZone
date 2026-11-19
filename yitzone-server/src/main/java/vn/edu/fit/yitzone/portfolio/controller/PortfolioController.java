package vn.edu.fit.yitzone.portfolio.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/portfolio")
public class PortfolioController {
    @GetMapping("/me")
    public ApiResponse<PortfolioSummaryResponse> getMyPortfolio() {
        return ApiResponse.ok(new PortfolioSummaryResponse(0, 0));
    }

    @PostMapping("/me/export-cv")
    public ApiResponse<CvExportResponse> exportVerifiedCvPdf() {
        return ApiResponse.ok(new CvExportResponse(
                "CACHED_OR_GENERATED",
                "https://silo.yitzone.edu.vn/portfolios/cv_verified.pdf"
        ));
    }

    @GetMapping("/verify/{verificationToken}")
    public ApiResponse<PortfolioVerificationResponse> verifyPortfolioToken(@PathVariable String verificationToken) {
        return ApiResponse.ok(new PortfolioVerificationResponse(
                verificationToken,
                false,
                List.of()
        ));
    }

    public record PortfolioSummaryResponse(int sv5tProgress, int verifiedActivities) {}
    public record CvExportResponse(String status, String presignedPdfUrl) {}
    public record PortfolioVerificationResponse(
            String verificationToken,
            boolean valid,
            List<Object> verifiedCertificates
    ) {}
}
