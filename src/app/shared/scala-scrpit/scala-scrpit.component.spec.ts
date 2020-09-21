import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScalaScrpitComponent } from './scala-scrpit.component';

describe('ScalaScrpitComponent', () => {
  let component: ScalaScrpitComponent;
  let fixture: ComponentFixture<ScalaScrpitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScalaScrpitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalaScrpitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
