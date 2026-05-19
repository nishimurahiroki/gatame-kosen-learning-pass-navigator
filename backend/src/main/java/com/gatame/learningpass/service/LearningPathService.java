package com.gatame.learningpass.service;

import com.gatame.learningpass.config.GatameLayoutProperties;
import com.gatame.learningpass.config.GatameScoringProperties;
import com.gatame.learningpass.config.GatameScoringProperties.AffinityConfig;
import com.gatame.learningpass.config.GatameScoringProperties.DimensionWeights;
import com.gatame.learningpass.constants.ModuleCategory;
import com.gatame.learningpass.domain.AspirationStyle;
import com.gatame.learningpass.domain.FinalGoal;
import com.gatame.learningpass.domain.InterestOrientation;
import com.gatame.learningpass.domain.UserAttribute;
import com.gatame.learningpass.dto.AssessmentRequest;
import com.gatame.learningpass.dto.AssessmentResponse;
import com.gatame.learningpass.dto.ScoreBreakdown;
import com.gatame.learningpass.dto.ScoredModule;
import com.gatame.learningpass.model.Module;
import com.gatame.learningpass.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 重み和スコアリング（README §5）。
 *
 * <p>{@code Score = round(100 × Σ w_i × s_i)}。ロックは {@code locked=true} で末尾ブロックへ固定。
 * 経験者・熟練者は TRANSITION 3 モジュールを常にリスト末尾 3 ポジションに配置する。</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LearningPathService {

    private final ModuleRepository moduleRepository;
    private final GatameScoringProperties scoring;
    private final GatameLayoutProperties layoutProperties;

    public AssessmentResponse assess(AssessmentRequest request) {
        FinalGoal goal = request.finalGoal();
        boolean suggestBbsEarly = goal != null && goal.triggersEarlyBbsSuggestion();

        log.info(
            "診断スコアリング開始 userAttribute={}, interests={}, aspirations={}, finalGoal={}, problems={}, completed={}",
            request.userAttribute(),
            request.interests(),
            request.aspirations(),
            goal,
            request.problems(),
            request.completedModuleIds());

        List<Module> catalog = moduleRepository.findAll();
        NormalizationContext norms = buildNormalizationContext(catalog, request);
        DimensionWeights weights = weightsFor(request.userAttribute());

        Set<String> transitionModuleIds = catalog.stream()
            .filter(m -> m.getCategory() == ModuleCategory.TRANSITION)
            .map(Module::getId)
            .collect(Collectors.toUnmodifiableSet());

        List<ScoredModule> ranked = catalog.stream()
            .map(m -> scoreModule(m, request, weights, norms))
            .sorted(sortOrder(request.userAttribute(), transitionModuleIds))
            .toList();

        Map<String, Double> layoutPullByModuleId = resolveLayoutPullByModuleId(request.userAttribute());

        List<ScoredModule> visibleRanked =
            request.userAttribute() == UserAttribute.NOVICE
                ? ranked
                : ranked.stream()
                    .filter(sm -> !scoring.getUkemiModuleId().equals(sm.id()))
                    .toList();

        log.info(
            "診断スコアリング完了 {} 件、表示 {} 件 (suggestBBSEarly={})",
            ranked.size(),
            visibleRanked.size(),
            suggestBbsEarly);

        return new AssessmentResponse(
            request.userAttribute(),
            request.interests(),
            request.aspirations(),
            goal,
            suggestBbsEarly,
            layoutPullByModuleId,
            visibleRanked,
            visibleRanked.size(),
            !visibleRanked.isEmpty(),
            resolveBbsGrade(request.userAttribute()));
    }

    private Comparator<ScoredModule> sortOrder(UserAttribute userAttribute, Set<String> transitionModuleIds) {
        if (userAttribute == UserAttribute.NOVICE) {
            return Comparator
                .comparing(ScoredModule::locked)
                .thenComparing(ScoredModule::finalScore, Comparator.reverseOrder());
        }
        return Comparator
            .comparingInt((ScoredModule sm) -> sortBucketExperienced(sm, transitionModuleIds))
            .thenComparing(ScoredModule::finalScore, Comparator.reverseOrder());
    }

    /** 0=unlocked非TR, 1=locked非TR, 2=TRANSITION（常に末尾3連） */
    private static int sortBucketExperienced(ScoredModule sm, Set<String> transitionModuleIds) {
        if (transitionModuleIds.contains(sm.id())) {
            return 2;
        }
        return sm.locked() ? 1 : 0;
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

    private ScoredModule scoreModule(
            Module module,
            AssessmentRequest request,
            DimensionWeights weights,
            NormalizationContext norms) {
        Set<String> done = completed(request);
        boolean locked = isLocked(module, request, done);

        double sA = scoreUserAttribute(module, request.userAttribute(), norms);
        double sB = scoreInterest(module, request, norms);
        double sC = scoreAspiration(module, request, norms);
        double sD = scoreProblem(module, request.problems());
        double sF = scorePrerequisiteReadiness(module, request, done);

        int contribF = contribution(weights.getPrerequisiteReadiness(), sF);
        int contribA = contribution(weights.getUserAttribute(), sA);
        int contribB = contribution(weights.getInterest(), sB);
        int contribC = contribution(weights.getAspiration(), sC);
        int contribD = contribution(weights.getProblem(), sD);

        int finalScore = contribF + contribA + contribB + contribC + contribD;

        ScoreBreakdown breakdown = new ScoreBreakdown(
            contribF,
            contribA,
            contribB,
            contribC,
            contribD,
            locked ? -1 : 0);

        return ScoredModule.from(module, finalScore, breakdown, locked);
    }

    private static int contribution(double weight, double normalizedScore) {
        if (weight <= 0 || normalizedScore <= 0) {
            return 0;
        }
        return (int) Math.round(100.0 * weight * normalizedScore);
    }

    private DimensionWeights weightsFor(UserAttribute userAttribute) {
        return userAttribute == UserAttribute.NOVICE ? scoring.getNovice() : scoring.getExperienced();
    }

    private Set<String> completed(AssessmentRequest request) {
        return new HashSet<>(request.completedModuleIds());
    }

    private double scoreUserAttribute(Module module, UserAttribute segment, NormalizationContext norms) {
        AffinityConfig affinity = scoring.getAffinity();
        Map<String, Integer> row = affinity.getUserAttribute().get(segment.configKey());
        if (row == null || norms.maxUserAttributeAffinity() <= 0) {
            return 0;
        }
        int raw = row.getOrDefault(module.getId(), 0);
        return clip01((double) Math.max(0, raw) / norms.maxUserAttributeAffinity());
    }

    private double scoreInterest(Module module, AssessmentRequest request, NormalizationContext norms) {
        if (request.userAttribute() == UserAttribute.NOVICE || request.interests() == null) {
            return 0;
        }
        return switch (request.interests()) {
            case JUDO -> normalizedTableValue(
                module.getId(),
                scoring.getAffinity().getInterest().getJudo(),
                norms.maxJudoInterest());
            case BJJ -> normalizedTableValue(
                module.getId(),
                scoring.getAffinity().getInterest().getBjj(),
                norms.maxBjjInterest());
            case MIX -> scoreInterestMix(module, norms);
        };
    }

    private double scoreInterestMix(Module module, NormalizationContext norms) {
        if (module.getCategory() == ModuleCategory.TRANSITION) {
            return 1.0;
        }
        double judo = normalizedTableValue(
            module.getId(),
            scoring.getAffinity().getInterest().getJudo(),
            norms.maxJudoInterest());
        double bjj = normalizedTableValue(
            module.getId(),
            scoring.getAffinity().getInterest().getBjj(),
            norms.maxBjjInterest());
        return (judo + bjj) / 2.0;
    }

    private double scoreAspiration(Module module, AssessmentRequest request, NormalizationContext norms) {
        if (request.userAttribute() != UserAttribute.NOVICE || request.aspirations().isEmpty()) {
            return 0;
        }
        if (norms.maxAspirationAffinity() <= 0) {
            return 0;
        }
        String moduleId = module.getId();
        int best = 0;
        for (AspirationStyle style : request.aspirations()) {
            if (!style.contributesScoring()) {
                continue;
            }
            Map<String, Integer> row = scoring.getAffinity().getAspiration().get(style.name());
            if (row != null) {
                best = Math.max(best, row.getOrDefault(moduleId, 0));
            }
        }
        return clip01((double) best / norms.maxAspirationAffinity());
    }

    private double scoreProblem(Module module, List<String> problems) {
        if (problems == null || problems.isEmpty()) {
            return 0;
        }
        String moduleId = module.getId();
        Map<String, List<String>> targets = scoring.getAffinity().getProblem();
        long matches = problems.stream()
            .filter(letter -> {
                List<String> ids = targets.get(letter);
                return ids != null && ids.contains(moduleId);
            })
            .count();
        return (double) matches / problems.size();
    }

    private double scorePrerequisiteReadiness(Module module, AssessmentRequest request, Set<String> done) {
        List<String> prereq = effectivePrerequisites(module, request);
        if (prereq.isEmpty()) {
            return 1.0;
        }
        long satisfied = prereq.stream().filter(done::contains).count();
        return (double) satisfied / prereq.size();
    }

    private List<String> effectivePrerequisites(Module module, AssessmentRequest request) {
        List<String> prereq = module.getPrerequisites();
        if (prereq == null || prereq.isEmpty()) {
            return List.of();
        }
        String ukemiId = scoring.getUkemiModuleId();
        if (request.userAttribute() == UserAttribute.NOVICE) {
            return List.copyOf(prereq);
        }
        return prereq.stream().filter(id -> !ukemiId.equals(id)).toList();
    }

    private boolean isLocked(Module module, AssessmentRequest request, Set<String> done) {
        String throwingId = scoring.getThrowingModuleId();
        String ukemiId = scoring.getUkemiModuleId();
        boolean transition = module.getCategory() == ModuleCategory.TRANSITION;

        if (isAdvanced(request.userAttribute()) && module.getCategory() == ModuleCategory.FOUNDATION) {
            return true;
        }

        if (transition && !prerequisitesSatisfied(module, request, done)) {
            return true;
        }
        if (throwingId.equals(module.getId())) {
            if (!prerequisitesSatisfied(module, request, done)) {
                return true;
            }
            if (request.userAttribute() == UserAttribute.NOVICE && !done.contains(ukemiId)) {
                return true;
            }
        }
        if (transition && request.userAttribute() == UserAttribute.NOVICE && !done.contains(ukemiId)) {
            return true;
        }
        return false;
    }

    private static boolean isAdvanced(UserAttribute userAttribute) {
        return userAttribute == UserAttribute.JUDO_NIDAN_PLUS
            || userAttribute == UserAttribute.BJJ_PURPLE_PLUS;
    }

    private boolean prerequisitesSatisfied(Module module, AssessmentRequest request, Set<String> done) {
        return effectivePrerequisites(module, request).stream().allMatch(done::contains);
    }

    private static double normalizedTableValue(String moduleId, Map<String, Integer> table, double max) {
        if (max <= 0) {
            return 0;
        }
        int raw = table.getOrDefault(moduleId, 0);
        return clip01((double) Math.max(0, raw) / max);
    }

    private static double clip01(double value) {
        if (value <= 0) {
            return 0;
        }
        return Math.min(1.0, value);
    }

    private NormalizationContext buildNormalizationContext(List<Module> catalog, AssessmentRequest request) {
        AffinityConfig affinity = scoring.getAffinity();
        String segmentKey = request.userAttribute().configKey();
        Map<String, Integer> attrRow = affinity.getUserAttribute().getOrDefault(segmentKey, Map.of());

        double maxAttr = catalog.stream()
            .mapToInt(m -> Math.max(0, attrRow.getOrDefault(m.getId(), 0)))
            .max()
            .orElse(1);

        double maxJudo = maxInTable(catalog, affinity.getInterest().getJudo());
        double maxBjj = maxInTable(catalog, affinity.getInterest().getBjj());

        double maxAspiration = 1;
        if (request.userAttribute() == UserAttribute.NOVICE && !request.aspirations().isEmpty()) {
            maxAspiration = 0;
            for (AspirationStyle style : request.aspirations()) {
                if (!style.contributesScoring()) {
                    continue;
                }
                Map<String, Integer> row = affinity.getAspiration().get(style.name());
                if (row == null) {
                    continue;
                }
                for (Module m : catalog) {
                    maxAspiration = Math.max(maxAspiration, row.getOrDefault(m.getId(), 0));
                }
            }
            if (maxAspiration <= 0) {
                maxAspiration = 1;
            }
        }

        return new NormalizationContext(maxAttr, maxJudo, maxBjj, maxAspiration);
    }

    private static double maxInTable(List<Module> catalog, Map<String, Integer> table) {
        double max = catalog.stream()
            .mapToInt(m -> Math.max(0, table.getOrDefault(m.getId(), 0)))
            .max()
            .orElse(0);
        return max > 0 ? max : 1;
    }

    private String resolveBbsGrade(UserAttribute userAttribute) {
        return userAttribute == UserAttribute.NOVICE ? "九級" : "三級";
    }

    private record NormalizationContext(
        double maxUserAttributeAffinity,
        double maxJudoInterest,
        double maxBjjInterest,
        double maxAspirationAffinity
    ) {}
}
