package com.gatame.learningpass.controller;

import com.gatame.learningpass.dto.progress.MemoProgressRequest;
import com.gatame.learningpass.dto.progress.ModuleFeedbackRequest;
import com.gatame.learningpass.dto.progress.SessionProgressResponse;
import com.gatame.learningpass.dto.progress.TodoProgressRequest;
import com.gatame.learningpass.service.ModuleProgressStore;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 垂直パス詳細パネル用: TODO チェック・メモ・完了フィードバックの保存 API。
 */
@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ModuleProgressStore moduleProgressStore;

    @GetMapping("/session-state")
    public ResponseEntity<SessionProgressResponse> sessionState(@RequestParam("sessionKey") String sessionKey) {
        return ResponseEntity.ok(moduleProgressStore.snapshotSession(sessionKey));
    }

    @PostMapping("/todo")
    public ResponseEntity<Void> saveTodo(@Valid @RequestBody TodoProgressRequest body) {
        moduleProgressStore.updateTodo(body.sessionKey(), body.moduleId(), body.itemId(), body.checked());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/memo")
    public ResponseEntity<Void> saveMemo(@Valid @RequestBody MemoProgressRequest body) {
        moduleProgressStore.updateMemo(body.sessionKey(), body.moduleId(), body.memo());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/module-feedback")
    public ResponseEntity<Void> moduleFeedback(@Valid @RequestBody ModuleFeedbackRequest body) {
        moduleProgressStore.logModuleFeedback(
                body.sessionKey(),
                body.moduleId(),
                body.difficulty().name(),
                body.satisfaction(),
                body.videoRequestNote());
        return ResponseEntity.noContent().build();
    }
}
