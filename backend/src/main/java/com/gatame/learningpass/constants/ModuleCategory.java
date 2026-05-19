package com.gatame.learningpass.constants;

/**
 * モジュールのカテゴリ分類。
 * Base Score の計算に使用する。
 */
public enum ModuleCategory {
    /** 基礎（Ukemi, Solo Newaza Workout, OSAEKOMI, Fundamental Tachi Waza等）: baseScore 100 */
    FOUNDATION,
    /** 組手（KUMIKATA, Break the Gripping の AI/KENKA YOTSU等）: baseScore 90 */
    PAIRING,
    /** 単体技術（Shime, Kansetsu等）: baseScore 80 */
    SINGLE_TECHNIQUE,
    /** 攻防（Guard pass, Turnover等）: baseScore 60 */
    ATTACK_DEFENSE,
    /** 遷移（Transitions）: baseScore 20 */
    TRANSITION
}
