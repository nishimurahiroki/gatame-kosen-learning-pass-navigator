package com.gatame.learningpass.repository;

import com.gatame.learningpass.model.Module;

import java.util.List;
import java.util.Optional;

/**
 * 学習モジュールカタログの参照（将来的に JPA 実装へ差し替え可能）。
 */
public interface ModuleRepository {

    List<Module> findAll();

    Optional<Module> findById(String id);
}
