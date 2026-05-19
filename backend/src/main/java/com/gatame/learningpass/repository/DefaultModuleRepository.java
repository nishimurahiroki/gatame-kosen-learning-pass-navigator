package com.gatame.learningpass.repository;

import com.gatame.learningpass.model.Module;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Repository
public class DefaultModuleRepository implements ModuleRepository {

    private final Map<String, Module> byId;

    public DefaultModuleRepository(List<Module> allModules) {
        this.byId = allModules.stream()
            .collect(Collectors.toUnmodifiableMap(Module::getId, Function.identity()));
    }

    @Override
    public List<Module> findAll() {
        return List.copyOf(byId.values());
    }

    @Override
    public Optional<Module> findById(String id) {
        return Optional.ofNullable(byId.get(id));
    }
}
