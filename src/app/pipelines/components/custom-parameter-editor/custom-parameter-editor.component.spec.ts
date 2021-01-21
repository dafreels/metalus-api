import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomParameterEditorComponent } from './custom-parameter-editor.component';

describe('CustomParameterEditorComponent', () => {
  let component: CustomParameterEditorComponent;
  let fixture: ComponentFixture<CustomParameterEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomParameterEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomParameterEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
