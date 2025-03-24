package com.marketconfidence.service;

import com.marketconfidence.model.ChatMessage;
import com.marketconfidence.model.MarketAnalysis;
import org.asynchttpclient.AsyncHttpClient;
import org.asynchttpclient.DefaultAsyncHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class ChatService {
    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);
    // These would be used when integrating with the actual Hugging Face API
    // private static final String HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/deepseek-ai/deepseek-chat";
 
    
    public ChatMessage createUserMessage(String content) {
        return new ChatMessage(
            UUID.randomUUID().toString(),
            content,
            "user",
            LocalDateTime.now(),
            ChatMessage.MessageType.USER
        );
    }
    
    public CompletableFuture<ChatMessage> analyzeEvent(String eventDescription) {
        AsyncHttpClient client = new DefaultAsyncHttpClient();
        CompletableFuture<ChatMessage> result = new CompletableFuture<>();
        
        try {
            // For development purposes, we'll return a mock response
            // In production, uncomment the client code to use DeepSeek LLM API via Hugging Face
            // String prompt = createDeepSeekPrompt(eventDescription);
            
            // Mock response for development
            ChatMessage response = createMockLLMResponse(eventDescription);
            result.complete(response);
            
            /* Uncomment for actual API call
            String requestBody = objectMapper.writeValueAsString(Map.of(
                "inputs", prompt,
                "parameters", Map.of(
                    "max_length", 1000,
                    "temperature", 0.7,
                    "return_full_text", false
                )
            ));
            
            client.prepare("POST", HUGGINGFACE_API_URL)
                .setHeader("Content-Type", "application/json")
                .setHeader("Authorization", "Bearer " + HUGGINGFACE_API_KEY)
                .setBody(requestBody)
                .execute()
                .toCompletableFuture()
                .thenAccept(response -> {
                    try {
                        String responseBody = response.getResponseBody();
                        JsonNode rootNode = objectMapper.readTree(responseBody);
                        String content = rootNode.get("choices").get(0).get("message").get("content").asText();
                        
                        ChatMessage aiMessage = new ChatMessage(
                            UUID.randomUUID().toString(),
                            content,
                            "ai",
                            LocalDateTime.now(),
                            ChatMessage.MessageType.AI
                        );
                        
                        result.complete(aiMessage);
                    } catch (Exception e) {
                        logger.error("Error parsing DeepSeek LLM response", e);
                        result.completeExceptionally(e);
                    }
                })
                .exceptionally(e -> {
                    logger.error("Error getting response from DeepSeek LLM", e);
                    result.completeExceptionally(e);
                    return null;
                });
            */
            
        } catch (Exception e) {
            logger.error("Error processing event analysis", e);
            result.completeExceptionally(e);
        } finally {
            // Close the client when the future completes
            result.whenComplete((message, throwable) -> {
                try {
                    client.close();
                } catch (Exception e) {
                    logger.error("Error closing AsyncHttpClient", e);
                }
            });
        }
        
        return result;
    }
    
    // This method will be used when the actual Hugging Face API integration is enabled
    /*
    private String createDeepSeekPrompt(String eventDescription) {
        return "Analyze the following global event and provide a detailed market impact analysis:\n\n" +
               "Event: " + eventDescription + "\n\n" +
               "Please include the following in your analysis:\n" +
               "1. Brief summary of the event\n" +
               "2. Potential impact on global markets, especially the MSCI World Index\n" +
               "3. Confidence score (1-10) of your market impact prediction\n" +
               "4. Estimated market recovery time if negative impact\n" +
               "5. Recommendations for investors";
    }
    */
    
    private ChatMessage createMockLLMResponse(String eventDescription) {
        // Generate a relevant market analysis based on the event
        MarketAnalysis analysis = analyzeMockEvent(eventDescription);
        
        // Add historical market data for visualization
        addHistoricalMarketData(analysis, eventDescription);
        
        // Format text response
        String formattedResponse = formatAnalysisResponse(analysis, eventDescription);
        
        // Create a JSON response that includes both the text and the visualization data
        String jsonResponse = String.format("{\"textResponse\":\"%s\", \"marketData\":{\"event\":\"%s\", \"impactDates\":%s, \"impactValues\":%s, \"recoveryPointIndex\":%d, \"impactSeverity\":%.1f}}", 
            formattedResponse.replace("\"", "\\\"").replace("\n", "\\n"), 
            analysis.getEvent(),
            analysis.getImpactDates() != null ? analysis.getImpactDates().toString() : "[]",
            analysis.getImpactValues() != null ? analysis.getImpactValues().toString() : "[]",
            analysis.getRecoveryPointIndex() != null ? analysis.getRecoveryPointIndex() : -1,
            analysis.getConfidenceScore());
        
        return new ChatMessage(
            UUID.randomUUID().toString(),
            jsonResponse,
            "DeepSeek LLM",
            LocalDateTime.now(),
            ChatMessage.MessageType.AI
        );
    }
    
    private MarketAnalysis analyzeMockEvent(String eventDescription) {
        String lowercaseEvent = eventDescription.toLowerCase();
        
        // Simple event categorization based on keywords
        double confidenceScore = 7.0;
        String impact = "Neutral";
        String recoveryTime = "N/A";
        List<String> recommendations = new ArrayList<>();
        
        if (lowercaseEvent.contains("recession") || lowercaseEvent.contains("crash") || 
            lowercaseEvent.contains("crisis") || lowercaseEvent.contains("collapse")) {
            impact = "Highly Negative";
            confidenceScore = 8.5;
            recoveryTime = "6-12 months";
            recommendations.addAll(Arrays.asList(
                "Consider defensive assets like utilities and consumer staples",
                "Maintain higher cash positions",
                "Look for discounted quality assets for long-term investment"
            ));
        } else if (lowercaseEvent.contains("inflation") || lowercaseEvent.contains("interest rate") || 
                   lowercaseEvent.contains("hike") || lowercaseEvent.contains("federal reserve")) {
            impact = "Moderately Negative";
            confidenceScore = 7.5;
            recoveryTime = "3-6 months";
            recommendations.addAll(Arrays.asList(
                "Focus on companies with pricing power",
                "Consider value over growth stocks",
                "Explore TIPS and other inflation-protected securities"
            ));
        } else if (lowercaseEvent.contains("pandemic") || lowercaseEvent.contains("covid") || 
                   lowercaseEvent.contains("outbreak") || lowercaseEvent.contains("virus")) {
            impact = "Severely Negative";
            confidenceScore = 9.0;
            recoveryTime = "12-24 months";
            recommendations.addAll(Arrays.asList(
                "Invest in healthcare and digital transformation companies",
                "Reduce exposure to travel and hospitality sectors",
                "Consider gold and other safe-haven assets"
            ));
        } else if (lowercaseEvent.contains("growth") || lowercaseEvent.contains("recovery") || 
                   lowercaseEvent.contains("stimulus") || lowercaseEvent.contains("expansion")) {
            impact = "Positive";
            confidenceScore = 7.5;
            recoveryTime = "N/A";
            recommendations.addAll(Arrays.asList(
                "Increase exposure to cyclical stocks",
                "Consider small-cap companies with growth potential",
                "Reduce allocation to defensive sectors"
            ));
        } else if (lowercaseEvent.contains("innovation") || lowercaseEvent.contains("technology") || 
                   lowercaseEvent.contains("advancement") || lowercaseEvent.contains("breakthrough")) {
            impact = "Highly Positive";
            confidenceScore = 8.0;
            recoveryTime = "N/A";
            recommendations.addAll(Arrays.asList(
                "Invest in relevant technology sectors",
                "Look for companies implementing the innovation",
                "Consider thematic ETFs related to the technological advancement"
            ));
        }
        
        return new MarketAnalysis(eventDescription, impact, confidenceScore, recoveryTime, recommendations);
    }
    
    private String formatAnalysisResponse(MarketAnalysis analysis, String eventDescription) {
        StringBuilder response = new StringBuilder();
        
        response.append("# Market Impact Analysis\n\n");
        response.append("## Event Summary\n");
        response.append(summarizeEvent(eventDescription)).append("\n\n");
        
        response.append("## Market Impact\n");
        response.append("**Impact Assessment**: ").append(analysis.getImpact()).append("\n\n");
        response.append("Based on historical patterns and current market conditions, this event is likely to have a ");
        response.append(analysis.getImpact().toLowerCase()).append(" impact on global markets, particularly the MSCI World Index.\n\n");
        
        response.append("## Confidence Assessment\n");
        response.append("**Confidence Score**: ").append(analysis.getConfidenceScore()).append("/10\n\n");
        
        if (!analysis.getRecoveryTime().equals("N/A")) {
            response.append("## Recovery Time Estimate\n");
            response.append("If markets react negatively, the estimated recovery time is approximately **");
            response.append(analysis.getRecoveryTime()).append("**.\n\n");
        }
        
        response.append("## Recommendations\n");
        for (String recommendation : analysis.getRecommendations()) {
            response.append("- ").append(recommendation).append("\n");
        }
        
        response.append("\n\n**A chart visualization of this event's market impact is available in the analysis panel.**");
        
        return response.toString();
    }
    
    private String summarizeEvent(String eventDescription) {
        // In a real implementation, this would use the LLM to generate a summary
        // For now, we'll just return the original description
        return "The event described involves " + eventDescription;
    }
    
    /**
     * Adds historical market data to the analysis for visualization
     * This is mock data that simulates how various global events affected markets
     */
    private void addHistoricalMarketData(MarketAnalysis analysis, String eventDescription) {
        String lowercaseEvent = eventDescription.toLowerCase();
        List<String> dates = new ArrayList<>();
        List<Double> values = new ArrayList<>();
        Integer recoveryPointIndex = null;
        
        // COVID-19 Pandemic data (approximated)
        if (lowercaseEvent.contains("pandemic") || lowercaseEvent.contains("covid") || 
            lowercaseEvent.contains("virus") || lowercaseEvent.contains("outbreak")) {
            
            // Pre-pandemic levels
            dates.add("2019-12-01"); values.add(2358.47);
            dates.add("2020-01-01"); values.add(2358.87);
            dates.add("2020-02-01"); values.add(2378.05);
            
            // Initial drop
            dates.add("2020-02-15"); values.add(2337.15);
            dates.add("2020-03-01"); values.add(2107.64);
            dates.add("2020-03-15"); values.add(1785.93);
            dates.add("2020-03-23"); values.add(1602.11); // Bottom
            
            // Recovery
            dates.add("2020-04-01"); values.add(1848.33);
            dates.add("2020-05-01"); values.add(2014.28);
            dates.add("2020-06-01"); values.add(2148.03);
            dates.add("2020-07-01"); values.add(2227.51);
            dates.add("2020-08-01"); values.add(2344.02);
            dates.add("2020-09-01"); values.add(2367.27); // Recovery point
            recoveryPointIndex = 12;
            
            // Post-recovery
            dates.add("2020-10-01"); values.add(2378.00);
            dates.add("2020-11-01"); values.add(2587.12);
            dates.add("2020-12-01"); values.add(2696.37);
            dates.add("2021-01-01"); values.add(2751.96);
            
        // Dot-com bubble
        } else if (lowercaseEvent.contains("bubble") || lowercaseEvent.contains("dot com") || 
                  lowercaseEvent.contains("dotcom") || lowercaseEvent.contains("tech crash")) {
            
            // Pre-crash levels
            dates.add("1999-01-01"); values.add(1263.84);
            dates.add("1999-04-01"); values.add(1365.29);
            dates.add("1999-07-01"); values.add(1410.17);
            dates.add("1999-10-01"); values.add(1471.51);
            dates.add("2000-01-01"); values.add(1543.87); // Peak
            
            // Crash
            dates.add("2000-04-01"); values.add(1452.43);
            dates.add("2000-07-01"); values.add(1430.83);
            dates.add("2000-10-01"); values.add(1314.74);
            dates.add("2001-01-01"); values.add(1241.59);
            dates.add("2001-04-01"); values.add(1181.54);
            dates.add("2001-07-01"); values.add(1106.67);
            dates.add("2001-10-01"); values.add(1076.55);
            dates.add("2002-01-01"); values.add(1083.24);
            dates.add("2002-04-01"); values.add(1041.03);
            dates.add("2002-07-01"); values.add(929.37);
            dates.add("2002-10-01"); values.add(883.16); // Bottom
            
            // Recovery
            dates.add("2003-01-01"); values.add(897.84);
            dates.add("2003-04-01"); values.add(989.51);
            dates.add("2003-07-01"); values.add(1079.73);
            dates.add("2003-10-01"); values.add(1165.39);
            dates.add("2004-01-01"); values.add(1236.17);
            dates.add("2004-04-01"); values.add(1233.94);
            dates.add("2004-07-01"); values.add(1212.33);
            dates.add("2004-10-01"); values.add(1280.42);
            dates.add("2005-01-01"); values.add(1294.78);
            dates.add("2005-04-01"); values.add(1321.25);
            dates.add("2005-07-01"); values.add(1385.59);
            dates.add("2005-10-01"); values.add(1399.85);
            dates.add("2006-01-01"); values.add(1455.07);
            dates.add("2006-04-01"); values.add(1517.82);
            dates.add("2006-07-01"); values.add(1548.12); // Recovery point
            recoveryPointIndex = 31;
            
        // Housing crisis / Global financial crisis 2008
        } else if (lowercaseEvent.contains("housing") || lowercaseEvent.contains("financial crisis") || 
                   lowercaseEvent.contains("subprime") || lowercaseEvent.contains("recession") ||
                   lowercaseEvent.contains("2008")) {
                   
            // Pre-crisis levels
            dates.add("2007-01-01"); values.add(1682.36);
            dates.add("2007-04-01"); values.add(1771.04);
            dates.add("2007-07-01"); values.add(1767.68);
            dates.add("2007-10-01"); values.add(1750.20); // Start of decline
            
            // Crisis
            dates.add("2008-01-01"); values.add(1614.35);
            dates.add("2008-04-01"); values.add(1588.96);
            dates.add("2008-07-01"); values.add(1434.06);
            dates.add("2008-10-01"); values.add(1098.34);
            dates.add("2009-01-01"); values.add(918.85);
            dates.add("2009-03-09"); values.add(812.67); // Bottom
            
            // Recovery
            dates.add("2009-04-01"); values.add(973.33);
            dates.add("2009-07-01"); values.add(1104.32);
            dates.add("2009-10-01"); values.add(1168.89);
            dates.add("2010-01-01"); values.add(1164.60);
            dates.add("2010-04-01"); values.add(1143.45);
            dates.add("2010-07-01"); values.add(1199.01);
            dates.add("2010-10-01"); values.add(1305.32);
            dates.add("2011-01-01"); values.add(1361.58);
            dates.add("2011-04-01"); values.add(1362.57);
            dates.add("2011-07-01"); values.add(1253.00);
            dates.add("2011-10-01"); values.add(1317.99);
            dates.add("2012-01-01"); values.add(1392.13);
            dates.add("2012-04-01"); values.add(1365.99);
            dates.add("2012-07-01"); values.add(1441.75);
            dates.add("2012-10-01"); values.add(1466.43);
            dates.add("2013-01-01"); values.add(1599.32);
            dates.add("2013-04-01"); values.add(1642.21);
            dates.add("2013-07-01"); values.add(1730.86);
            dates.add("2013-10-01"); values.add(1802.99); // Recovery point
            recoveryPointIndex = 29;
            
        // Generic global event (for any other queries)
        } else {
            // Default data that shows a moderate dip and recovery
            dates.add("2022-01-01"); values.add(3000.0);
            dates.add("2022-02-01"); values.add(3050.0);
            dates.add("2022-03-01"); values.add(3100.0);
            dates.add("2022-04-01"); values.add(3000.0);
            dates.add("2022-05-01"); values.add(2800.0); // Event impact
            dates.add("2022-06-01"); values.add(2600.0);
            dates.add("2022-07-01"); values.add(2700.0);
            dates.add("2022-08-01"); values.add(2850.0);
            dates.add("2022-09-01"); values.add(2950.0);
            dates.add("2022-10-01"); values.add(3050.0); // Recovery
            dates.add("2022-11-01"); values.add(3100.0);
            dates.add("2022-12-01"); values.add(3150.0);
            recoveryPointIndex = 9;
        }
        
        // Set the data on the analysis object
        analysis.setImpactDates(dates);
        analysis.setImpactValues(values);
        analysis.setRecoveryPointIndex(recoveryPointIndex);
    }
}
