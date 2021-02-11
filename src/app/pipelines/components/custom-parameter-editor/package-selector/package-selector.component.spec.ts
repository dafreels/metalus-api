import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageSelectorComponent } from './package-selector.component';

describe('PackageSelectorComponent', () => {
  let component: PackageSelectorComponent;
  let fixture: ComponentFixture<PackageSelectorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PackageSelectorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PackageSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
