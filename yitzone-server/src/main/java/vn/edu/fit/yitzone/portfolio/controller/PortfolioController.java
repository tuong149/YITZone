package vn.edu.fit.yitzone.portfolio.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/portfolio")
public class PortfolioController {
    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> getMyPortfolio() {
        return ApiResponse.ok(Map.of("sv5tProgress", 0, "verifiedActivities", 0));
    }

    @PostMapping("/me/export-cv")
    public ApiResponse<Map<String, Object>> exportVerifiedCvPdf() {
        return ApiResponse.ok(Map.of(
                "status", "CACHED_OR_GENERATED",
                "presignedPdfUrl", "https://silo.yitzone.edu.vn/portfolios/cv_verified.pdf"
        ));
    }

    @GetMapping("/verify/{verificationToken}")
    public ApiResponse<Map<String, Object>> verifyPortfolioToken(@PathVariable String verificationToken) {
        return ApiResponse.ok(Map.of(
                "verificationToken", verificationToken,
                "valid", true,
                "verifiedCertificates", List.of()
        ));
    }
}
