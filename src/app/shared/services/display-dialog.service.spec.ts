import { TestBed } from '@angular/core/testing';

import { DisplayDialogService } from './display-dialog.service';

describe('DisplayDialogService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DisplayDialogService = TestBed.get(DisplayDialogService);
    expect(service).toBeTruthy();
  });
});
