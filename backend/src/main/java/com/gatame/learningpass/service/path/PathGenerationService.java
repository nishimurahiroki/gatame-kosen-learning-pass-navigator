package com.gatame.learningpass.service.path;

import com.gatame.learningpass.domain.UserAttribute;
import com.gatame.learningpass.dto.AssessmentRequest;
import com.gatame.learningpass.model.Module;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * specification.md §4〜7 — 4 モジュール学習パス生成（プール抽選 + 枠ルール）。
 */
@Slf4j
@Service
public class PathGenerationService {

    private static final int PATH_SIZE = 4;

    public List<String> generatePathModuleIds(AssessmentRequest request, List<Module> catalog) {
        Map<String, Module> byId = catalog.stream().collect(Collectors.toMap(Module::getId, m -> m, (a, b) -> a));
        PathUserLevel level = PathUserLevel.from(request.userAttribute());
        Set<String> completed = new HashSet<>(request.completedModuleIds());

        Set<String> poolIds = buildCandidatePool(request, level);
        poolIds = filterPoolForLevel(poolIds, byId, level);

        if (poolIds.isEmpty()) {
            poolIds = defaultPoolForLevel(byId, level);
        }

        SlotQuota quota = resolveQuota(level, PathPoolMappings.hasGrippingBattles(request.problems()));
        List<String> selected = new ArrayList<>();
        Set<String> used = new HashSet<>();

        if (quota.ukemiFixed()) {
            addIfAvailable(PathPoolMappings.UKEMI_ID, byId, completed, used, selected);
        }

        pickTier(
            ModuleTier.FOUNDATION,
            quota.foundation(),
            poolIds,
            byId,
            completed,
            used,
            selected,
            m -> quota.ukemiFixed() && PathPoolMappings.UKEMI_ID.equals(m.getId()));

        pickTier(
            ModuleTier.INTERMEDIATE,
            quota.intermediate(),
            poolIds,
            byId,
            completed,
            used,
            selected,
            m -> false);

        pickTier(
            ModuleTier.ADVANCED,
            quota.advanced(),
            poolIds,
            byId,
            completed,
            used,
            selected,
            m -> false);

        fillRemainingSlots(poolIds, byId, completed, used, selected);

        List<String> sorted = sortPathModules(selected, byId, quota.ukemiFixed());
        log.info(
            "Path generated level={}, modules={} (poolSize={})",
            level,
            sorted,
            poolIds.size());
        return sorted.size() > PATH_SIZE ? sorted.subList(0, PATH_SIZE) : sorted;
    }

    private record SlotQuota(int foundation, int intermediate, int advanced, boolean ukemiFixed) {}

    private SlotQuota resolveQuota(PathUserLevel level, boolean grippingException) {
        return switch (level) {
            case UNEXPERIENCED -> new SlotQuota(1, 2, 0, true);
            case EXPERIENCED -> new SlotQuota(1, 2, 1, false);
            case ADVANCED -> grippingException
                ? new SlotQuota(0, 3, 1, false)
                : new SlotQuota(0, 2, 2, false);
        };
    }

    private Set<String> buildCandidatePool(AssessmentRequest request, PathUserLevel level) {
        if (level == PathUserLevel.UNEXPERIENCED) {
            return PathPoolMappings.poolFromNoviceAspirations(request.aspirations());
        }
        return PathPoolMappings.poolFromPainSelections(request.problems());
    }

    private Set<String> filterPoolForLevel(Set<String> poolIds, Map<String, Module> byId, PathUserLevel level) {
        Set<String> out = new LinkedHashSet<>();
        for (String id : poolIds) {
            Module m = byId.get(id);
            if (m == null) {
                continue;
            }
            ModuleTier tier = ModuleTier.of(m);
            if (level == PathUserLevel.UNEXPERIENCED && tier == ModuleTier.ADVANCED) {
                continue;
            }
            out.add(id);
        }
        return out;
    }

    private Set<String> defaultPoolForLevel(Map<String, Module> byId, PathUserLevel level) {
        Set<String> out = new LinkedHashSet<>();
        for (Module m : byId.values()) {
            ModuleTier tier = ModuleTier.of(m);
            if (level == PathUserLevel.UNEXPERIENCED && tier == ModuleTier.ADVANCED) {
                continue;
            }
            out.add(m.getId());
        }
        return out;
    }

