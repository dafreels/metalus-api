import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {PipelineStepParam} from "../../models/pipelines.model";
import {NameDialogComponent} from "../../../shared/components/name-dialog/name-dialog.component";
import {PackageObject} from "../../../core/package-objects/package-objects.model";
import {JsonEditorOptions} from 'ang-jsoneditor';

export interface PipelineMappingsData {
  packageObjects: PackageObject[];
  mappings: object;
  typeAhead: string[];
  hideMappingParameters?: boolean;
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
  jsonData: any;

  constructor(
    public dialogRef: MatDialogRef<ObjectMappingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PipelineMappingsData,
    public dialog: MatDialog,) {
    this.editorOptions = new JsonEditorOptions()
    this.editorOptions.modes = ['code', 'tree'];
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
    this.dialogRef.close(this.jsonData);
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
  getData(jsonData) {
    this.jsonData = jsonData;
  }
}
