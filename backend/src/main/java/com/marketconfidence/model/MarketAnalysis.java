package com.marketconfidence.model;

import java.util.List;
import java.util.Map;

public class MarketAnalysis {
    private String event;
    private String impact;
    private double confidenceScore;
    private String recoveryTime;
    private List<String> recommendations;
    
    // New fields for historical impact visualization
    private List<String> impactDates;
    private List<Double> impactValues;
    private Integer recoveryPointIndex; // Index in the arrays where recovery happens
    private Map<String, Object> additionalData; // For any extra data we might need

    public MarketAnalysis() {
    }

    public MarketAnalysis(String event, String impact, double confidenceScore, String recoveryTime, List<String> recommendations) {
        this.event = event;
        this.impact = impact;
        this.confidenceScore = confidenceScore;
        this.recoveryTime = recoveryTime;
        this.recommendations = recommendations;
    }

    public String getEvent() {
        return event;
    }

    public void setEvent(String event) {
        this.event = event;
    }

    public String getImpact() {
        return impact;
    }

    public void setImpact(String impact) {
        this.impact = impact;
    }

    public double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getRecoveryTime() {
        return recoveryTime;
    }

    public void setRecoveryTime(String recoveryTime) {
        this.recoveryTime = recoveryTime;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }
    
    public List<String> getImpactDates() {
        return impactDates;
    }

    public void setImpactDates(List<String> impactDates) {
        this.impactDates = impactDates;
    }

    public List<Double> getImpactValues() {
        return impactValues;
    }

    public void setImpactValues(List<Double> impactValues) {
        this.impactValues = impactValues;
    }

    public Integer getRecoveryPointIndex() {
        return recoveryPointIndex;
    }

    public void setRecoveryPointIndex(Integer recoveryPointIndex) {
        this.recoveryPointIndex = recoveryPointIndex;
    }

    public Map<String, Object> getAdditionalData() {
        return additionalData;
    }

    public void setAdditionalData(Map<String, Object> additionalData) {
        this.additionalData = additionalData;
    }
}
