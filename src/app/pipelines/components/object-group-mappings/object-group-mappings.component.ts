import {Component, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {PipelineStepParam} from "../../models/pipelines.model";
import {NameDialogComponent} from "../../../shared/components/name-dialog/name-dialog.component";
import {PackageObject} from "../../../core/package-objects/package-objects.model";
import { JsonEditorOptions, JsonEditorComponent } from 'ang-jsoneditor';

export interface PipelineMappingsData {
  packageObjects: PackageObject[];
  mappings: object;
  typeAhead: string[];
}
@Component({
  selector: 'object-group-mappings-modal',
  templateUrl: './object-group-mappings.component.html',
  styleUrls: ['./object-group-mappings.component.scss']
})
export class ObjectMappingsComponent {
  params: PipelineStepParam[];
  stepType = 'step-group';
  public editorOptions: JsonEditorOptions;
  @ViewChild(JsonEditorComponent, { static: false }) editor: JsonEditorComponent;
 
  constructor(
    public dialogRef: MatDialogRef<ObjectMappingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PipelineMappingsData,
    public dialog: MatDialog,) {
    // Parse data into something that can be displayed
    this.editorOptions = new JsonEditorOptions()
    this.editorOptions.modes = ['code', 'text', 'tree', 'view'];
    const paramList = [];
    Object.keys(data.mappings).forEach(key => {
      paramList.push({
        value: data.mappings[key],
        type: 'text',
        name: key,
        required: false,
        defaultValue: undefined,
        language: undefined,
        className: undefined,
        parameterType: undefined
      });
    });
    this.params = paramList;
  }

  saveDialog() {
    // Convert this.params back into an object
    const data = {};
    this.params.forEach(param => {
      data[param.name] = param.value;
    });
    this.dialogRef.close(data);
  }

  cancelDialog() {
    this.dialogRef.close();
  }

  addParameter() {
    this.dialog.open(NameDialogComponent, {
      width: '25%',
      height: '25%',
      data: {name: ''},
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.params.push({
          value: '',
          type: 'text',
          name: result,
          required: false,
          defaultValue: undefined,
          language: undefined,
          className: undefined,
          parameterType: undefined
        });
      }
    });
  }
  getData(jsonEvent) {
    console.log("ObjectMappingsComponent -> getData -> jsonEvent", jsonEvent)
  }
}
