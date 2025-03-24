package com.marketconfidence.controller;

import com.marketconfidence.model.MarketData;
import com.marketconfidence.service.MarketDataService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@RestController
@RequestMapping("/api/market-data")
public class MarketDataController {
    private static final Logger logger = LoggerFactory.getLogger(MarketDataController.class);
    
    private final MarketDataService marketDataService;
    
    @Autowired
    public MarketDataController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }
    
    @GetMapping("/msci-world")
    public ResponseEntity<List<MarketData>> getMSCIWorldData() {
        try {
            CompletableFuture<List<MarketData>> future = marketDataService.getMSCIWorldIndexData();
            List<MarketData> marketData = future.get(10, TimeUnit.SECONDS); // Set a timeout for the API call
            
            if (marketData == null || marketData.isEmpty()) {
                logger.warn("No market data available from API, falling back to mock data");
                marketData = marketDataService.getMockMSCIWorldIndexData();
            }
            
            return ResponseEntity.ok(marketData);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            logger.error("Error retrieving market data from Yahoo Finance API", e);
            // Fallback to mock data if API fails
            List<MarketData> mockData = marketDataService.getMockMSCIWorldIndexData();
            return ResponseEntity.ok(mockData);
        }
    }
}
