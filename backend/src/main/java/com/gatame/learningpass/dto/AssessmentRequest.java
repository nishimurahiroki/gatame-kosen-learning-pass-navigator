package com.gatame.learningpass.dto;

import com.gatame.learningpass.domain.AspirationStyle;
import com.gatame.learningpass.domain.FinalGoal;
import com.gatame.learningpass.domain.InterestOrientation;
import com.gatame.learningpass.domain.UserAttribute;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * フロントエンドからの診断結果入力。
 *
 * <p>{@code interests} は経験者向け（任意）。未経験者リクエストで省略・null してよい。</p>
 */
public record AssessmentRequest(
    @NotNull(message = "userAttribute は必須です")
    UserAttribute userAttribute,

    /** 経験者向け志向性（Q2）。未経験者では通常送られない。 */
    InterestOrientation interests,

    List<
        @Pattern(regexp = "(?i)[A-G]", message = "problems は A〜G のみ指定できます")
        String> problems,

    /** 未経験者向け憧れスタイル（Q2-alt）。複数選択可。 */
    List<AspirationStyle> aspirations,

    /** 最終ゴール（Q5）。スコアには影響しない。 */
    FinalGoal finalGoal,

    /** ユーザーが完了済みのモジュールID（前提関係・Ukemi 判定に使用） */
    List<String> completedModuleIds,

    String userId
) {

    public AssessmentRequest {
        problems = problems == null
            ? List.of()
            : problems.stream()
                .filter(Objects::nonNull)
                .map(s -> s.trim().toUpperCase(Locale.ROOT))
                .toList();
        aspirations = aspirations == null ? List.of() : List.copyOf(aspirations);
        completedModuleIds = completedModuleIds == null ? List.of() : List.copyOf(completedModuleIds);
    }
}
