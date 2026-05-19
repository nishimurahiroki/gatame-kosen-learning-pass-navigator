package com.gatame.learningpass.dto;

/**
 * 重み和スコアの内訳（README §5.10）。
 *
 * <ul>
 *   <li>{@code baseScore} — 観点 F（前提充足率）</li>
 *   <li>{@code userAttributeBonus} — 観点 A（属性適合度）</li>
 *   <li>{@code orientationBonus} — 観点 B（興味・経験者のみ）</li>
 *   <li>{@code aspirationBonus} — 観点 C（憧れ・未経験のみ）</li>
 *   <li>{@code problemMatchBonus} — 観点 D（課題・経験者のみ）</li>
 *   <li>{@code prerequisitePenalty} — locked 時の表示用（-1）。{@link #weightedSum()} には含めない</li>
 * </ul>
 */
public record ScoreBreakdown(
    int baseScore,
    int userAttributeBonus,
    int orientationBonus,
    int aspirationBonus,
    int problemMatchBonus,
    int prerequisitePenalty
) {

    /** {@code finalScore} と一致する寄与の合計（ペナルティ表示フィールドは除く）。 */
    public int weightedSum() {
        return baseScore
            + userAttributeBonus
            + orientationBonus
            + aspirationBonus
            + problemMatchBonus;
    }

    /** @deprecated 互換のため残す。{@link #weightedSum()} と同値。 */
    @Deprecated
    public int total() {
        return weightedSum();
    }
}
