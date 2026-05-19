package com.gatame.learningpass.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.Map;

/**
 * スキルマップの属性別レイアウト補正（{@code gatame.layout}）。
 * <p>キーは {@link com.gatame.learningpass.domain.UserAttribute#configKey()}（例: {@code BJJ_WHITE_TO_BLUE}）。
 * 値はモジュール ID → 縦方向の追加オフセット（正で下方向、ピクセル相当）。フロントの動的座標に加算される。
 */
@ConfigurationProperties(prefix = "gatame.layout")
public class GatameLayoutProperties {

    /**
     * ユーザー属性ごとのモジュール別レイアウトバイアス（Y 加算、正の値ほど画面上で下がる）。
     */
    private Map<String, Map<String, Double>> attributeModulePullBias = new HashMap<>();

    public Map<String, Map<String, Double>> getAttributeModulePullBias() {
        return attributeModulePullBias;
    }

    public void setAttributeModulePullBias(Map<String, Map<String, Double>> attributeModulePullBias) {
        this.attributeModulePullBias = attributeModulePullBias != null ? attributeModulePullBias : new HashMap<>();
    }
}
