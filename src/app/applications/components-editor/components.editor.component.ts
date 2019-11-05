import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ClassComponentProperties} from "../applications.model";

@Component({
  selector: 'components-editor',
  templateUrl: './components.editor.component.html'
})
export class ComponentsEditorComponent {
  constructor(public dialogRef: MatDialogRef<ComponentsEditorComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ClassComponentProperties) {}
}
