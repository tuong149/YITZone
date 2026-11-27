package vn.edu.fit.yitzone.common.storage;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import vn.edu.fit.yitzone.common.exception.BusinessException;

import java.lang.reflect.Proxy;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StorageServiceTest {

    private S3Client stubS3Client(List<PutObjectRequest> capturedRequests) {
        return (S3Client) Proxy.newProxyInstance(
                S3Client.class.getClassLoader(),
                new Class<?>[]{S3Client.class},
                (proxy, method, args) -> {
                    if ("putObject".equals(method.getName()) && args != null && args.length > 0 && args[0] instanceof PutObjectRequest req) {
                        capturedRequests.add(req);
                        return PutObjectResponse.builder().build();
                    }
                    if ("serviceName".equals(method.getName())) {
                        return "s3";
                    }
                    return null;
                }
        );
    }

    @Test
    void uploadPublicRejectsDisallowedMimeType() {
        List<PutObjectRequest> captured = new ArrayList<>();
        S3Client s3 = stubS3Client(captured);
        ClamAvScannerService clam = new ClamAvScannerService(false, "localhost", 3310);
        StorageService service = new StorageService(s3, null, clam, "http://localhost:9000", "yitzone-public", "yitzone-private", 300);

        MockMultipartFile exe = new MockMultipartFile("file", "bad.exe", "application/x-msdownload", "MZ".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> service.uploadPublic("events/covers", exe, Set.of("image/jpeg", "image/png")))
                .isInstanceOf(BusinessException.class)
                .satisfies(ex -> assertThat(((BusinessException) ex).getStatus()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE));
        assertThat(captured).isEmpty();
    }

    @Test
    void uploadPublicSanitizesKeyAndUploadsToS3() {
        List<PutObjectRequest> captured = new ArrayList<>();
        S3Client s3 = stubS3Client(captured);
        ClamAvScannerService clam = new ClamAvScannerService(false, "localhost", 3310);
        StorageService service = new StorageService(s3, null, clam, "http://localhost:9000", "yitzone-public", "yitzone-private", 300);

        MockMultipartFile img = new MockMultipartFile("file", "../Poster Sự Kiện 2026.png", "image/png", new byte[]{1, 2, 3, 4});
        StorageService.StoredObject stored = service.uploadPublic("events/covers", img, Set.of("image/png"));

        assertThat(stored.bucket()).isEqualTo("yitzone-public");
        assertThat(stored.objectKey()).startsWith("events/covers/").endsWith(".png").doesNotContain("..");
        assertThat(stored.publicUrl()).startsWith("http://localhost:9000/yitzone-public/events/covers/");
        assertThat(captured).hasSize(1);
        assertThat(captured.get(0).bucket()).isEqualTo("yitzone-public");
        assertThat(captured.get(0).key()).isEqualTo(stored.objectKey());
    }
}
