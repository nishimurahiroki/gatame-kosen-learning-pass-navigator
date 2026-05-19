package com.gatame.learningpass.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

/**
 * 最終的な学習ゴール（Q5）。スコアには影響しないプロフィール情報。
 */
public enum FinalGoal {

    PROBLEM_SOLVING("課題解決"),
    BBS_BLACK_BELT_PATH("BBS取得（黒帯を目指す）"),
    SKILL_SUPPLEMENT("技術補完"),
    COACHING_REFERENCE("指導参考");

    private final String jsonLabel;

    FinalGoal(String jsonLabel) {
        this.jsonLabel = jsonLabel;
    }

    @JsonValue
    public String getJsonLabel() {
        return jsonLabel;
    }

    /**
     * BBS 早期提案フラグ（メッセージ出し分け用）。
     */
    public boolean triggersEarlyBbsSuggestion() {
        return this == BBS_BLACK_BELT_PATH;
    }

    @JsonCreator
    public static FinalGoal fromJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String key = raw.trim();
        for (FinalGoal v : values()) {
            if (v.jsonLabel.equals(key)) {
                return v;
            }
        }
        try {
            return FinalGoal.valueOf(key.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            return fuzzy(key);
        }
    }

    private static FinalGoal fuzzy(String key) {
        String k = key.toLowerCase(Locale.ROOT);
        if (k.contains("bbs") || k.contains("黒帯")) {
            return BBS_BLACK_BELT_PATH;
        }
        if (k.contains("課題")) {
            return PROBLEM_SOLVING;
        }
        if (k.contains("技術") || k.contains("補完")) {
            return SKILL_SUPPLEMENT;
        }
        if (k.contains("指導")) {
            return COACHING_REFERENCE;
        }
        return null;
    }
}
