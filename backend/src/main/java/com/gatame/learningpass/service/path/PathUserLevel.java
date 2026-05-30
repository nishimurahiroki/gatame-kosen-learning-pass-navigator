package com.gatame.learningpass.service.path;

import com.gatame.learningpass.domain.UserAttribute;

/**
 * specification.md §2 — 生成算法用ユーザーレベル。
 */
public enum PathUserLevel {
    UNEXPERIENCED,
    EXPERIENCED,
    ADVANCED;

    public static PathUserLevel from(UserAttribute attribute) {
        if (attribute == UserAttribute.NOVICE) {
            return UNEXPERIENCED;
        }
        if (attribute == UserAttribute.JUDO_NIDAN_PLUS || attribute == UserAttribute.BJJ_PURPLE_PLUS) {
            return ADVANCED;
        }
        return EXPERIENCED;
    }
}
