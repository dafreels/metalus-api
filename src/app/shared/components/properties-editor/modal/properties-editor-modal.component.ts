import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PackageObject } from '../../../../core/package-objects/package-objects.model';

export interface PropertiesEditorData {
  allowSpecialParameters: boolean;
  propertiesObject: object;
  packageObjects: PackageObject[];
}

@Component({
  selector: 'app-properties-editor-modal',
  templateUrl: './properties-editor-modal.component.html',
  styleUrls: ['./properties-editor-modal.component.scss']
})
export class PropertiesEditorModalComponent {
  constructor(public dialogRef: MatDialogRef<PropertiesEditorData>,
              @Inject(MAT_DIALOG_DATA) public data: PropertiesEditorData) {}

  closeDialog(): void {
    this.dialogRef.close({
      value: this.data.propertiesObject
    });
  }

  setGlobalObject(g: object) {
    this.data.propertiesObject = g;
  }
}
