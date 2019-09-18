import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {IPackageObject} from "../packageObjects/package-objects.model";

export interface ObjectEditorDialogData {
  userObject: object;
  schema: object;
  schemaName: string;
  pkgObjs: IPackageObject[];
}

@Component({
  selector: 'object-editor',
  templateUrl: './object.editor.component.html',
  styleUrls: ['./object.editor.component.css']
})
export class ObjectEditorComponent {
  constructor(
    public dialogRef: MatDialogRef<ObjectEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ObjectEditorDialogData) {}

  handleSchemaSelection(schemaName) {
    this.data.schema = JSON.parse(this.data.pkgObjs.find(p => p.id === schemaName).schema);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
