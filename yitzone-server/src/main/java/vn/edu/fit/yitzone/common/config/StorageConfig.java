package vn.edu.fit.yitzone.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * S3-compatible object storage configuration for pgsty/silo (HLD 6.1).
 */
@Configuration
public class StorageConfig {

    @Bean
    public S3Client s3Client(
            @Value("${yitzone.storage.endpoint:http://localhost:9000}") String endpoint,
            @Value("${yitzone.storage.access-key:yitzone_dev_key}") String accessKey,
            @Value("${yitzone.storage.secret-key:yitzone_dev_secret}") String secretKey
    ) {
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    @Bean
    public S3Presigner s3Presigner(
            @Value("${yitzone.storage.endpoint:http://localhost:9000}") String endpoint,
            @Value("${yitzone.storage.access-key:yitzone_dev_key}") String accessKey,
            @Value("${yitzone.storage.secret-key:yitzone_dev_secret}") String secretKey
    ) {
        return S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }
}
