import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewParameterEditorComponent } from './preview-parameter-editor.component';

describe('PreviewParameterEditorComponent', () => {
  let component: PreviewParameterEditorComponent;
  let fixture: ComponentFixture<PreviewParameterEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviewParameterEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewParameterEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
