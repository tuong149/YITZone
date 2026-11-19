package vn.edu.fit.yitzone.attendance.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.attendance.domain.EventAttendance.ReviewStatus;
import vn.edu.fit.yitzone.attendance.domain.EventAttendance.RiskSignal;

import java.util.Collection;

/**
 * Weighted anti-fraud risk scoring engine (FR-ATT-08, LLD 5.1.A).
 */
@Service
public class WeightedRiskScoringService {
    private final int defaultThreshold;

    public WeightedRiskScoringService(@Value("${yitzone.attendance.risk-review-threshold:2}") int defaultThreshold) {
        this.defaultThreshold = defaultThreshold;
    }

    public RiskAssessment evaluate(Collection<RiskSignal> signals, Integer customThreshold) {
        int threshold = customThreshold == null ? defaultThreshold : customThreshold;
        int totalScore = signals == null ? 0 : signals.stream()
                .distinct()
                .mapToInt(RiskSignal::getWeight)
                .sum();

        ReviewStatus status;
        if (totalScore == 0) {
            status = ReviewStatus.AUTO_ACCEPTED;
        } else if (totalScore < threshold) {
            status = ReviewStatus.ACCEPTED_LOW_RISK;
        } else {
            status = ReviewStatus.PENDING_REVIEW;
        }
        return new RiskAssessment(totalScore, status);
    }

    public record RiskAssessment(int riskScore, ReviewStatus reviewStatus) {}
}
