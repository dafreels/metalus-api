import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, Inject } from '@angular/core';
import 'brace';
import 'brace/mode/scala';
import 'brace/mode/javascript';
import 'brace/mode/sql';
import 'brace/mode/json';
import 'brace/theme/solarized_light';
import { SharedFunctions } from 'src/app/shared/utils/shared-functions';

export interface CodeEditorDialogData {
  code: string;
  language: string;
  allowSave: boolean;
  exportFileName?:string;
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
  exportTemplate() {
    const fileName = this.data.exportFileName || 'Export Data.json';
    SharedFunctions.downloadAsFile(fileName,JSON.stringify(JSON.parse(this.data.code)));
  }
  
  onFileLoad(event) {
    const f = event.target.files[0];
    const reader = new FileReader();
  
    reader.onload = ((theFile) => {
      return (e) => {
        try {
          let importedJSON = JSON.parse(e.target.result);
          this.data.code = JSON.stringify(importedJSON,null,4);
        } catch (err) {
        }
      };
    })(f);
    reader.readAsText(f);
  }
  
}
