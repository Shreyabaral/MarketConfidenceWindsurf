import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventImpactChartComponent } from './event-impact-chart.component';

describe('EventImpactChartComponent', () => {
  let component: EventImpactChartComponent;
  let fixture: ComponentFixture<EventImpactChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventImpactChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventImpactChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
