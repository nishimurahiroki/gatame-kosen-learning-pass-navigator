package com.gatame.learningpass.dto.progress;

import jakarta.validation.constraints.NotBlank;

public record TodoProgressRequest(
        @NotBlank String sessionKey,
        @NotBlank String moduleId,
        @NotBlank String itemId,
        boolean checked) {
}
