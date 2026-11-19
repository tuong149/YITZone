package vn.edu.fit.yitzone.cms.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cms")
public class CmsController {
    @GetMapping("/posts")
    public ApiResponse<List<Object>> listPublishedPosts() {
        return ApiResponse.ok(List.of());
    }
}
