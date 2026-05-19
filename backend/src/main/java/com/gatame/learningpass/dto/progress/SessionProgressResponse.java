package com.gatame.learningpass.dto.progress;

import java.util.Map;

public record SessionProgressResponse(Map<String, ModuleProgressEntryDto> modules) {
}
