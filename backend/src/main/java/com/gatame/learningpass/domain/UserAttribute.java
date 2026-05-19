package com.gatame.learningpass.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

/**
 * 診断フォームのユーザー属性。
 * JSON では日本語ラベル（例: 未経験）またはレガシー英語キーを受け付ける。
 */
public enum UserAttribute {

    NOVICE("未経験"),
    JUDO_WHITE_TO_SHODAN("Judo(白/初段)"),
    BJJ_WHITE_TO_BLUE("BJJ(白/青)"),
    JUDO_NIDAN_PLUS("Judo(二段以上)"),
    BJJ_PURPLE_PLUS("BJJ(紫以上)");

    private final String jsonLabel;

    UserAttribute(String jsonLabel) {
        this.jsonLabel = jsonLabel;
    }

    @JsonValue
    public String getJsonLabel() {
        return jsonLabel;
    }

    @JsonCreator
    public static UserAttribute fromJson(String raw) {
        if (raw == null || raw.isBlank()) {
            return NOVICE;
        }
        String key = raw.trim();
        for (UserAttribute ua : values()) {
            if (ua.jsonLabel.equals(key)) {
                return ua;
            }
        }
        return legacyEnglish(key.toUpperCase(Locale.ROOT));
    }

    private static UserAttribute legacyEnglish(String upper) {
        return switch (upper) {
            case "BEGINNER", "UNKNOWN" -> NOVICE;
            case "JUDO" -> JUDO_WHITE_TO_SHODAN;
            case "BJJ" -> BJJ_WHITE_TO_BLUE;
            case "ADVANCED" -> JUDO_NIDAN_PLUS;
            default -> NOVICE;
        };
    }

    /** application.yml のマップキー（enum 定数名） */
    public String configKey() {
        return name();
    }
}
