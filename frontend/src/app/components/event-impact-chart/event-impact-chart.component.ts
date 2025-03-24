import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

export interface EventImpactData {
  event: string;
  dates: string[];
  values: number[];
  recoveryPoint?: number; // Index in the data array where recovery happens
  impactSeverity: number; // 1-10 where 10 is most severe
}

@Component({
  selector: 'app-event-impact-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-impact-chart.component.html',
  styleUrl: './event-impact-chart.component.css'
})
export class EventImpactChartComponent implements OnChanges {
  @Input() eventData: EventImpactData | null = null;
  @Input() height: string = '300px';
  
  private chart: Chart | null = null;
  
  constructor() {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventData'] && this.eventData) {
      this.renderChart();
    }
  }
  
  private renderChart(): void {
    if (!this.eventData || !this.eventData.dates || !this.eventData.values) {
      return;
    }
    
    // Get the canvas element
    const canvas = document.getElementById('eventImpactChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    // Destroy previous chart instance if it exists
    if (this.chart) {
      this.chart.destroy();
    }
    
    // Prepare datasets
    const datasets = [
      {
        label: this.eventData.event,
        data: this.eventData.values,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.3,
        fill: true
      }
    ];
    
    // Add annotations for recovery point if available
    let annotations: any = {};
    if (this.eventData.recoveryPoint !== undefined && this.eventData.recoveryPoint < this.eventData.dates.length) {
      const recoveryDate = this.eventData.dates[this.eventData.recoveryPoint];
      annotations.recoveryLine = {
        type: 'line',
        mode: 'vertical',
        scaleID: 'x',
        value: recoveryDate,
        borderColor: 'green',
        borderWidth: 2,
        label: {
          content: 'Recovery Point',
          enabled: true,
          position: 'top'
        }
      };
    }
    
    // Create the chart
    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.eventData.dates,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Impact of ${this.eventData.event} on MSCI World Index`,
            font: {
              size: 16
            }
          },
          subtitle: {
            display: true,
            text: `Impact Severity: ${this.eventData.impactSeverity}/10`,
            font: {
              size: 14
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: 'MSCI World Index Value'
            }
          }
        }
      }
    });
  }
}
