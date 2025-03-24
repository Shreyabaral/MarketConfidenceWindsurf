import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketDataService, MarketData } from '../../services/market-data.service';

@Component({
  selector: 'app-market-data',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './market-data.component.html',
  styleUrl: './market-data.component.css'
})
export class MarketDataComponent implements OnInit {
  marketData: MarketData[] = [];
  loading = true;
  error = false;
  currentPrice = 0;
  previousClose = 0;
  priceChange = 0;
  percentChange = 0;

  constructor(private marketDataService: MarketDataService) {}

  ngOnInit(): void {
    this.loadMarketData();
  }

  loadMarketData(): void {
    this.loading = true;
    this.error = false;
    
    this.marketDataService.getMSCIWorldIndexData().subscribe({
      next: (data) => {
        this.marketData = data;
        this.loading = false;
        if (data.length > 0) {
          this.calculateMetrics(data);
        }
      },
      error: (err) => {
        console.error('Error fetching market data', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  private calculateMetrics(data: MarketData[]): void {
    // Sort data by date (newest first)
    const sortedData = [...data].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    if (sortedData.length >= 2) {
      this.currentPrice = sortedData[0].close;
      this.previousClose = sortedData[1].close;
      this.priceChange = this.currentPrice - this.previousClose;
      this.percentChange = (this.priceChange / this.previousClose) * 100;
    }
  }

  refreshData(): void {
    this.loadMarketData();
  }
}
