package com.gatame.learningpass.service.path;

import com.gatame.learningpass.domain.AspirationStyle;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * specification.md §7 — スタイル / 課題 → モジュール ID プール。
 */
public final class PathPoolMappings {

    public static final String UKEMI_ID = "ukemi";
    public static final String PAIN_SUBMISSION_ARTS_MASTERY = "submission-arts-mastery";
    public static final String PAIN_GUARD_PASS_DEFENSE = "guard-pass-defense";
    public static final String PAIN_GRIP_FIGHT = "grip-fight";

    private static final List<String> DYNAMIC_THROWS = List.of(
        "fundamental-tachi-waza",
        "kumikata-ai-yotsu",
        "kumikata-kenka-yotsu",
        "break-gripping-ai-yotsu",
        "throwing");

    private static final List<String> GROUND_CONTROL = List.of(
        "solo-newaza-workout",
        "osaekomi",
        "guard-pass-top",
        "guard-pass-bottom",
        "on-the-turtle",
        "escape-from-osaekomi");

    private static final List<String> SUBMISSION_ARTS = List.of(
        "solo-newaza-workout",
        "kansetsu-waza",
        "shime-waza",
        "on-the-turtle");

    private static final List<String> STANDING_TO_GROUND = List.of(
        "solo-newaza-workout",
        "osaekomi",
        "fundamental-tachi-waza",
        "kumikata-ai-yotsu",
        "kumikata-kenka-yotsu",
        "throwing",
        "guard-pass-top",
        "on-the-turtle");

    private static final Map<AspirationStyle, List<String>> NOVICE_BY_ASPIRATION = Map.of(
        AspirationStyle.THROW_FOCUS, DYNAMIC_THROWS,
        AspirationStyle.PIN_JUDO_FOCUS, GROUND_CONTROL,
        AspirationStyle.SUBMIT_FOCUS, SUBMISSION_ARTS,
        AspirationStyle.CONNECTIVITY_MIX_FOCUS, STANDING_TO_GROUND);

    /** レガシー A〜G → pain ID（旧クライアント互換） */
    private static final Map<String, String> LEGACY_LETTER_TO_PAIN = Map.of(
        "A", "standing-flow-to-submission",
        "B", "pin-after-throw",
        "C", "turtle-breakdown",
        "D", "guard-pass-from-top",
        "E", "guard-bottom-sweep-submit",
        "F", PAIN_GRIP_FIGHT,
        "G", "escape-osaekomi");

    private static final Map<String, List<String>> PAIN_POOLS = Map.ofEntries(
        Map.entry(
            "standing-flow-to-submission",
            List.of(
                "fundamental-tachi-waza",
                "osaekomi",
                "kansetsu-waza",
                "shime-waza",
                "throwing",
                "shime-waza-transition",
                "kansetsu-waza-transition",
                "osaekomi-transition")),
        Map.entry(
            "pin-after-throw",
            List.of(
                "solo-newaza-workout",
                "osaekomi",
                "escape-from-osaekomi",
                "on-the-turtle",
                "shime-waza-transition",
                "kansetsu-waza-transition")),
        Map.entry(
            "turtle-breakdown",
            List.of(
                "solo-newaza-workout",
                "kansetsu-waza",
                "shime-waza",
                "on-the-turtle",
                "shime-waza-transition",
                "kansetsu-waza-transition")),
        Map.entry(
            PAIN_SUBMISSION_ARTS_MASTERY,
            List.of(
                "osaekomi",
                "kansetsu-waza",
                "shime-waza",
                "on-the-turtle",
                "shime-waza-transition",
                "kansetsu-waza-transition")),
        Map.entry(
            PAIN_GUARD_PASS_DEFENSE,
            List.of(
                "solo-newaza-workout",
                "kansetsu-waza",
                "guard-pass-top",
                "guard-pass-bottom",
                "shime-waza-transition",
                "kansetsu-waza-transition")),
        Map.entry(
            "guard-pass-from-top",
            List.of(
                "solo-newaza-workout",
                "kansetsu-waza",
                "guard-pass-top",
                "guard-pass-bottom",
                "shime-waza-transition",
                "kansetsu-waza-transition")),
        Map.entry(
            "guard-bottom-sweep-submit",
            List.of(
                "solo-newaza-workout",
                "kansetsu-waza",
                "guard-pass-top",
                "guard-pass-bottom",
                "shime-waza-transition",
                "kansetsu-waza-transition")),
        Map.entry(
            PAIN_GRIP_FIGHT,
            List.of(
                "fundamental-tachi-waza",
                "kumikata-ai-yotsu",
                "kumikata-kenka-yotsu",
                "break-gripping-ai-yotsu",
                "break-gripping-kenka-yotsu",
                "osaekomi-transition")));

    private PathPoolMappings() {}

    public static Set<String> poolFromNoviceAspirations(List<AspirationStyle> aspirations) {
        Set<String> out = new LinkedHashSet<>();
        if (aspirations == null) {
            return out;
        }
        for (AspirationStyle style : aspirations) {
            if (style == null || !style.contributesScoring()) {
                continue;
            }
            List<String> ids = NOVICE_BY_ASPIRATION.get(style);
            if (ids != null) {
                out.addAll(ids);
            }
        }
        return out;
    }

    public static Set<String> poolFromPainSelections(List<String> rawProblems) {
        Set<String> out = new LinkedHashSet<>();
        if (rawProblems == null) {
            return out;
        }
        for (String raw : rawProblems) {
            if (raw == null || raw.isBlank()) {
                continue;
            }
            String key = raw.trim();
            if (key.length() == 1) {
                String mapped = LEGACY_LETTER_TO_PAIN.get(key.toUpperCase());
                if (mapped != null) {
                    key = mapped;
                }
            }
            List<String> ids = PAIN_POOLS.get(key);
            if (ids != null) {
                out.addAll(ids);
            }
        }
        return out;
    }

    public static boolean hasGrippingBattles(List<String> rawProblems) {
        if (rawProblems == null) {
            return false;
        }
        for (String raw : rawProblems) {
            if (raw == null) {
                continue;
            }
            String key = raw.trim();
            if (key.length() == 1 && "F".equalsIgnoreCase(key)) {
                return true;
            }
            if (PAIN_GRIP_FIGHT.equals(key)) {
                return true;
            }
        }
        return false;
    }
}