    private void pickTier(
            ModuleTier tier,
            int count,
            Set<String> poolIds,
            Map<String, Module> byId,
            Set<String> completed,
            Set<String> used,
            List<String> selected,
            Predicate<Module> extraExclude) {
        if (count <= 0) {
            return;
        }
        int need = count - countTierInSelected(selected, byId, tier, extraExclude);
        if (need <= 0) {
            return;
        }
        List<String> fromPool = candidates(poolIds, byId, tier, completed, used, extraExclude);
        pickRandom(fromPool, need, used, selected);

        need = count - countTierInSelected(selected, byId, tier, extraExclude);
        if (need > 0) {
            List<String> fromCatalog = candidates(catalogIds(byId), byId, tier, completed, used, extraExclude);
            pickRandom(fromCatalog, need, used, selected);
        }
    }

    private static List<String> catalogIds(Map<String, Module> byId) {
        return new ArrayList<>(byId.keySet());
    }

    private static List<String> candidates(
            Iterable<String> sourceIds,
            Map<String, Module> byId,
            ModuleTier tier,
            Set<String> completed,
            Set<String> used,
            Predicate<Module> extraExclude) {
        List<String> out = new ArrayList<>();
        for (String id : sourceIds) {
            if (used.contains(id) || completed.contains(id)) {
                continue;
            }
            Module m = byId.get(id);
            if (m == null || ModuleTier.of(m) != tier) {
                continue;
            }
            if (extraExclude.test(m)) {
                continue;
            }
            out.add(id);
        }
        return out;
    }

    private static void pickRandom(List<String> candidates, int count, Set<String> used, List<String> selected) {
        if (count <= 0 || candidates.isEmpty()) {
            return;
        }
        List<String> shuffled = new ArrayList<>(candidates);
        Collections.shuffle(shuffled, ThreadLocalRandom.current());
        for (String id : shuffled) {
            if (selected.size() >= PATH_SIZE) {
                break;
            }
            if (used.add(id)) {
                selected.add(id);
                if (--count <= 0) {
                    break;
                }
            }
        }
    }

    private static void addIfAvailable(
            String id,
            Map<String, Module> byId,
            Set<String> completed,
            Set<String> used,
            List<String> selected) {
        if (completed.contains(id) || used.contains(id) || !byId.containsKey(id)) {
            return;
        }
        used.add(id);
        selected.add(id);
    }

    private static int countTierInSelected(
            List<String> selected,
            Map<String, Module> byId,
            ModuleTier tier,
            Predicate<Module> extraExclude) {
        int n = 0;
        for (String id : selected) {
            Module m = byId.get(id);
            if (m != null && ModuleTier.of(m) == tier && !extraExclude.test(m)) {
                n++;
            }
        }
        return n;
    }

    private void fillRemainingSlots(
            Set<String> poolIds,
            Map<String, Module> byId,
            Set<String> completed,
            Set<String> used,
            List<String> selected) {
        while (selected.size() < PATH_SIZE) {
            List<String> remaining = new ArrayList<>();
            for (String id : catalogIds(byId)) {
                if (!used.contains(id) && !completed.contains(id)) {
                    remaining.add(id);
                }
            }
            if (remaining.isEmpty()) {
                break;
            }
            Collections.shuffle(remaining, ThreadLocalRandom.current());
            String pick = remaining.getFirst();
            used.add(pick);
            selected.add(pick);
        }
    }

    private List<String> sortPathModules(List<String> ids, Map<String, Module> byId, boolean ukemiFirst) {
        List<String> sorted = new ArrayList<>(ids);
        sorted.sort(
            Comparator
                .comparingInt((String id) -> {
                    if (ukemiFirst && PathPoolMappings.UKEMI_ID.equals(id)) {
                        return -1;
                    }
                    Module m = byId.get(id);
                    return m != null ? ModuleTier.of(m).sortOrder() : 99;
                })
                .thenComparing(id -> id));
        return sorted;
    }
}
