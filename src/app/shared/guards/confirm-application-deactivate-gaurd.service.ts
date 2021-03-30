import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { PipelinesEditorComponent } from '../../pipelines/components/pipelines-editor/pipelines-editor.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../components/confirmation/confirmation-modal.component';
import {ApplicationsEditorComponent} from "../../applications/components/applications-editor/applications-editor.component";

@Injectable()
export class ConfirmApplicationDeactivateGuard implements CanDeactivate<ApplicationsEditorComponent> {
  constructor(
    private dialog: MatDialog
  ){}
  canDeactivate(target: ApplicationsEditorComponent) {
    if (target.hasChanges) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        width: '450px',
        height: '200px',
        data: {
          message:
            'You have unsaved changes to the current application. Would you like to continue?',
        },
      });
      return dialogRef.afterClosed();
    }
    return true;
  }
}
