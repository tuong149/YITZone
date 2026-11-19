package vn.edu.fit.yitzone.minigame.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.fit.yitzone.common.api.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/minigames")
public class MinigameController {
    @GetMapping("/rooms")
    public ApiResponse<List<Object>> listRooms() {
        return ApiResponse.ok(List.of());
    }
}
