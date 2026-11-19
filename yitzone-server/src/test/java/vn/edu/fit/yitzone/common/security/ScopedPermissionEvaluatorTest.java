package vn.edu.fit.yitzone.common.security;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScopedPermissionEvaluatorTest {

    private final ScopedPermissionEvaluator evaluator = new ScopedPermissionEvaluator();

    @Test
    void expiredGrantMustBeRejectedImmediately() {
        Instant now = Instant.now();
        var expired = new EffectiveGrant("event:create", "COMMITTEE", "EMFIT", now.minusSeconds(1));

        assertFalse(evaluator.evaluateGrants(List.of(expired), "event:create", "EMFIT", List.of(), false, now));
    }

    @Test
    void internalEventPermissionMustRejectFacultyEventWithBenefits() {
        Instant now = Instant.now();
        var grant = new EffectiveGrant("internal_event:host_attendance", "COMMITTEE", "EMFIT", now.plusSeconds(3600));

        assertFalse(evaluator.evaluateGrants(List.of(grant), "internal_event:host_attendance", "EMFIT", List.of(), false, now));
        assertTrue(evaluator.evaluateGrants(List.of(grant), "internal_event:host_attendance", "EMFIT", List.of(), true, now));
    }

    @Test
    void committeeGrantInheritsDownToChildTeamViaAncestors() {
        Instant now = Instant.now();
        var grant = new EffectiveGrant("unit_hr:view", "COMMITTEE", "EMFIT", null);

        assertTrue(evaluator.evaluateGrants(List.of(grant), "unit_hr:view", "TEAM_MEDIA", List.of("FACULTY", "EMFIT"), false, now));
    }
}
