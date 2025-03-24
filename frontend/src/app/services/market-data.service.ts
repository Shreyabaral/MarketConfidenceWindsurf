import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MarketData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketConfidence {
  confidence: number;
  recoveryTime: number;
  analysis: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarketDataService {
  private apiUrl = 'http://localhost:8083/api';
  
  constructor(private http: HttpClient) { }
  
  // Fetch MSCI World Index data
  getMSCIWorldIndexData(): Observable<MarketData[]> {
    return this.http.get<MarketData[]>(`${this.apiUrl}/market-data/msci-world`);
  }
  
  // Get market confidence based on event analysis
  getMarketConfidence(event: string): Observable<MarketConfidence> {
    return this.http.post<MarketConfidence>(`${this.apiUrl}/analysis/confidence`, { event });
  }
  
  // Get market recovery time estimation
  getRecoveryTimeEstimation(event: string): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/analysis/recovery-time`, { event });
  }
}
