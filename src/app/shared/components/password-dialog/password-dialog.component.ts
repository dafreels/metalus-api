import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';

export interface PasswordDialogData {
  password: string;
}

@Component({
  selector: 'app-name-dialog',
  templateUrl: './password-dialog.component.html'
})
export class PasswordDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PasswordDialogData) {}

  closeDialog(): void {
    this.dialogRef.close(this.data);
  }
}
