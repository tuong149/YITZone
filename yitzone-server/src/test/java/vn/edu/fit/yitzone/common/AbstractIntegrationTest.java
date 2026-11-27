package vn.edu.fit.yitzone.common;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Shared Testcontainers base class (MongoDB 8.0 Replica Set + Redis 7.4) for integration tests.
 * Uses disabledWithoutDocker = true so standard unit builds without Docker daemon remain green.
 */
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    @Container
    static final MongoDBContainer MONGODB = new MongoDBContainer("mongo:8.0.4");

    @Container
    @SuppressWarnings("resource")
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7.4.2-alpine")
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void registerContainerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", MONGODB::getReplicaSetUrl);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }
}
