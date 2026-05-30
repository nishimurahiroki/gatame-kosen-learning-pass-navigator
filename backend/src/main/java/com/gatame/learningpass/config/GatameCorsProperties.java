package com.gatame.learningpass.config;

import java.util.Arrays;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gatame.cors")
@Getter
@Setter
public class GatameCorsProperties {

    /**
     * カンマ区切りで複数 Origin を指定可能（ローカル dev プロファイル用）。
     */
    private String allowedOrigins = "http://localhost:5173";

    public List<String> allowedOriginList() {
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            return List.of();
        }
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
