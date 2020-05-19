import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {DialogDimensions} from '../models/custom-dialog.model';

@Injectable({
  providedIn: 'root',
})
export class DisplayDialogService {
  constructor(public matDialog: MatDialog) {}

  openDialog(component, dialogDimensions: DialogDimensions, data?) {
    const dialogRef = this.matDialog.open(component, {
      width: dialogDimensions.width,
      height: dialogDimensions.height,
      data,
      disableClose: true,
    });

    return dialogRef;
  }
}
