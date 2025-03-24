package com.marketconfidence.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketconfidence.model.MarketData;
import org.asynchttpclient.AsyncHttpClient;
import org.asynchttpclient.DefaultAsyncHttpClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class MarketDataService {
    private static final Logger logger = LoggerFactory.getLogger(MarketDataService.class);
    private static final String MSCI_WORLD_SYMBOL = "URTH"; // MSCI World Index ETF
    private static final String API_KEY = "646b6a0257msh501383d2209ca48p13f25cjsnbaef277d0403";
    private static final String API_HOST = "apidojo-yahoo-finance-v1.p.rapidapi.com";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public CompletableFuture<List<MarketData>> getMSCIWorldIndexData() {
        AsyncHttpClient client = new DefaultAsyncHttpClient();
        CompletableFuture<List<MarketData>> result = new CompletableFuture<>();
        
        try {
            client.prepare("GET", "https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-timeseries?symbol=" + MSCI_WORLD_SYMBOL + "&region=US")
                    .setHeader("x-rapidapi-key", API_KEY)
                    .setHeader("x-rapidapi-host", API_HOST)
                    .execute()
                    .toCompletableFuture()
                    .thenAccept(response -> {
                        try {
                            String responseBody = response.getResponseBody();
                            List<MarketData> marketDataList = parseYahooFinanceResponse(responseBody);
                            result.complete(marketDataList);
                        } catch (Exception e) {
                            logger.error("Error parsing Yahoo Finance response", e);
                            result.completeExceptionally(e);
                        }
                    })
                    .exceptionally(e -> {
                        logger.error("Error fetching data from Yahoo Finance", e);
                        result.completeExceptionally(e);
                        return null;
                    });
        } catch (Exception e) {
            logger.error("Error creating Yahoo Finance request", e);
            result.completeExceptionally(e);
        } finally {
            // Close the client when the future completes
            result.whenComplete((data, throwable) -> {
                try {
                    client.close();
                } catch (Exception e) {
                    logger.error("Error closing AsyncHttpClient", e);
                }
            });
        }
        
        return result;
    }
    
    private List<MarketData> parseYahooFinanceResponse(String responseBody) throws Exception {
        List<MarketData> marketDataList = new ArrayList<>();
        JsonNode rootNode = objectMapper.readTree(responseBody);
        
        if (!rootNode.has("chart") || !rootNode.get("chart").has("result") || 
            rootNode.get("chart").get("result").isEmpty()) {
            throw new RuntimeException("Invalid response format from Yahoo Finance API");
        }
        
        JsonNode result = rootNode.get("chart").get("result").get(0);
        JsonNode timestamps = result.get("timestamp");
        JsonNode indicators = result.get("indicators");
        JsonNode quote = indicators.get("quote").get(0);
        
        JsonNode opens = quote.get("open");
        JsonNode highs = quote.get("high");
        JsonNode lows = quote.get("low");
        JsonNode closes = quote.get("close");
        JsonNode volumes = quote.get("volume");
        
        for (int i = 0; i < timestamps.size(); i++) {
            if (opens.get(i).isNull() || highs.get(i).isNull() || lows.get(i).isNull() || 
                closes.get(i).isNull() || volumes.get(i).isNull()) {
                continue;
            }
            
            // Convert timestamp to LocalDate
            long timestamp = timestamps.get(i).asLong() * 1000; // Convert to milliseconds
            LocalDate date = LocalDate.ofEpochDay(timestamp / (24 * 60 * 60 * 1000));
            
            MarketData marketData = new MarketData(
                date,
                opens.get(i).asDouble(),
                highs.get(i).asDouble(),
                lows.get(i).asDouble(),
                closes.get(i).asDouble(),
                volumes.get(i).asLong()
            );
            
            marketDataList.add(marketData);
        }
        
        return marketDataList;
    }
    
    // Fallback method with mock data in case the API has issues
    public List<MarketData> getMockMSCIWorldIndexData() {
        List<MarketData> mockData = new ArrayList<>();
        
        // No need for formatter since we're using LocalDate directly
        LocalDate baseDate = LocalDate.now().minusDays(30);
        
        double basePrice = 2800.0;
        long baseVolume = 1000000;
        
        for (int i = 0; i < 30; i++) {
            LocalDate date = baseDate.plusDays(i);
            double volatility = Math.random() * 0.02 - 0.01; // -1% to +1%
            double open = basePrice * (1 + volatility);
            double close = open * (1 + (Math.random() * 0.02 - 0.01));
            double high = Math.max(open, close) * (1 + Math.random() * 0.01);
            double low = Math.min(open, close) * (1 - Math.random() * 0.01);
            long volume = baseVolume + (long)(Math.random() * baseVolume * 0.5);
            
            mockData.add(new MarketData(date, open, high, low, close, volume));
            
            basePrice = close; // For the next day
        }
        
        return mockData;
    }
}
