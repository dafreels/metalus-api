import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Inject} from "@angular/core";

export interface CodeEditorDialogData {
  code: string;
  language: ScriptLanguage;
}

enum ScriptLanguage {
  javascript,
  scala,
  sql
}

export class CodeEditorComponent {
  constructor(
    public dialogRef: MatDialogRef<CodeEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CodeEditorDialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
