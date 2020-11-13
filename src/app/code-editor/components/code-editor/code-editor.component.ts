import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import 'brace';
import 'brace/mode/scala';
import 'brace/mode/javascript';
import 'brace/mode/sql';
import 'brace/mode/json';
import 'brace/theme/solarized_light';

export interface CodeEditorDialogData {
  code: string;
  language: string;
  allowSave: boolean;
}

@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss']
})
export class CodeEditorComponent {
  constructor(
    public dialogRef: MatDialogRef<CodeEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CodeEditorDialogData
  ) {
  }
}
