import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { EventImpactChartComponent, EventImpactData } from '../event-impact-chart/event-impact-chart.component';

@Component({
  selector: 'app-chat-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, EventImpactChartComponent],
  templateUrl: './chat-analysis.component.html',
  styleUrl: './chat-analysis.component.css'
})
export class ChatAnalysisComponent implements OnInit {
  messages: ChatMessage[] = [];
  newMessage = '';
  isLoading = false;
  eventImpactData: EventImpactData | null = null;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.getMessages().subscribe(messages => {
      this.messages = messages;
    });
  }

  sendMessage(): void {
    if (this.newMessage.trim() === '') return;
    
    this.isLoading = true;
    const userInput = this.newMessage;
    this.chatService.addUserMessage(this.newMessage);
    this.newMessage = '';
    
    // Call the service to analyze the event impact
    this.chatService.analyzeEventImpact(userInput).subscribe({
      next: (response) => {
        try {
          // Parse the JSON response
          let parsedResponse: any;
          if (typeof response === 'string') {
            parsedResponse = JSON.parse(response);
          } else {
            parsedResponse = response;
          }
          
          // Extract market data for visualization if available
          if (parsedResponse && parsedResponse.marketData) {
            const marketData = parsedResponse.marketData;
            this.eventImpactData = {
              event: marketData.event,
              dates: marketData.impactDates,
              values: marketData.impactValues,
              recoveryPoint: marketData.recoveryPointIndex >= 0 ? marketData.recoveryPointIndex : undefined,
              impactSeverity: marketData.impactSeverity
            };
          }
        } catch (e) {
          console.error('Error parsing response:', e);
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error analyzing event:', error);
        this.isLoading = false;
      }
    });
  }

  // Format the message content with Markdown-like syntax
  formatMessage(content: string): string {
    if (!content) return '';
    
    // Section headers
    let formatted = content.replace(/^## (.*?)$/gm, '<h3 class="text-lg font-semibold mt-2 mb-1">$1</h3>');
    formatted = formatted.replace(/^# (.*?)$/gm, '<h2 class="text-xl font-bold mt-3 mb-2">$1</h2>');
    
    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Lists
    formatted = formatted.replace(/^- (.*)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc pl-5 my-2">$1</ul>');
    
    // Line breaks
    formatted = formatted.replace(/\n\n/g, '<p class="my-2"></p>');
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }
}
