package vn.edu.fit.yitzone.oj.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.util.List;

/**
 * Online Judge module (P3 - Isolated Judge0 CE / DMOJ integration per HLD 3.7).
 */
@RestController
@RequestMapping("/api/v1/oj")
public class OjController {
    @GetMapping("/problems")
    public ApiResponse<List<Object>> listProblems() {
        return ApiResponse.ok(List.of());
    }
}
