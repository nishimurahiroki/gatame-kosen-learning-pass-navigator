package com.gatame.learningpass.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gatame.learningpass.model.Module;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.util.List;

/**
 * modules.json を起動時に読み込み、Spring コンテナに登録するコンフィグ。
 *
 * <p>ファイルパスは application.yml の {@code gatame.modules.config-path} で変更できるため、
 * メタデータの調整は Java を触らずに JSON を差し替えるだけで完結する。
 * ベース重み・カタログ上の18モジュールは {@link com.gatame.learningpass.domain.module.LearningModuleDefinition} を参照。</p>
 */
@Slf4j
@Configuration
public class ModuleConfigLoader {

    /**
     * classpath 上の modules.json（デフォルト）、または外部パスを指定可能。
     * 例: file:/opt/gatame/config/modules.json
     */
    @Value("${gatame.modules.config-path:classpath:modules.json}")
    private Resource modulesResource;

    private final ObjectMapper objectMapper;

    public ModuleConfigLoader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * 読み込んだ全モジュールをリストとして Bean 登録する。
     * 起動時に一度だけ読み込まれ、以降はキャッシュされる。
     */
    @Bean
    public List<Module> allModules() throws IOException {
        List<Module> modules = objectMapper.readValue(
            modulesResource.getInputStream(),
            new TypeReference<List<Module>>() {}
        );
        log.info("modules.json を読み込みました: {}件のモジュール", modules.size());
        return modules;
    }
}
