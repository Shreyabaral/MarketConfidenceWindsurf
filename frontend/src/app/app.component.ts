import { Component } from '@angular/core';
import { MarketDataComponent } from './components/market-data/market-data.component';
import { ChatAnalysisComponent } from './components/chat-analysis/chat-analysis.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MarketDataComponent,
    ChatAnalysisComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
}
