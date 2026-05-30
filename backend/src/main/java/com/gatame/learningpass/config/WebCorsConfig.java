package com.gatame.learningpass.config;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS を {@link GatameCorsProperties} で一元管理。本番は単一 Vercel Origin、
 * {@code dev} プロファイルでは localhost 系を許可（Docker / Render では dev 未使用）。
 */
@Configuration
@RequiredArgsConstructor
public class WebCorsConfig implements WebMvcConfigurer {

    private final GatameCorsProperties corsProperties;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = corsProperties.allowedOriginList();
        if (origins.isEmpty()) {
            return;
        }
        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
