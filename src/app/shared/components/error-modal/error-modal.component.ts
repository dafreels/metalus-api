import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ErrorDialogData {
  message: string;
}

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['error-modal.component.scss']
})
export class ErrorModalComponent {
  constructor(public dialogRef: MatDialogRef<ErrorDialogData>,
              @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
