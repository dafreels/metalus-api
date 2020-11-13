import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScalaScriptComponent } from './scala-script.component';

describe('ScalaScrpitComponent', () => {
  let component: ScalaScriptComponent;
  let fixture: ComponentFixture<ScalaScriptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScalaScriptComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScalaScriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
