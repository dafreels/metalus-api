import { ObjectEditorComponent } from './../components/object-editor/object-editor.component';
import { ComponentRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Injectable } from '@angular/core';
import { DialogDimensions } from '../models/custom-dialog.model';

@Injectable({
  providedIn: 'root',
})
export class DisplayDialogService {
  constructor(public matDialog: MatDialog) {}

  openDialog(component, dialogDimensions: DialogDimensions, data?) {
    const dialogRef = this.matDialog.open(component, {
      width: dialogDimensions.width,
      height: dialogDimensions.heigh,
      data,
      disableClose: true,
    });

    return dialogRef;
  }
}
