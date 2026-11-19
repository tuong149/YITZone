package vn.edu.fit.yitzone.event.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.fit.yitzone.common.api.ApiResponse;
import vn.edu.fit.yitzone.event.domain.Event;
import vn.edu.fit.yitzone.event.service.EventService;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
public class EventController {
    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ApiResponse<List<EventResponse>> listEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth
    ) {
        return ApiResponse.ok(eventService.listEvents(page, size, auth));
    }

    @GetMapping("/{id}")
    public ApiResponse<EventResponse> getEvent(@PathVariable String id, Authentication auth) {
        return ApiResponse.ok(eventService.getEvent(id, auth));
    }

    @PostMapping
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('event', 'create') or hasPermission('internal_event', 'create')")
    public ApiResponse<EventResponse> createEvent(
            @Valid @RequestBody CreateEventRequest request,
            Authentication auth
    ) {
        return ApiResponse.ok(eventService.createEvent(request, auth));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STANDING_COMMITTEE') or hasPermission('event', 'update') or hasPermission('internal_event', 'update')")
    public ApiResponse<EventResponse> updateEvent(
            @PathVariable String id,
            @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatchHeader,
            @Valid @RequestBody UpdateEventRequest request,
            Authentication auth
    ) {
        Long ifMatchVersion = parseIfMatchVersion(ifMatchHeader);
        return ApiResponse.ok(eventService.updateEvent(id, request, ifMatchVersion, auth));
    }

    private Long parseIfMatchVersion(String ifMatchHeader) {
        if (ifMatchHeader == null || ifMatchHeader.isBlank()) {
            return null;
        }
        String cleaned = ifMatchHeader.trim().replace("\"", "");
        try {
            return Long.parseLong(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public record EventResponse(
            String id,
            String title,
            String description,
            Event.EventVisibility visibility,
            String organizerUnitId,
            List<String> benefitTypes,
            Instant startTime,
            Instant endTime,
            String status,
            Long version
    ) {
        public static EventResponse fromEntity(Event event) {
            return new EventResponse(
                    event.getId(),
                    event.getTitle(),
                    event.getDescription(),
                    event.getVisibility(),
                    event.getOrganizerUnitId(),
                    event.getBenefitTypes() == null ? List.of() : List.copyOf(event.getBenefitTypes()),
                    event.getStartTime(),
                    event.getEndTime(),
                    event.getStatus(),
                    event.getVersion()
            );
        }
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
            Event.EventVisibility visibility,
            List<String> benefitTypes,
            Instant startTime,
            Instant endTime,
            Long version
    ) {}
}
