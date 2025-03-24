import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatAnalysisComponent } from './chat-analysis.component';

describe('ChatAnalysisComponent', () => {
  let component: ChatAnalysisComponent;
  let fixture: ComponentFixture<ChatAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatAnalysisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
