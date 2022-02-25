import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';

@Component({
  templateUrl: './primitive-editor-dialog.component.html',
  styleUrls: ['./primitive-editor-dialog.component.scss'],
})
export class PrimitiveEditorDialogComponent {
  num: boolean;
  bool: boolean;
  value: boolean;

  constructor(
    public dialogRef: MatDialogRef<PrimitiveEditorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data) {
    if (typeof data === 'boolean') {
      this.bool = true;
    } else if (typeof data === 'number') {
      this.num = true;
    } else {
      this.value = true;
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
