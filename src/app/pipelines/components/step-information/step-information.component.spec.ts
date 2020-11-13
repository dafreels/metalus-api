import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StepInformationComponent } from './step-information.component';

describe('StepInformationComponent', () => {
  let component: StepInformationComponent;
  let fixture: ComponentFixture<StepInformationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StepInformationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StepInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
