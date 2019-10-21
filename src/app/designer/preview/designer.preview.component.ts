import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DesignerModel} from "../designer.component";

@Component({
  selector: 'designer-preview-modal',
  templateUrl: './designer.preview.component.html',
  styleUrls: ['designer.preview.component.css']
})
export class DesignerPreviewComponent {

  constructor(public dialogRef: MatDialogRef<DesignerModel>,
              @Inject(MAT_DIALOG_DATA) public data: DesignerModel) {}

  closeDialog() {
    this.dialogRef.close();
  }
}
