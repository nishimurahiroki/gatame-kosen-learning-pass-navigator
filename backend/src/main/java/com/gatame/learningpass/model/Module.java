package com.gatame.learningpass.model;

import com.gatame.learningpass.constants.ModuleCategory;
import lombok.Data;

import java.util.List;

/**
 * 学習モジュールのドメインモデル。
 * modules.json から読み込んだデータをマッピングするクラス。
 */
@Data
public class Module {

    /** 一意識別子（例: "ukemi"） */
    private String id;

    /** 表示名（例: "受け身の基礎"） */
    private String name;

    /** カテゴリ（重み付けのBase Scoreを決定する） */
    private ModuleCategory category;

    /** 難易度ラベル（BEGINNER / INTERMEDIATE / ADVANCED） */
    private DifficultyLevel difficulty;

    /**
     * このモジュールが属するタグ一覧。
     * 属性補正・課題マッチングで参照するキーワード群。
     * 例: ["ukemi", "foundation", "beginner-priority"]
     */
    private List<String> tags;

    /**
     * このモジュールが解決する課題（Problem）のIDリスト。
     * AssessmentRequest の selectedProblems と照合し、+300点を加算する。
     */
    private List<String> relatedProblems;

    /** 前提となるモジュールIDのリスト（ツリー表示のエッジ生成に使用） */
    private List<String> prerequisites;

    /** 対応する動画URL */
    private String videoUrl;

    /** サムネイル画像URL */
    private String thumbnailUrl;

    /** 説明文 */
    private String description;
}
