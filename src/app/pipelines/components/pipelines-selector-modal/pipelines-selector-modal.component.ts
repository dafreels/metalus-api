import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Pipeline } from '../../models/pipelines.model';

@Component({
  selector: 'app-pipelines-selector-modal',
  templateUrl: './pipelines-selector-modal.component.html',
  styleUrls: ['./pipelines-selector-modal.component.scss'],
})
export class PipelinesSelectorModalComponent {
  selectedPipelineId: string;
  constructor(
    public dialogRef: MatDialogRef<Pipeline[]>,
    @Inject(MAT_DIALOG_DATA) public data: Pipeline[]
  ) {}

  closeDialog(): void {
    this.dialogRef.close(this.selectedPipelineId);
  }
}
