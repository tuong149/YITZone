package vn.edu.fit.yitzone.event.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.common.security.ScopeContextHolder;
import vn.edu.fit.yitzone.event.domain.Event;
import vn.edu.fit.yitzone.event.repository.EventRepository;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {
    private static final int MAX_PAGE_SIZE = 50;
    private static final Set<String> LOCKED_BENEFIT_STATUSES = Set.of("PUBLISHED", "ONGOING", "COMPLETED", "FINALIZED");

    private final EventRepository eventRepository;

    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    @GetMapping
    public ApiResponse<List<Event>> listEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth
    ) {
        if (size <= 0 || size > MAX_PAGE_SIZE) {
            throw new BusinessException(ErrorCode.INVALID_PAGE_SIZE, HttpStatus.BAD_REQUEST,
                    "Kích thước trang (size) phải nằm trong khoảng 1.." + MAX_PAGE_SIZE);
        }
        PageRequest pageable = PageRequest.of(Math.max(0, page), size, Sort.by(Sort.Direction.DESC, "startTime"));
        // Guests / unauthenticated requests only see PUBLIC_FACULTY events (prevents leaking INTERNAL_CTV events)
        if (auth == null || !auth.isAuthenticated()) {
            return ApiResponse.ok(eventRepository.findByVisibility(Event.EventVisibility.PUBLIC_FACULTY, pageable).getContent());
        }
        String activeScope = ScopeContextHolder.getActiveScopeId();
        List<Event> visible = eventRepository.findAll(pageable).getContent().stream()
                .filter(e -> e.getVisibility() == Event.EventVisibility.PUBLIC_FACULTY
                        || (activeScope != null && activeScope.equals(e.getOrganizerUnitId()))
                        || hasStandingCommittee(auth))
                .toList();
        return ApiResponse.ok(visible);
    }

    @GetMapping("/{id}")
    public ApiResponse<Event> getEvent(@PathVariable String id, Authentication auth) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));
        if (event.getVisibility() == Event.EventVisibility.INTERNAL_CTV) {
            String activeScope = ScopeContextHolder.getActiveScopeId();
            boolean allowed = auth != null && auth.isAuthenticated()
                    && (hasStandingCommittee(auth) || Objects.equals(activeScope, event.getOrganizerUnitId()));
            if (!allowed) {
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Sự kiện nội bộ (INTERNAL_CTV) chỉ hiển thị cho thành viên thuộc đúng Ban tổ chức");
            }
        }
        return ApiResponse.ok(event);
    }

    @PostMapping
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('event', 'create') or hasPermission('internal_event', 'create')")
    public ApiResponse<Event> createEvent(@Valid @RequestBody CreateEventRequest request) {
        Event.EventVisibility visibility = request.visibility() == null ? Event.EventVisibility.PUBLIC_FACULTY : request.visibility();
        List<String> benefits = request.benefitTypes() == null ? List.of() : request.benefitTypes();
        if (visibility == Event.EventVisibility.INTERNAL_CTV && !benefits.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Sự kiện nội bộ Ban/Tổ (INTERNAL_CTV) không được phép gắn điểm quyền lợi cấp Khoa (A16)");
        }
        Event event = new Event();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setVisibility(visibility);
        event.setOrganizerUnitId(request.organizerUnitId());
        event.setBenefitTypes(benefits);
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        return ApiResponse.ok(eventRepository.save(event));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('event', 'update') or hasPermission('internal_event', 'update')")
    public ApiResponse<Event> updateEvent(
            @PathVariable String id,
            @Valid @RequestBody UpdateEventRequest request
    ) {
        Event existing = eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));

        if (request.version() != null && existing.getVersion() != null && !Objects.equals(request.version(), existing.getVersion())) {
            throw new BusinessException(ErrorCode.OPTIMISTIC_LOCK_CONFLICT, HttpStatus.CONFLICT,
                    "Sự kiện đã được cập nhật bởi cán bộ khác (version mismatch)");
        }

        // ISS-08: Prevent changing benefitTypes once PUBLISHED/ONGOING/COMPLETED/FINALIZED without BTV re-approval
        if (LOCKED_BENEFIT_STATUSES.contains(existing.getStatus())
                && request.benefitTypes() != null
                && !Objects.equals(existing.getBenefitTypes(), request.benefitTypes())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Không được phép tự ý thay đổi quyền lợi (ĐRL/CTXH/CĐDN) của sự kiện đã phê duyệt phát hành");
        }

        existing.setTitle(request.title());
        existing.setDescription(request.description());
        existing.setStartTime(request.startTime());
        existing.setEndTime(request.endTime());
        return ApiResponse.ok(eventRepository.save(existing));
    }

    private boolean hasStandingCommittee(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STANDING_COMMITTEE".equals(a.getAuthority()));
    }

    public record CreateEventRequest(
            @NotBlank String title,
            String description,
            Event.EventVisibility visibility,
            String organizerUnitId,
            List<String> benefitTypes,
            Instant startTime,
            Instant endTime
    ) {}

    public record UpdateEventRequest(
            @NotBlank String title,
            String description,
            List<String> benefitTypes,
            Instant startTime,
            Instant endTime,
            Long version
    ) {}
}
