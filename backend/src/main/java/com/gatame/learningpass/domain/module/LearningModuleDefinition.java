package com.gatame.learningpass.domain.module;

import java.util.Arrays;
import java.util.Optional;

/**
 * 全18モジュールのカタログ定義（ID・名称・レベル・ベース重み）。
 */
public enum LearningModuleDefinition implements CatalogModule {

    UKEMI("ukemi", "Ukemi", 100, ModuleCurriculumLevel.BEGINNER),
    SOLO_NEWAZA_WORKOUT("solo-newaza-workout", "Solo Newaza Workout", 100, ModuleCurriculumLevel.BEGINNER),
    OSAEKOMI("osaekomi", "OSAEKOMI", 100, ModuleCurriculumLevel.BEGINNER),
    FUNDAMENTAL_TACHI_WAZA("fundamental-tachi-waza", "Fundamental Tachi Waza", 100, ModuleCurriculumLevel.BEGINNER),

    KUMIKATA_AI_YOTSU("kumikata-ai-yotsu", "KUMIKATA (AI YOTSU)", 90, ModuleCurriculumLevel.BEGINNER),
    KUMIKATA_KENKA_YOTSU("kumikata-kenka-yotsu", "KUMIKATA (KENKA YOTSU)", 90, ModuleCurriculumLevel.BEGINNER),
    BREAK_GRIPPING_AI_YOTSU("break-gripping-ai-yotsu", "Break the Gripping (AI YOTSU)", 90,
        ModuleCurriculumLevel.BEGINNER),
    BREAK_GRIPPING_KENKA_YOTSU("break-gripping-kenka-yotsu", "Break the Gripping (KENKA YOTSU)", 90,
        ModuleCurriculumLevel.BEGINNER),

    KANSETSU_WAZA("kansetsu-waza", "KANSETSU WAZA", 80, ModuleCurriculumLevel.INTERMEDIATE),
    SHIME_WAZA("shime-waza", "SHIME", 80, ModuleCurriculumLevel.INTERMEDIATE),
    THROWING("throwing", "Throwing", 80, ModuleCurriculumLevel.INTERMEDIATE),

    GUARD_PASS_TOP("guard-pass-top", "Guard pass (top)", 60, ModuleCurriculumLevel.INTERMEDIATE),
    GUARD_PASS_BOTTOM("guard-pass-bottom", "Guard pass (bottom)", 60, ModuleCurriculumLevel.INTERMEDIATE),
    ON_THE_TURTLE("on-the-turtle", "On the Turtle", 60, ModuleCurriculumLevel.INTERMEDIATE),
    ESCAPE_FROM_OSAEKOMI("escape-from-osaekomi", "Escape from OSAEKOMI", 60, ModuleCurriculumLevel.INTERMEDIATE),

    SHIME_WAZA_TRANSITION("shime-waza-transition", "SHIME WAZA Transition", 20, ModuleCurriculumLevel.ADVANCED),
    KANSETSU_WAZA_TRANSITION("kansetsu-waza-transition", "KANSETSU WAZA Transition", 20,
        ModuleCurriculumLevel.ADVANCED),
    OSAEKOMI_TRANSITION("osaekomi-transition", "OSAEKOMI Transition", 20, ModuleCurriculumLevel.ADVANCED);

    private final String moduleId;
    private final String canonicalTitle;
    private final int baseWeight;
    private final ModuleCurriculumLevel curriculumLevel;

    LearningModuleDefinition(
            String moduleId,
            String canonicalTitle,
            int baseWeight,
            ModuleCurriculumLevel curriculumLevel) {
        this.moduleId = moduleId;
        this.canonicalTitle = canonicalTitle;
        this.baseWeight = baseWeight;
        this.curriculumLevel = curriculumLevel;
    }

    public static Optional<LearningModuleDefinition> findByModuleId(String id) {
        return Arrays.stream(values()).filter(e -> e.moduleId.equals(id)).findFirst();
    }

    @Override
    public String moduleId() {
        return moduleId;
    }

    @Override
    public String canonicalTitle() {
        return canonicalTitle;
    }

    @Override
    public int baseWeight() {
        return baseWeight;
    }

    @Override
    public ModuleCurriculumLevel curriculumLevel() {
        return curriculumLevel;
    }
}
