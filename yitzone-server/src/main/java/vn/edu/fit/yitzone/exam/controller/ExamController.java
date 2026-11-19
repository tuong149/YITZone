package vn.edu.fit.yitzone.exam.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/exams")
public class ExamController {
    @GetMapping
    public ApiResponse<List<Object>> listExams() {
        return ApiResponse.ok(List.of());
    }
}
