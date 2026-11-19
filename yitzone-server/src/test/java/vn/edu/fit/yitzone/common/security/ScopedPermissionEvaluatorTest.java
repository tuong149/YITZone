package vn.edu.fit.yitzone.common.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ScopedPermissionEvaluatorTest {

    private final ScopedPermissionEvaluator evaluator = new ScopedPermissionEvaluator();

    @AfterEach
    void tearDown() {
        ScopeContextHolder.clear();
    }

    @Test
    void hasPermissionCombinesDomainAndActionAuthorityCorrectly() {
        var eventCreatorAuth = new UsernamePasswordAuthenticationToken(
                "user-1",
                null,
                List.of(new SimpleGrantedAuthority("event:create"))
        );
        var genericActionAuth = new UsernamePasswordAuthenticationToken(
                "user-2",
                null,
                List.of(new SimpleGrantedAuthority("create"))
        );

        assertTrue(evaluator.hasPermission(eventCreatorAuth, "event", "create"));
        assertFalse(evaluator.hasPermission(eventCreatorAuth, "certificate", "manage"));
        assertFalse(evaluator.hasPermission(genericActionAuth, "event", "create"));
    }

    @Test
    void hasPermissionEvaluatesRuntimeGrantsFromScopeContextHolder() {
        Instant now = Instant.now();
        var auth = new UsernamePasswordAuthenticationToken("user-ctv", null, List.of());
        ScopeContextHolder.setActiveScopeId("EMFIT");
        ScopeContextHolder.setEffectiveGrants(List.of(
                new EffectiveGrant("event:create", "COMMITTEE", "EMFIT", now.plusSeconds(3600))
        ));

        assertTrue(evaluator.hasPermission(auth, "event", "create"));

        ScopeContextHolder.setActiveScopeId("OFIT");
        assertFalse(evaluator.hasPermission(auth, "event", "create"));
    }

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
