import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExecutionSelectorComponent } from './execution-selector.component';

describe('ExecutionSelectorComponent', () => {
  let component: ExecutionSelectorComponent;
  let fixture: ComponentFixture<ExecutionSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExecutionSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExecutionSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
