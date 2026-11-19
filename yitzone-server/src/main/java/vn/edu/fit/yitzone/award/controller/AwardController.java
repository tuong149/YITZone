package vn.edu.fit.yitzone.award.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/awards")
public class AwardController {
    @GetMapping("/campaigns")
    public ApiResponse<List<Object>> listAwardCampaigns() {
        return ApiResponse.ok(List.of());
    }
}
