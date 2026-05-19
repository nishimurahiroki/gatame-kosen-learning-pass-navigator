package com.gatame.learningpass.dto.progress;

import java.util.Map;

public record ModuleProgressEntryDto(Map<String, Boolean> checkedItems, String memo) {
}
