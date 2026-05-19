package com.gatame.learningpass.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

/**
 * 未経験者向け「憧れスタイル」（Q2-alt）。
 */
public enum AspirationStyle {

    /** JSON や将来拡張で解釈できない値（加点なし） */
    UNKNOWN(""),

    THROW_FOCUS("投げたい"),
    SUBMIT_FOCUS("極めたい"),
    NEWAZA_BJJ_FOCUS("寝技の攻防（BJJ）"),
    PIN_JUDO_FOCUS("抑え込み（Judo）"),
    CONNECTIVITY_MIX_FOCUS("連動性（Mix）");

    private final String jsonLabel;

    AspirationStyle(String jsonLabel) {
        this.jsonLabel = jsonLabel;
    }

    @JsonValue
    public String getJsonLabel() {
        return jsonLabel;
    }

    @JsonCreator
    public static AspirationStyle fromJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return UNKNOWN;
        }
        String key = raw.trim();
        for (AspirationStyle v : values()) {
            if (v.jsonLabel.equals(key)) {
                return v;
            }
        }
        String upper = key.toUpperCase(Locale.ROOT);
        try {
            return AspirationStyle.valueOf(upper);
        } catch (IllegalArgumentException ignored) {
            AspirationStyle alias = legacyAlias(upper);
            return alias != null ? alias : UNKNOWN;
        }
    }

    private static AspirationStyle legacyAlias(String upper) {
        return switch (upper) {
            case "THROW", "NAGE" -> THROW_FOCUS;
            case "SUBMIT", "SUBMISSION" -> SUBMIT_FOCUS;
            default -> null;
        };
    }

    public boolean contributesScoring() {
        return this != UNKNOWN;
    }
}
