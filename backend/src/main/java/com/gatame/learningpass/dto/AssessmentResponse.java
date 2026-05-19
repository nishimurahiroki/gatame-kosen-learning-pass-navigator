package com.gatame.learningpass.dto;

import com.gatame.learningpass.domain.AspirationStyle;
import com.gatame.learningpass.domain.FinalGoal;
import com.gatame.learningpass.domain.InterestOrientation;
import com.gatame.learningpass.domain.UserAttribute;

import java.util.List;
import java.util.Map;

/**
 * POST /api/assessment のレスポンス（スコア順の推奨モジュール一覧）。
 */
public record AssessmentResponse(
    UserAttribute userAttribute,
    InterestOrientation interests,
    List<AspirationStyle> aspirations,
    FinalGoal finalGoal,
    /** {@link FinalGoal#BBS_BLACK_BELT_PATH} 選択時 true（BBS 早期案内・文言出し分け用） */
    boolean suggestBBSEarly,
    /**
     * スキルマップ動的レイアウト用: モジュール ID → Y 方向の追加オフセット（正で下）。属性別にサーバーが詰める。
     */
    Map<String, Double> layoutPullByModuleId,
    List<ScoredModule> recommendedModules,
    int totalModules,
    boolean showBbsPromotion,
    String recommendedBbsGrade
) {}
