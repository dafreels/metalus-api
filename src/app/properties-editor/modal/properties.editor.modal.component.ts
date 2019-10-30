import {Component, Inject, Input} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {IPackageObject} from "../../packageObjects/package-objects.model";

export interface GlobalEditorData {
  allowSpecialParameters: boolean;
  global: object;
  packageObjects: IPackageObject[];
}

@Component({
  selector: 'globals-editor-modal',
  templateUrl: './properties.editor.modal.component.html',
  styleUrls: ['./properties.editor.modal.component.css']
})
export class PropertiesEditorModalComponent {
  constructor(public dialogRef: MatDialogRef<GlobalEditorData>,
              @Inject(MAT_DIALOG_DATA) public data: GlobalEditorData) {}

  closeDialog(): void {
    this.dialogRef.close({
      value: this.data.global
    });
  }

  setGlobalObject(g: object) {
    this.data.global = g;
  }
}
