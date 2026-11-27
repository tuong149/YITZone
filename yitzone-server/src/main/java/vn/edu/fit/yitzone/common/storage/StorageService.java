package vn.edu.fit.yitzone.common.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Shared S3-compatible object storage service (pgsty/silo) for all 20 YITZone modules.
 */
@Service
public class StorageService implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(StorageService.class);
    private static final long MAX_FILE_BYTES = 25L * 1024L * 1024L;

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final ClamAvScannerService clamAvScannerService;
    private final String endpoint;
    private final String publicBucket;
    private final String privateBucket;
    private final long defaultPresignedTtlSeconds;

    public StorageService(
            @Autowired(required = false) S3Client s3Client,
            @Autowired(required = false) S3Presigner s3Presigner,
            ClamAvScannerService clamAvScannerService,
            @Value("${yitzone.storage.endpoint:http://localhost:9000}") String endpoint,
            @Value("${yitzone.storage.public-bucket:yitzone-public}") String publicBucket,
            @Value("${yitzone.storage.private-bucket:yitzone-private}") String privateBucket,
            @Value("${yitzone.storage.presigned-url-ttl-seconds:300}") long defaultPresignedTtlSeconds
    ) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.clamAvScannerService = clamAvScannerService;
        this.endpoint = endpoint.endsWith("/") ? endpoint.substring(0, endpoint.length() - 1) : endpoint;
        this.publicBucket = publicBucket;
        this.privateBucket = privateBucket;
        this.defaultPresignedTtlSeconds = defaultPresignedTtlSeconds;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (s3Client == null) {
            return;
        }
        ensureBucketQuietly(publicBucket);
        ensureBucketQuietly(privateBucket);
    }

    public StoredObject uploadPublic(String keyPrefix, MultipartFile file, Set<String> allowedMimeTypes) {
        return uploadMultipart(publicBucket, true, keyPrefix, file, allowedMimeTypes);
    }

    public StoredObject uploadPrivate(String keyPrefix, MultipartFile file, Set<String> allowedMimeTypes) {
        return uploadMultipart(privateBucket, false, keyPrefix, file, allowedMimeTypes);
    }

    public StoredObject uploadPrivateBytes(String keyPrefix, byte[] bytes, String fileName, String contentType) {
        validatePayload(bytes, contentType, null);
        clamAvScannerService.scanOrThrow(bytes, fileName);
        String objectKey = buildObjectKey(keyPrefix, fileName);
        putObject(privateBucket, objectKey, bytes, contentType);
        return new StoredObject(privateBucket, objectKey, contentType, bytes.length, null, Instant.now());
    }

    public String createPresignedDownloadUrl(String objectKey, Duration ttl) {
        if (s3Presigner == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ S3Presigner chưa sẵn sàng");
        }
        Duration effectiveTtl = ttl == null ? Duration.ofSeconds(defaultPresignedTtlSeconds) : ttl;
        GetObjectRequest getReq = GetObjectRequest.builder()
                .bucket(privateBucket)
                .key(objectKey)
                .build();
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(effectiveTtl)
                .getObjectRequest(getReq)
                .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    public void deleteObject(boolean isPublic, String objectKey) {
        if (s3Client == null || objectKey == null || objectKey.isBlank()) {
            return;
        }
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(isPublic ? publicBucket : privateBucket)
                .key(objectKey)
                .build());
    }

    public String buildObjectKey(String keyPrefix, String originalFileName) {
        String cleanPrefix = (keyPrefix == null ? "uploads" : keyPrefix.trim())
                .replaceAll("[^a-zA-Z0-9/_-]", "")
                .replaceAll("^/+|/+$", "");
        if (cleanPrefix.isEmpty()) {
            cleanPrefix = "uploads";
        }
        String safeName = (originalFileName == null || originalFileName.isBlank() ? "file.bin" : originalFileName.trim())
                .replaceAll("\\.{2,}", ".")
                .replaceAll("[^a-zA-Z0-9._-]", "_")
                .replaceAll("^[._-]+", "")
                .toLowerCase(Locale.ROOT);
        if (safeName.isEmpty()) {
            safeName = "file.bin";
        }
        if (safeName.length() > 80) {
            safeName = safeName.substring(safeName.length() - 80);
        }
        return cleanPrefix + "/" + UUID.randomUUID() + "-" + safeName;
    }

    private StoredObject uploadMultipart(
            String bucket,
            boolean isPublic,
            String keyPrefix,
            MultipartFile file,
            Set<String> allowedMimeTypes
    ) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Tệp tải lên không được để trống");
        }
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType().toLowerCase(Locale.ROOT);
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Không thể đọc nội dung tệp tải lên: " + ex.getMessage());
        }
        validatePayload(bytes, contentType, allowedMimeTypes);
        clamAvScannerService.scanOrThrow(bytes, file.getOriginalFilename());

        String objectKey = buildObjectKey(keyPrefix, file.getOriginalFilename());
        putObject(bucket, objectKey, bytes, contentType);
        String publicUrl = isPublic ? endpoint + "/" + bucket + "/" + objectKey : null;
        return new StoredObject(bucket, objectKey, contentType, bytes.length, publicUrl, Instant.now());
    }

    private void validatePayload(byte[] bytes, String contentType, Set<String> allowedMimeTypes) {
        if (bytes == null || bytes.length == 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST, "Nội dung tệp rỗng");
        }
        if (bytes.length > MAX_FILE_BYTES) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.PAYLOAD_TOO_LARGE,
                    "Kích thước tệp vượt quá giới hạn tối đa 25MB");
        }
        if (allowedMimeTypes != null && !allowedMimeTypes.isEmpty()) {
            String normalized = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
            if (!allowedMimeTypes.contains(normalized)) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        "Định dạng tệp '" + normalized + "' không được phép tải lên");
            }
        }
    }

    private void putObject(String bucket, String objectKey, byte[] bytes, String contentType) {
        if (s3Client == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ lưu trữ đối tượng (S3/Silo) chưa được khởi tạo");
        }
        s3Client.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(objectKey)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(bytes)
        );
    }

    private void ensureBucketQuietly(String bucket) {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
        } catch (NoSuchBucketException ex) {
            try {
                s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
                log.info("Created object storage bucket '{}'", bucket);
            } catch (Exception createEx) {
                log.warn("Unable to create bucket '{}': {}", bucket, createEx.getMessage());
            }
        } catch (Exception ex) {
            log.warn("Object storage unavailable on startup for bucket '{}': {}", bucket, ex.getMessage());
        }
    }

    public record StoredObject(
            String bucket,
            String objectKey,
            String contentType,
            long sizeBytes,
            String publicUrl,
            Instant uploadedAt
    ) {
    }
}
