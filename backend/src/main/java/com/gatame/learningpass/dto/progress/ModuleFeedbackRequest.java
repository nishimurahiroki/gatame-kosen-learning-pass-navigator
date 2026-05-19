package com.gatame.learningpass.dto.progress;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ModuleFeedbackRequest(
        @NotBlank String sessionKey,
        @NotBlank String moduleId,
        @NotNull DifficultyFeedback difficulty,
        @Min(1) @Max(5) int satisfaction,
        String videoRequestNote) {
}
