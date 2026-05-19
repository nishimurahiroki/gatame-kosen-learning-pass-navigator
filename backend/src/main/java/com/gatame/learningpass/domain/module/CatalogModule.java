package com.gatame.learningpass.domain.module;

/**
 * カタログに登録された学習モジュールの共通形状。
 * {@link LearningModuleDefinition} のみ実装する sealed インターフェース。
 */
public sealed interface CatalogModule permits LearningModuleDefinition {

    /** modules.json 等と共有する安定 ID */
    String moduleId();

    /** 公式カタログ名（英語表記ベース） */
    String canonicalTitle();

    /** 診断アルゴリズムのベース重み */
    int baseWeight();

    /** 初級 / 中級 / 上級 */
    ModuleCurriculumLevel curriculumLevel();
}
