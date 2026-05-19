package com.gatame.learningpass.dto.progress;

import jakarta.validation.constraints.NotBlank;

public record MemoProgressRequest(
        @NotBlank String sessionKey,
        @NotBlank String moduleId,
        String memo) {
}
