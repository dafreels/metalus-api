import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';

export interface PrimitiveEditorData {
  value: any;
  template: object;
}

@Component({
  templateUrl: './primitive-editor-dialog.component.html',
  styleUrls: ['./primitive-editor-dialog.component.scss'],
})
export class PrimitiveEditorDialogComponent {
  num: boolean;
  bool: boolean;
  value: boolean;
  showTemplate: boolean = false;
  templateValue: object;

  constructor(
    public dialogRef: MatDialogRef<PrimitiveEditorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PrimitiveEditorData) {
    if (typeof data.value === 'boolean') {
      this.bool = true;
    } else if (typeof data.value === 'number') {
      this.num = true;
    } else {
      this.value = true;
    }

    if (data.template) {
      this.value = false;
      this.showTemplate = true;
      if (data.value.object) {
        this.templateValue = data.value.object;
      } else {
        this.templateValue = data.value;
      }
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  templateValueChanged(value) {
    if (this.showTemplate && this.data.value.object) {
      this.templateValue = value;
      this.data.value.object = value;
    } else {
      this.data.value = value;
    }
  }
}
