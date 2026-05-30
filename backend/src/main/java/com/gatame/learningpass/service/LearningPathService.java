package com.gatame.learningpass.service;

import com.gatame.learningpass.config.GatameLayoutProperties;
import com.gatame.learningpass.domain.FinalGoal;
import com.gatame.learningpass.domain.UserAttribute;
import com.gatame.learningpass.dto.AssessmentRequest;
import com.gatame.learningpass.dto.AssessmentResponse;
import com.gatame.learningpass.dto.ScoreBreakdown;
import com.gatame.learningpass.dto.ScoredModule;
import com.gatame.learningpass.model.Module;
import com.gatame.learningpass.repository.ModuleRepository;
import com.gatame.learningpass.service.path.PathGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 診断 API — specification.md §1（設問）・§4〜7（パス生成）に基づく評価。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LearningPathService {

    private final ModuleRepository moduleRepository;
    private final GatameLayoutProperties layoutProperties;
    private final PathGenerationService pathGenerationService;

    public AssessmentResponse assess(AssessmentRequest request) {
        FinalGoal goal = request.finalGoal();
        boolean suggestBbsEarly = goal != null && goal.triggersEarlyBbsSuggestion();

        log.info(
            "診断パス生成開始 userAttribute={}, aspirations={}, finalGoal={}, painPoints={}, completed={}",
            request.userAttribute(),
            request.aspirations(),
            goal,
            request.problems(),
            request.completedModuleIds());

        List<Module> catalog = moduleRepository.findAll();
        Map<String, Module> byId = new HashMap<>();
        for (Module m : catalog) {
            byId.put(m.getId(), m);
        }

        List<String> pathIds = pathGenerationService.generatePathModuleIds(request, catalog);
        Set<String> pathSet = new HashSet<>(pathIds);

        List<ScoredModule> pathModules = new ArrayList<>();
        int rank = pathIds.size();
        for (String id : pathIds) {
            Module m = byId.get(id);
            if (m != null) {
                pathModules.add(toScoredModule(m, rank--, false));
            }
        }

        List<ScoredModule> rest = new ArrayList<>();
        for (Module m : catalog) {
            if (pathSet.contains(m.getId())) {
                continue;
            }
            if (request.userAttribute() != UserAttribute.NOVICE && "ukemi".equals(m.getId())) {
                continue;
            }
            rest.add(toScoredModule(m, 0, false));
        }

        List<ScoredModule> recommended = new ArrayList<>(pathModules.size() + rest.size());
        recommended.addAll(pathModules);
        recommended.addAll(rest);

        Map<String, Double> layoutPull = resolveLayoutPullByModuleId(request.userAttribute());

        log.info(
            "診断パス生成完了 path={} 件、一覧 {} 件 (suggestBBSEarly={})",
            pathModules.size(),
            recommended.size(),
            suggestBbsEarly);

        return new AssessmentResponse(
            request.userAttribute(),
            request.interests(),
            request.aspirations(),
            goal,
            suggestBbsEarly,
            layoutPull,
            recommended,
            recommended.size(),
            !pathModules.isEmpty(),
            resolveBbsGrade(request.userAttribute()));
    }

    private static ScoredModule toScoredModule(Module module, int pathRank, boolean locked) {
        int score = pathRank > 0 ? pathRank : 0;
        ScoreBreakdown breakdown = new ScoreBreakdown(score, 0, 0, 0, 0, locked ? -1 : 0);
        return ScoredModule.from(module, score, breakdown, locked);
    }

    private Map<String, Double> resolveLayoutPullByModuleId(UserAttribute userAttribute) {
        Map<String, Map<String, Double>> all = layoutProperties.getAttributeModulePullBias();
        if (all == null) {
            return Map.of();
        }
        Map<String, Double> row = all.get(userAttribute.configKey());
        if (row == null || row.isEmpty()) {
            return Map.of();
        }
        return Map.copyOf(row);
    }

    private String resolveBbsGrade(UserAttribute userAttribute) {
        return userAttribute == UserAttribute.NOVICE ? "九級" : "三級";
    }
}
