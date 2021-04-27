import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Schema} from "../../../models/schema.model";

@Component({
  templateUrl: './schema-editor-modal.component.html'
})
export class SchemaEditorModalComponent {
  constructor(public dialogRef: MatDialogRef<SchemaEditorModalComponent>,
              @Inject(MAT_DIALOG_DATA) public data: Schema) {
  }

  closeDialog() {
    this.dialogRef.close();
  }
  schemaChanged(event){
    this.dialogRef.close(event);
  }
}
