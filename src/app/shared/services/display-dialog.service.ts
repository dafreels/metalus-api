import { ObjectEditorComponent } from './../components/object-editor/object-editor.component';
import { ComponentRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DisplayDialogService {
  constructor(public matDialog: MatDialog) {}

  openDialog(component, width: string, height: string, data) {
    const dialogRef = this.matDialog.open(component, {
      width,
      height,
      data,
      disableClose: true,
    });

    return dialogRef;
  }
}
