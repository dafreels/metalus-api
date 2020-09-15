import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {PipelineData, PipelineStepParam} from '../../models/pipelines.model';
import {PackageObject} from "../../../core/package-objects/package-objects.model";

interface StepGroupResult {
  param: PipelineStepParam;
  packageObjects: PackageObject[];
  typeAhead: string[];
  pipelinesData: PipelineData[];
}

@Component({
  selector: 'step-group-result-selector-modal',
  templateUrl: './step-group-result-modal.component.html',
  styleUrls: ['./step-group-result-modal.component.scss']
})
export class StepGroupResultModalComponent {
  constructor(
    public dialogRef: MatDialogRef<StepGroupResult>,
    @Inject(MAT_DIALOG_DATA) public data: StepGroupResult) {}

  closeDialog(): void {
    this.dialogRef.close(this.data.param);
  }
}
