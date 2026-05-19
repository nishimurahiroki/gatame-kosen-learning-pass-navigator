package com.gatame.learningpass.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 診断スコアの係数・マッピング（application.yml の {@code gatame.scoring}）。
 * README §5 重み和方式に準拠。
 */
@ConfigurationProperties(prefix = "gatame.scoring")
public class GatameScoringProperties {

    private DimensionWeights novice = DimensionWeights.noviceDefaults();
    private DimensionWeights experienced = DimensionWeights.experiencedDefaults();
    private AffinityConfig affinity = new AffinityConfig();

    /** modules.json の Ukemi ID（完了判定・経験者レスポンス除外） */
    private String ukemiModuleId = "ukemi";

    /** modules.json の Throwing ID */
    private String throwingModuleId = "throwing";

    public DimensionWeights getNovice() {
        return novice;
    }

    public void setNovice(DimensionWeights novice) {
        this.novice = novice != null ? novice : DimensionWeights.noviceDefaults();
    }

    public DimensionWeights getExperienced() {
        return experienced;
    }

    public void setExperienced(DimensionWeights experienced) {
        this.experienced = experienced != null ? experienced : DimensionWeights.experiencedDefaults();
    }

    public AffinityConfig getAffinity() {
        return affinity;
    }

    public void setAffinity(AffinityConfig affinity) {
        this.affinity = affinity != null ? affinity : new AffinityConfig();
    }

    public String getUkemiModuleId() {
        return ukemiModuleId;
    }

    public void setUkemiModuleId(String ukemiModuleId) {
        this.ukemiModuleId = ukemiModuleId;
    }

    public String getThrowingModuleId() {
        return throwingModuleId;
    }

    public void setThrowingModuleId(String throwingModuleId) {
        this.throwingModuleId = throwingModuleId;
    }

    /** セグメント別の観点重み（合計 1.0） */
    public static class DimensionWeights {

        private double userAttribute;
        private double interest;
        private double aspiration;
        private double problem;
        private double prerequisiteReadiness;

        static DimensionWeights noviceDefaults() {
            DimensionWeights w = new DimensionWeights();
            w.userAttribute = 0.30;
            w.aspiration = 0.40;
            w.prerequisiteReadiness = 0.30;
            return w;
        }

        static DimensionWeights experiencedDefaults() {
            DimensionWeights w = new DimensionWeights();
            w.userAttribute = 0.15;
            w.interest = 0.20;
            w.problem = 0.45;
            w.prerequisiteReadiness = 0.20;
            return w;
        }

        public double getUserAttribute() {
            return userAttribute;
        }

        public void setUserAttribute(double userAttribute) {
            this.userAttribute = userAttribute;
        }

        public double getInterest() {
            return interest;
        }

        public void setInterest(double interest) {
            this.interest = interest;
        }

        public double getAspiration() {
            return aspiration;
        }

        public void setAspiration(double aspiration) {
            this.aspiration = aspiration;
        }

        public double getProblem() {
            return problem;
        }

        public void setProblem(double problem) {
            this.problem = problem;
        }

        public double getPrerequisiteReadiness() {
            return prerequisiteReadiness;
        }

        public void setPrerequisiteReadiness(double prerequisiteReadiness) {
            this.prerequisiteReadiness = prerequisiteReadiness;
        }
    }

    /** 観点 A/B/C/D の生アフィニティ（サービス層で 0〜1 に正規化） */
    public static class AffinityConfig {

        private Map<String, Map<String, Integer>> userAttribute = new HashMap<>();
        private InterestAffinity interest = new InterestAffinity();
        private Map<String, Map<String, Integer>> aspiration = new HashMap<>();
        private Map<String, List<String>> problem = new HashMap<>();

        public Map<String, Map<String, Integer>> getUserAttribute() {
            return userAttribute;
        }

        public void setUserAttribute(Map<String, Map<String, Integer>> userAttribute) {
            this.userAttribute = userAttribute != null ? userAttribute : new HashMap<>();
        }

        public InterestAffinity getInterest() {
            return interest;
        }

        public void setInterest(InterestAffinity interest) {
            this.interest = interest != null ? interest : new InterestAffinity();
        }

        public Map<String, Map<String, Integer>> getAspiration() {
            return aspiration;
        }

        public void setAspiration(Map<String, Map<String, Integer>> aspiration) {
            this.aspiration = aspiration != null ? aspiration : new HashMap<>();
        }

        public Map<String, List<String>> getProblem() {
            return problem;
        }

        public void setProblem(Map<String, List<String>> problem) {
            this.problem = problem != null ? problem : new HashMap<>();
        }
    }

    /** 観点 B：経験者の志向性（JUDO / BJJ）モジュール別生値 */
    public static class InterestAffinity {

        private Map<String, Integer> judo = new HashMap<>();
        private Map<String, Integer> bjj = new HashMap<>();

        public Map<String, Integer> getJudo() {
            return judo;
        }

        public void setJudo(Map<String, Integer> judo) {
            this.judo = judo != null ? judo : new HashMap<>();
        }

        public Map<String, Integer> getBjj() {
            return bjj;
        }

        public void setBjj(Map<String, Integer> bjj) {
            this.bjj = bjj != null ? bjj : new HashMap<>();
        }
    }
}
