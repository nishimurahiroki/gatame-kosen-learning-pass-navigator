package com.gatame.learningpass.controller;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 軽量ヘルスチェック（UptimeRobot / Render Health Check / フロント pre-warm 用）。
 * 診断 API より負荷が低く、スリープ解除にも使う。
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
