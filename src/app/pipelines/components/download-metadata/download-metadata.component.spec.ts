import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadMetadataComponent } from './download-metadata.component';

describe('DownloadMetadataComponent', () => {
  let component: DownloadMetadataComponent;
  let fixture: ComponentFixture<DownloadMetadataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DownloadMetadataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
