package com.gatame.learningpass.controller;

import com.gatame.learningpass.dto.AssessmentRequest;
import com.gatame.learningpass.dto.AssessmentResponse;
import com.gatame.learningpass.service.LearningPathService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 診断結果を受け取り、スコア順の推奨モジュール一覧を返す。
 */
@RestController
@RequestMapping("/api/assessment")
@RequiredArgsConstructor
@CrossOrigin(origins = "${gatame.cors.allowed-origins:http://localhost:5173}")
public class AssessmentController {

    private final LearningPathService learningPathService;

    @PostMapping
    public ResponseEntity<AssessmentResponse> assess(@Valid @RequestBody AssessmentRequest request) {
        return ResponseEntity.ok(learningPathService.assess(request));
    }
}
