import {Component, Inject} from "@angular/core";
import {Application, ClassInfo} from "../../applications.model";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {TreeEditorComponent} from "../../../shared/components/tree-editor/tree-editor.component";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";

export interface UDCComponent extends ClassInfo {
  id: number;
}

export enum CustomType {
  UDF,
  CUSTOM_SERIALIZER,
  ID_SERIALIZER,
  NAME_SERIALIZER,
}

@Component({
  selector: 'udf-editor',
  templateUrl: './udf-editor.component.html',
})
export class UDFEditorComponent {
// Properties
  id = 0;
  udfs: UDCComponent[] = [];
  customSerializers: UDCComponent[] = [];
  idSerializers: UDCComponent[] = [];
  nameSerializers: UDCComponent[] = [];

  constructor(
    public dialogRef: MatDialogRef<UDFEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Application,
    private displayDialogService: DisplayDialogService) {
    if (data.sparkUdfs) {
      this.populateCustomClassList(this.udfs, data.sparkUdfs);
    }
    if (data.json4sSerializers) {
      if (data.json4sSerializers.customSerializers) {
        this.populateCustomClassList(this.customSerializers, data.json4sSerializers.customSerializers);
      }
      if (data.json4sSerializers.enumIdSerializers) {
        this.populateCustomClassList(this.idSerializers, data.json4sSerializers.enumIdSerializers);
      }
      if (data.json4sSerializers.enumNameSerializers) {
        this.populateCustomClassList(this.nameSerializers, data.json4sSerializers.enumNameSerializers);
      }
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

  addUDC(customType: CustomType) {
    const list = this.getTypeList(customType);
    list.push({
      id: this.id++,
      className: '',
      parameters: {},
    });
  }

  removeUDC(id: number, customType: CustomType) {
    const list = this.getTypeList(customType);
    const index = list.findIndex((p) => p.id === id);
    if (index > -1) {
      list.splice(index, 1);
      this.generateUDCs();
    }
  }

  generateUDCs() {
    this.data.sparkUdfs = this.generateUDCList(this.udfs);
    if (this.customSerializers.length > 0 || this.idSerializers.length > 0 || this.nameSerializers.length > 0) {
      this.data.json4sSerializers = {
        customSerializers: this.generateUDCList(this.customSerializers),
        enumIdSerializers: this.generateUDCList(this.idSerializers),
        enumNameSerializers: this.generateUDCList(this.nameSerializers),
      };
    }
  }

  private generateUDCList(list: UDCComponent[]) {
    const listeners = [];
    list.forEach((prop) => {
      if (prop.className.trim().length > 0) {
        listeners.push({
          className: prop.className,
          parameters: prop.parameters,
        });
      }
    });
    return listeners.length > 0 ? listeners : undefined;
  }

  private getTypeList(customType: CustomType) {
    let list;
    switch (customType) {
      case CustomType.CUSTOM_SERIALIZER:
        list = this.customSerializers;
        break;
      case CustomType.ID_SERIALIZER:
        list = this.idSerializers;
        break;
      case CustomType.NAME_SERIALIZER:
        list = this.nameSerializers;
        break;
      default:
        list = this.udfs;
    }
    return list;
  }

  private populateCustomClassList(list: UDCComponent[], source: ClassInfo[]) {
    source.forEach((prop) => {
      if (prop.className.trim().length > 0) {
        list.push({
          id: this.id++,
          className: prop.className,
          parameters: prop.parameters,
        });
      }
    });
  }
}
