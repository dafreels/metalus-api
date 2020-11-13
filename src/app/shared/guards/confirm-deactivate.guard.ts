import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { PipelinesEditorComponent } from '../../pipelines/components/pipelines-editor/pipelines-editor.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationModalComponent } from '../components/confirmation/confirmation-modal.component';

@Injectable()
export class ConfirmDeactivateGuard implements CanDeactivate<PipelinesEditorComponent> {    
    constructor(
    private dialog: MatDialog
    ){}
    canDeactivate(target: PipelinesEditorComponent) {
        if (target.hasChanges) {
            const dialogRef = this.dialog.open(ConfirmationModalComponent, {
                width: '450px',
                height: '200px',
                data: {
                  message:
                    'You have unsaved changes to the current pipeline. Would you like to continue?',
                },
              });
            return dialogRef.afterClosed();
        }
        return true;
    }
}