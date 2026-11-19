package vn.edu.fit.yitzone.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.slf4j.MDC;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        String type,
        String title,
        Integer status,
        String detail,
        String instance,
        String errorCode,
        String message,
        String traceId,
        List<FieldErrorDetail> fieldErrors,
        Instant timestamp
) {
    public record FieldErrorDetail(String field, String code, String message) {}

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, null, null, null, null, null, null, null, Instant.now());
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, null, null, null, null, null, null, message, null, null, Instant.now());
    }

    public static ApiResponse<Void> error(ErrorCode code, String message) {
        return problem(code, 400, code.name(), message, null, null);
    }

    public static ApiResponse<Void> problem(
            ErrorCode code,
            int status,
            String title,
            String detail,
            String instance,
            List<FieldErrorDetail> fieldErrors
    ) {
        String slug = code.name().toLowerCase().replace('_', '-');
        String currentTraceId = MDC.get("traceId");
        if (currentTraceId == null || currentTraceId.isBlank()) {
            currentTraceId = UUID.randomUUID().toString().replace("-", "");
            MDC.put("traceId", currentTraceId);
        }
        return new ApiResponse<>(
                false,
                null,
                "https://yitzone.edu.vn/errors/" + slug,
                title,
                status,
                detail,
                instance,
                code.name(),
                null,
                currentTraceId,
                fieldErrors,
                Instant.now()
        );
    }
}
