package vn.edu.fit.yitzone.liveqa.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/live-qa")
public class LiveQaController {
    @GetMapping("/sessions")
    public ApiResponse<List<Object>> listSessions() {
        return ApiResponse.ok(List.of());
    }
}
