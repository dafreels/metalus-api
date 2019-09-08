import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Component, Inject} from "@angular/core";
import 'brace';
import 'brace/mode/scala';
import 'brace/mode/javascript';
import 'brace/mode/sql';
import 'brace/mode/json';
import 'brace/theme/solarized_light';

export interface CodeEditorDialogData {
  code: string;
  language: string;
}

@Component({
  selector: 'code-editor',
  templateUrl: './code.editor.component.html',
  styleUrls: ['./code.editor.component.css']
})
export class CodeEditorComponent {
  constructor(
    public dialogRef: MatDialogRef<CodeEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CodeEditorDialogData) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}
