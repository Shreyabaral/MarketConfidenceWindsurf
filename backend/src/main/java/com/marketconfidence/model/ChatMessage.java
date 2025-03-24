package com.marketconfidence.model;

import java.time.LocalDateTime;

public class ChatMessage {
    private String id;
    private String content;
    private String sender;
    private LocalDateTime timestamp;
    private MessageType type;

    public enum MessageType {
        USER, SYSTEM, AI
    }

    public ChatMessage() {
    }

    public ChatMessage(String id, String content, String sender, LocalDateTime timestamp, MessageType type) {
        this.id = id;
        this.content = content;
        this.sender = sender;
        this.timestamp = timestamp;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }
}
