package vn.edu.fit.yitzone.common.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex, HttpServletRequest request) {
        return ResponseEntity.status(ex.getStatus())
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(ApiResponse.problem(
                        ex.getErrorCode(),
                        ex.getStatus().value(),
                        ex.getErrorCode().name(),
                        ex.getMessage(),
                        request.getRequestURI(),
                        null
                ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiResponse.FieldErrorDetail> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> new ApiResponse.FieldErrorDetail(err.getField(), err.getCode(), err.getDefaultMessage()))
                .toList();
        String details = fieldErrors.stream()
                .map(err -> err.field() + ": " + err.message())
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(ApiResponse.problem(
                        ErrorCode.BAD_REQUEST,
                        HttpStatus.BAD_REQUEST.value(),
                        "Dữ liệu đầu vào không hợp lệ",
                        details,
                        request.getRequestURI(),
                        fieldErrors
                ));
    }

    @ExceptionHandler({
            MissingRequestHeaderException.class,
            MissingServletRequestParameterException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            HandlerMethodValidationException.class
    })
    public ResponseEntity<ApiResponse<Void>> handleBadClientInput(Exception ex, HttpServletRequest request) {
        return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(ApiResponse.problem(
                        ErrorCode.BAD_REQUEST,
                        HttpStatus.BAD_REQUEST.value(),
                        "Yêu cầu HTTP không hợp lệ (Bad Request)",
                        ex.getMessage(),
                        request.getRequestURI(),
                        null
                ));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(ApiResponse.problem(
                        ErrorCode.BAD_REQUEST,
                        HttpStatus.METHOD_NOT_ALLOWED.value(),
                        "Phương thức HTTP không được hỗ trợ",
                        ex.getMessage(),
                        request.getRequestURI(),
                        null
                ));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFound(NoResourceFoundException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(ApiResponse.problem(
                        ErrorCode.NOT_FOUND,
                        HttpStatus.NOT_FOUND.value(),
                        "Không tìm thấy đường dẫn API",
                        ex.getMessage(),
                        request.getRequestURI(),
                        null
                ));
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ApiResponse<Void>> handleOptimisticLock(OptimisticLockingFailureException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(ApiResponse.problem(
                        ErrorCode.OPTIMISTIC_LOCK_CONFLICT,
                        HttpStatus.CONFLICT.value(),
                        "Xung đột phiên bản dữ liệu (Optimistic Lock)",
                        "Dữ liệu đã được cập nhật bởi một người dùng khác. Vui lòng tải lại trước khi lưu.",
                        request.getRequestURI(),
                        null
                ));
    }

    @ExceptionHandler({AuthenticationException.class, AuthenticationCredentialsNotFoundException.class})
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(Exception ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(ApiResponse.problem(
                        ErrorCode.UNAUTHORIZED,
                        HttpStatus.UNAUTHORIZED.value(),
                        "Chưa xác thực",
                        ex.getMessage(),
                        request.getRequestURI(),
                        null
                ));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAnonymous = auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal());
        if (isAnonymous) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                    .body(ApiResponse.problem(
                            ErrorCode.UNAUTHORIZED,
                            HttpStatus.UNAUTHORIZED.value(),
                            "Yêu cầu đăng nhập",
                            "Vui lòng đăng nhập để thực hiện thao tác này",
                            request.getRequestURI(),
                            null
                    ));
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(ApiResponse.problem(
                        ErrorCode.FORBIDDEN,
                        HttpStatus.FORBIDDEN.value(),
                        "Truy cập bị từ chối",
                        "Không có quyền thực hiện thao tác này",
                        request.getRequestURI(),
                        null
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled server exception at {}", request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(ApiResponse.problem(
                        ErrorCode.INTERNAL_ERROR,
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "Lỗi hệ thống nội bộ",
                        "Đã xảy ra lỗi không mong muốn, vui lòng thử lại sau.",
                        request.getRequestURI(),
                        null
                ));
    }
}
