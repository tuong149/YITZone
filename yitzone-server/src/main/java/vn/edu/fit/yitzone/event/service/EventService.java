package vn.edu.fit.yitzone.event.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;
import vn.edu.fit.yitzone.common.security.ScopeContextHolder;
import vn.edu.fit.yitzone.event.controller.EventController.CreateEventRequest;
import vn.edu.fit.yitzone.event.controller.EventController.EventResponse;
import vn.edu.fit.yitzone.event.controller.EventController.UpdateEventRequest;
import vn.edu.fit.yitzone.event.domain.Event;
import vn.edu.fit.yitzone.event.repository.EventRepository;

import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class EventService {
    private static final int MAX_PAGE_SIZE = 50;
    private static final Set<String> LOCKED_BENEFIT_STATUSES = Set.of("PUBLISHED", "ONGOING", "COMPLETED", "FINALIZED");

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public List<EventResponse> listEvents(int page, int size, Authentication auth) {
        if (size <= 0 || size > MAX_PAGE_SIZE) {
            throw new BusinessException(ErrorCode.INVALID_PAGE_SIZE, HttpStatus.BAD_REQUEST,
                    "Kích thước trang (size) phải nằm trong khoảng 1.." + MAX_PAGE_SIZE);
        }
        PageRequest pageable = PageRequest.of(Math.max(0, page), size, Sort.by(Sort.Direction.DESC, "startTime"));
        boolean isAuthenticated = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal());
        if (!isAuthenticated) {
            return eventRepository.findByVisibility(Event.EventVisibility.PUBLIC_FACULTY, pageable)
                    .getContent().stream().map(EventResponse::fromEntity).toList();
        }
        if (hasStandingCommittee(auth)) {
            return eventRepository.findAll(pageable)
                    .getContent().stream().map(EventResponse::fromEntity).toList();
        }
        String activeScope = ScopeContextHolder.getActiveScopeId();
        if (activeScope == null || activeScope.isBlank() || "FACULTY".equalsIgnoreCase(activeScope)) {
            return eventRepository.findByVisibility(Event.EventVisibility.PUBLIC_FACULTY, pageable)
                    .getContent().stream().map(EventResponse::fromEntity).toList();
        }
        return eventRepository.findVisibleForScope(activeScope, pageable)
                .getContent().stream().map(EventResponse::fromEntity).toList();
    }

    public EventResponse getEvent(String id, Authentication auth) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));
        if (event.getVisibility() == Event.EventVisibility.INTERNAL_CTV) {
            String activeScope = ScopeContextHolder.getActiveScopeId();
            boolean allowed = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())
                    && (hasStandingCommittee(auth) || Objects.equals(activeScope, event.getOrganizerUnitId()));
            if (!allowed) {
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Sự kiện nội bộ (INTERNAL_CTV) chỉ hiển thị cho thành viên thuộc đúng Ban tổ chức");
            }
        }
        return EventResponse.fromEntity(event);
    }

    public EventResponse createEvent(CreateEventRequest request, Authentication auth) {
        Event.EventVisibility visibility = request.visibility() == null ? Event.EventVisibility.PUBLIC_FACULTY : request.visibility();
        List<String> benefits = request.benefitTypes() == null ? List.of() : request.benefitTypes();
        if (visibility == Event.EventVisibility.INTERNAL_CTV && !benefits.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Sự kiện nội bộ Ban/Tổ (INTERNAL_CTV) không được phép gắn điểm quyền lợi cấp Khoa (A16)");
        }

        boolean isInternalOnlyCreator = !hasStandingCommittee(auth)
                && !hasAuthority(auth, "event:create")
                && hasAuthority(auth, "internal_event:create");
        if (isInternalOnlyCreator && (visibility != Event.EventVisibility.INTERNAL_CTV || !benefits.isEmpty())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                    "Quyền internal_event:create chỉ được phép tạo sự kiện INTERNAL_CTV không gắn điểm quyền lợi");
        }

        String activeScope = ScopeContextHolder.getActiveScopeId();
        String organizerUnitId = request.organizerUnitId();
        if (organizerUnitId == null || organizerUnitId.isBlank()) {
            organizerUnitId = (activeScope == null || activeScope.isBlank()) ? "FACULTY" : activeScope;
        } else if (!hasStandingCommittee(auth)) {
            Set<String> allowedScopes = ScopeContextHolder.getAllowedScopes();
            boolean matchesActive = Objects.equals(activeScope, organizerUnitId);
            boolean matchesAllowed = allowedScopes.contains(organizerUnitId);
            if (!matchesActive && !matchesAllowed) {
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Không được phép tạo sự kiện dưới danh nghĩa đơn vị khác ('" + organizerUnitId + "')");
            }
        }

        Event event = new Event();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setVisibility(visibility);
        event.setOrganizerUnitId(organizerUnitId);
        event.setBenefitTypes(benefits);
        event.setStartTime(request.startTime());
        event.setEndTime(request.endTime());
        return EventResponse.fromEntity(eventRepository.save(event));
    }

    public EventResponse updateEvent(String id, UpdateEventRequest request, Long ifMatchVersion, Authentication auth) {
        Event existing = eventRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, "Không tìm thấy sự kiện"));

        Long clientVersion = ifMatchVersion != null ? ifMatchVersion : request.version();
        if (clientVersion == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                    "Bắt buộc cung cấp version (trong body hoặc header If-Match) để chống ghi đè dữ liệu (Optimistic Lock)");
        }
        if (existing.getVersion() != null && !Objects.equals(clientVersion, existing.getVersion())) {
            throw new BusinessException(ErrorCode.OPTIMISTIC_LOCK_CONFLICT, HttpStatus.CONFLICT,
                    "Sự kiện đã được cập nhật bởi cán bộ khác (version mismatch)");
        }

        if (!hasStandingCommittee(auth) && existing.getOrganizerUnitId() != null) {
            String activeScope = ScopeContextHolder.getActiveScopeId();
            Set<String> allowedScopes = ScopeContextHolder.getAllowedScopes();
            if (!Objects.equals(activeScope, existing.getOrganizerUnitId())
                    && !allowedScopes.contains(existing.getOrganizerUnitId())) {
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Không có quyền chỉnh sửa sự kiện của đơn vị khác");
            }
        }

        boolean isLockedStatus = LOCKED_BENEFIT_STATUSES.contains(existing.getStatus());
        // ISS-08: Prevent changing benefitTypes or visibility once PUBLISHED/ONGOING/COMPLETED/FINALIZED without BTV re-approval
        if (request.benefitTypes() != null && !Objects.equals(existing.getBenefitTypes(), request.benefitTypes())) {
            if (isLockedStatus) {
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Không được phép tự ý thay đổi quyền lợi (ĐRL/CTXH/CĐDN) của sự kiện đã phê duyệt phát hành");
            }
            Event.EventVisibility targetVisibility = request.visibility() != null ? request.visibility() : existing.getVisibility();
            if (targetVisibility == Event.EventVisibility.INTERNAL_CTV && !request.benefitTypes().isEmpty()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Sự kiện nội bộ Ban/Tổ (INTERNAL_CTV) không được phép gắn điểm quyền lợi cấp Khoa (A16)");
            }
            existing.setBenefitTypes(request.benefitTypes());
        }

        if (request.visibility() != null && request.visibility() != existing.getVisibility()) {
            if (isLockedStatus) {
                throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN,
                        "Không được phép thay đổi phạm vi hiển thị (visibility) của sự kiện đã phê duyệt phát hành");
            }
            if (request.visibility() == Event.EventVisibility.INTERNAL_CTV
                    && existing.getBenefitTypes() != null && !existing.getBenefitTypes().isEmpty()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, HttpStatus.BAD_REQUEST,
                        "Sự kiện nội bộ Ban/Tổ (INTERNAL_CTV) không được phép gắn điểm quyền lợi cấp Khoa (A16)");
            }
            existing.setVisibility(request.visibility());
        }

        existing.setTitle(request.title());
        existing.setDescription(request.description());
        existing.setStartTime(request.startTime());
        existing.setEndTime(request.endTime());
        return EventResponse.fromEntity(eventRepository.save(existing));
    }

    private boolean hasStandingCommittee(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_STANDING_COMMITTEE".equals(a.getAuthority()));
    }

    private boolean hasAuthority(Authentication auth, String authority) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> authority.equals(a.getAuthority()));
    }
}