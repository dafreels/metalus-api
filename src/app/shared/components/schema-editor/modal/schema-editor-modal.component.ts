import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Schema} from "../../../models/schema.model";
import {SharedFunctions} from "../../../utils/shared-functions";

@Component({
  templateUrl: './schema-editor-modal.component.html'
})
export class SchemaEditorModalComponent {
  schema: Schema;
  constructor(public dialogRef: MatDialogRef<SchemaEditorModalComponent>,
              @Inject(MAT_DIALOG_DATA) public data: Schema) {
    this.schema = SharedFunctions.clone(data);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  save(){
    this.dialogRef.close(this.schema);
  }
}
