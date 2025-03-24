import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface BackendChatMessage {
  id?: string;
  content: string;
  sender: string;
  timestamp: string;
  type: 'USER' | 'SYSTEM' | 'AI';
}

export interface MarketAnalysis {
  event: string;
  impact: string;
  confidenceScore: number;
  recoveryTime: string;
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8083/api';
  private messageHistory = new BehaviorSubject<ChatMessage[]>([]);
  
  constructor(private http: HttpClient) { }
  
  // Get message history as observable
  getMessages(): Observable<ChatMessage[]> {
    return this.messageHistory.asObservable();
  }
  
  // Add a new user message
  addUserMessage(content: string) {
    const newMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    const currentMessages = this.messageHistory.getValue();
    this.messageHistory.next([...currentMessages, newMessage]);
    
    // Send message to backend for analysis
    this.analyzeEventImpact(content).subscribe({
      next: (analysis) => {
        // The assistant message is already added in the analyzeEventImpact method
        console.log('Analysis received:', analysis);
      },
      error: (error) => {
        console.error('Error analyzing event:', error);
        this.addAssistantMessage('Sorry, there was an error analyzing your message. Please try again later.');
      }
    });
  }
  
  // Add assistant response
  private addAssistantMessage(content: string) {
    const newMessage: ChatMessage = {
      role: 'assistant',
      content,
      timestamp: new Date()
    };
    
    const currentMessages = this.messageHistory.getValue();
    this.messageHistory.next([...currentMessages, newMessage]);
  }
  
  // Analyze the impact of a global event on markets using DeepSeek LLM
  analyzeEventImpact(event: string): Observable<any> {
    return this.http.post<BackendChatMessage>(`${this.apiUrl}/chat/analyze`, { message: event })
      .pipe(
        map((response: BackendChatMessage) => {
          // Convert the backend message to our frontend format
          if (response && response.content) {
            this.addAssistantMessage(response.content);
          }
          
          return response;
        })
      );
  }
  
  // Format the analysis response into a readable message
  private formatAnalysisResponse(analysis: MarketAnalysis): string {
    let response = `**Analysis of "${analysis.event}"**\n\n`;
    response += `**Market Impact:** ${analysis.impact}\n\n`;
    response += `**Confidence Score:** ${analysis.confidenceScore.toFixed(2)}/10\n\n`;
    response += `**Estimated Recovery Time:** ${analysis.recoveryTime}\n\n`;
    response += '**Recommendations:**\n';
    analysis.recommendations.forEach(rec => {
      response += `- ${rec}\n`;
    });
    
    return response;
  }
}
