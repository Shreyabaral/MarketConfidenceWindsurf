package com.marketconfidence.controller;

import com.marketconfidence.model.ChatMessage;
import com.marketconfidence.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    
    private final ChatService chatService;
    
    @Autowired
    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }
    
    @PostMapping("/analyze")
    public ResponseEntity<ChatMessage> analyzeEvent(@RequestBody Map<String, String> request) {
        String eventDescription = request.get("message");
        
        if (eventDescription == null || eventDescription.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        // Create the user message and log it (would be stored in a database in a full implementation)
        ChatMessage userMessage = chatService.createUserMessage(eventDescription);
        logger.info("Received user message: {}", userMessage.getContent());
        
        try {
            // Get analysis from the chat service
            CompletableFuture<ChatMessage> future = chatService.analyzeEvent(eventDescription);
            ChatMessage response = future.get(15, TimeUnit.SECONDS); // Set a timeout
            
            return ResponseEntity.ok(response);
        } catch (InterruptedException | ExecutionException | TimeoutException e) {
            logger.error("Error analyzing event", e);
            
            // Create fallback response in case of error
            ChatMessage errorMessage = new ChatMessage();
            errorMessage.setContent("I'm sorry, I'm having trouble analyzing this event right now. Please try again later.");
            errorMessage.setSender("system");
            errorMessage.setType(ChatMessage.MessageType.SYSTEM);
            
            return ResponseEntity.ok(errorMessage);
        }
    }
}
