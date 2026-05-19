package com.gatame.learningpass.dto;

import com.gatame.learningpass.model.DifficultyLevel;
import com.gatame.learningpass.model.Module;

import java.util.List;

/**
 * スコア計算済みモジュール。
 *
 * @param locked {@code true} のときハード依存未充足などによりリスト後半ブロックへ配置される。
 */
public record ScoredModule(
    String id,
    String name,
    DifficultyLevel difficulty,
    String description,
    String videoUrl,
    String thumbnailUrl,
    List<String> prerequisites,
    int finalScore,
    ScoreBreakdown scoreBreakdown,
    boolean locked
) {

    public static ScoredModule from(
            Module module,
            int finalScore,
            ScoreBreakdown breakdown,
            boolean locked) {
        List<String> prereq = module.getPrerequisites() == null ? List.of() : List.copyOf(module.getPrerequisites());
        return new ScoredModule(
            module.getId(),
            module.getName(),
            module.getDifficulty(),
            module.getDescription(),
            module.getVideoUrl(),
            module.getThumbnailUrl(),
            prereq,
            finalScore,
            breakdown,
            locked);
    }
}
