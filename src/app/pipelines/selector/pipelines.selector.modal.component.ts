import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {IPipeline} from "../pipelines.model";

@Component({
  selector: 'pipelines-modal',
  templateUrl: './pipelines.selector.modal.component.html',
  styleUrls: ['./pipelines.selector.modal.component.css']
})
export class PipelinesSelectorModalComponent {
  selectedPipelineId: string;
  constructor(public dialogRef: MatDialogRef<IPipeline[]>,
              @Inject(MAT_DIALOG_DATA) public data: IPipeline[]) {}

  closeDialog(): void {
    this.dialogRef.close(this.selectedPipelineId);
  }
}
