package com.gatame.learningpass.service.path;

import com.gatame.learningpass.constants.ModuleCategory;
import com.gatame.learningpass.model.DifficultyLevel;
import com.gatame.learningpass.model.Module;

/**
 * specification.md §3 — FOUNDATION / INTERMEDIATE / ADVANCED 階層。
 */
public enum ModuleTier {
    FOUNDATION,
    INTERMEDIATE,
    ADVANCED;

    public static ModuleTier of(Module module) {
        if (module.getCategory() == ModuleCategory.TRANSITION) {
            return ADVANCED;
        }
        if (module.getCategory() == ModuleCategory.FOUNDATION) {
            return FOUNDATION;
        }
        if (module.getDifficulty() == DifficultyLevel.ADVANCED) {
            return ADVANCED;
        }
        return INTERMEDIATE;
    }

    public int sortOrder() {
        return ordinal();
    }
}
