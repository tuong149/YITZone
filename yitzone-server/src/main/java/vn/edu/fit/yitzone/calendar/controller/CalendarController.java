package vn.edu.fit.yitzone.calendar.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/calendar")
public class CalendarController {
    @GetMapping("/feed")
    public ApiResponse<List<Object>> getAggregatedCalendar() {
        return ApiResponse.ok(List.of());
    }
}
