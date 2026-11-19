package vn.edu.fit.yitzone.attendance;

import org.junit.jupiter.api.Test;
import vn.edu.fit.yitzone.attendance.domain.EventAttendance.ReviewStatus;
import vn.edu.fit.yitzone.attendance.domain.EventAttendance.RiskSignal;
import vn.edu.fit.yitzone.attendance.service.WeightedRiskScoringService;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class WeightedRiskScoringServiceTest {

    private final WeightedRiskScoringService service = new WeightedRiskScoringService(2);

    @Test
    void zeroSignalsShouldAutoAccept() {
        var result = service.evaluate(List.of(), null);
        assertEquals(0, result.riskScore());
        assertEquals(ReviewStatus.AUTO_ACCEPTED, result.reviewStatus());
    }

    @Test
    void singleWeakSignalShouldAcceptLowRisk() {
        var result = service.evaluate(List.of(RiskSignal.GPS_MODERATE_DRIFT), null);
        assertEquals(1, result.riskScore());
        assertEquals(ReviewStatus.ACCEPTED_LOW_RISK, result.reviewStatus());
    }

    @Test
    void strongSignalShouldRequirePendingReview() {
        var result = service.evaluate(List.of(RiskSignal.DEVICE_TOKEN_COLLISION), null);
        assertEquals(2, result.riskScore());
        assertEquals(ReviewStatus.PENDING_REVIEW, result.reviewStatus());
    }
}
