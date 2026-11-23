package vn.edu.fit.yitzone.chatbot.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Monthly AI token and cost budget ledger for circuit breaker enforcement (UC-BOT-03, NFR-AI-BUDGET-01).
 */
@Document(collection = "AI_USAGE_LEDGER")
@CompoundIndex(name = "idx_ai_usage_month_user_created", def = "{'monthKey': 1, 'userId': 1, 'createdAt': -1}")
public class AiUsageLedger {
    @Id
    private String id;

    private String monthKey; // YYYY-MM
    private String userId;   // Nullable after 90-day retention anonymization
    private FeatureType featureType;
    private String provider; // GEMINI | OPENAI_COMPATIBLE | OLLAMA
    private String modelName;
    private int promptTokens;
    private int completionTokens;
    private double estimatedCostUsd;

    @Indexed
    private Instant createdAt = Instant.now();

    public enum FeatureType {
        YITBOT_CHAT, SURVEY_SUMMARY, PORTFOLIO_CV_ASSIST
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getMonthKey() { return monthKey; }
    public void setMonthKey(String monthKey) { this.monthKey = monthKey; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public FeatureType getFeatureType() { return featureType; }
    public void setFeatureType(FeatureType featureType) { this.featureType = featureType; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }
    public int getPromptTokens() { return promptTokens; }
    public void setPromptTokens(int promptTokens) { this.promptTokens = promptTokens; }
    public int getCompletionTokens() { return completionTokens; }
    public void setCompletionTokens(int completionTokens) { this.completionTokens = completionTokens; }
    public double getEstimatedCostUsd() { return estimatedCostUsd; }
    public void setEstimatedCostUsd(double estimatedCostUsd) { this.estimatedCostUsd = estimatedCostUsd; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
