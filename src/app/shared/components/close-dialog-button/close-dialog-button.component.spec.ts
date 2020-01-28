import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseDialogButtonComponent } from './close-dialog-button.component';

describe('CloseDialogButtonComponent', () => {
  let component: CloseDialogButtonComponent;
  let fixture: ComponentFixture<CloseDialogButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloseDialogButtonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloseDialogButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
