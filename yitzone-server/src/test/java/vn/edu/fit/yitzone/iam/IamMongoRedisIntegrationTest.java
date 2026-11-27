package vn.edu.fit.yitzone.iam;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import vn.edu.fit.yitzone.audit.domain.AuditLog;
import vn.edu.fit.yitzone.audit.service.AuditLogService;
import vn.edu.fit.yitzone.common.AbstractIntegrationTest;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.iam.repository.OrgUnitRepository;
import vn.edu.fit.yitzone.iam.repository.PermissionModuleRepository;
import vn.edu.fit.yitzone.iam.repository.RoleRepository;
import vn.edu.fit.yitzone.iam.service.RbacCacheInvalidationService;
import vn.edu.fit.yitzone.iam.service.RefreshTokenService;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Real MongoDB 8.0 Replica Set + Redis 7.4 integration test for Subsystem 4.1.
 * Automatically skipped when Docker daemon is unavailable (disabledWithoutDocker = true).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class IamMongoRedisIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private OrgUnitRepository orgUnitRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionModuleRepository permissionModuleRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private RbacCacheInvalidationService rbacCacheInvalidationService;

    @Test
    @DisplayName("TC-IAM-INT-01: MongoDB bootstrap seeders, atomic AuditLog hash-chain, and Redis token/RBAC invalidation work end-to-end")
    void verifiesMongoBootstrapAuditChainAndRedisSessionInvalidation() {
        // 1. Seeded catalog in real MongoDB
        assertThat(orgUnitRepository.count()).isGreaterThanOrEqualTo(16L);
        assertThat(roleRepository.count()).isGreaterThanOrEqualTo(8L);
        assertThat(permissionModuleRepository.count()).isGreaterThanOrEqualTo(20L);

        // 2. Atomic hash-chain AuditLog in real MongoDB
        AuditLog log1 = auditLogService.record(
                "u-btv", "btv@hcmute.edu.vn", "IAM_TEST_1", "USER", "u-1",
                List.of(new AuditLog.ChangedField("status", "OLD", "NEW")),
                "Testcontainers chain 1", "127.0.0.1", "JUnit"
        );
        AuditLog log2 = auditLogService.record(
                "u-btv", "btv@hcmute.edu.vn", "IAM_TEST_2", "USER", "u-1",
                List.of(new AuditLog.ChangedField("status", "NEW", "DONE")),
                "Testcontainers chain 2", "127.0.0.1", "JUnit"
        );
        assertThat(log2.getSeq()).isEqualTo(log1.getSeq() + 1L);
        assertThat(log2.getPrevHash()).isEqualTo(log1.getCurrentHash());

        // 3. Redis RefreshToken rotation & bulk revocation
        var issued = refreshTokenService.issueRefreshToken("u-redis-1", 1L, true);
        assertThat(issued.ttlSeconds()).isEqualTo(1800L);
        var rotated = refreshTokenService.rotateRefreshToken(issued.rawToken(), 1L);
        assertThat(rotated.userId()).isEqualTo("u-redis-1");
        refreshTokenService.revokeAllUserTokens("u-redis-1", 2L);
        assertThatThrownBy(() -> refreshTokenService.rotateRefreshToken(rotated.nextToken().rawToken(), 2L))
                .isInstanceOf(BusinessException.class);

        // 4. Redis RBAC permissionVersion invalidation (<= 5s Edge 30)
        rbacCacheInvalidationService.invalidateUserPermissions("u-redis-1", 2L);
        assertThat(rbacCacheInvalidationService.isTokenVersionValid("u-redis-1", 1L)).isFalse();
        assertThat(rbacCacheInvalidationService.isTokenVersionValid("u-redis-1", 2L)).isTrue();
    }
}
