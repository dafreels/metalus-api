import {Component, Inject} from "@angular/core";
import {Application, ClassInfo} from "../../applications.model";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {TreeEditorComponent} from "../../../shared/components/tree-editor/tree-editor.component";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";

export interface UDFComponent extends ClassInfo {
  id: number;
}

@Component({
  selector: 'udf-editor',
  templateUrl: './udf-editor.component.html',
})
export class UDFEditorComponent {
// Properties
  id = 0;
  udfs: UDFComponent[] = [];

  constructor(
    public dialogRef: MatDialogRef<UDFEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Application,
  private displayDialogService: DisplayDialogService) {
    if (data.sparkUdfs) {
      data.sparkUdfs.forEach((prop) => {
        if (prop.className.trim().length > 0) {
          this.udfs.push({
            id: this.id++,
            className: prop.className,
            parameters: prop.parameters,
          });
        }
      });
    } else {
      this.udfs = [];
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  openEditor(parameters: object) {
    this.displayDialogService.openDialog(
      TreeEditorComponent,
      generalDialogDimensions,
      {
        mappings: parameters,
        hideMappingParameters: true,
      });
  }

  addUDFs() {
    this.udfs.push({
      id: this.id++,
      className: '',
      parameters: {},
    });
  }

  removeUDFs(id: number) {
    const index = this.udfs.findIndex((p) => p.id === id);
    if (index > -1) {
      this.udfs.splice(index, 1);
      this.generateUDFs();
    }
  }

  generateUDFs() {
    const listeners = [];
    this.udfs.forEach((prop) => {
      if (prop.className.trim().length > 0) {
        listeners.push({
          className: prop.className,
          parameters: prop.parameters,
        });
      }
    });
    this.data.sparkUdfs = listeners;
  }
}
