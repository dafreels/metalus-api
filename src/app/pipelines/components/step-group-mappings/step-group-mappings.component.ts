import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {PipelineStepParam} from "../../models/pipelines.model";
import {NameDialogComponent} from "../../../shared/components/name-dialog/name-dialog.component";
import {PackageObject} from "../../../core/package-objects/package-objects.model";

export interface PipelineMappingsData {
  packageObjects: PackageObject[];
  mappings: object;
  typeAhead: string[];
}
@Component({
  selector: 'step-group-mappings-modal',
  templateUrl: './step-group-mappings.component.html',
  styleUrls: ['./step-group=mappings.component.scss']
})
export class StepGroupMappingsComponent {
  params: PipelineStepParam[];
  stepType = 'step-group';
  constructor(
    public dialogRef: MatDialogRef<StepGroupMappingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PipelineMappingsData,
    public dialog: MatDialog,) {
    // Parse data into something that can be displayed
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
}
