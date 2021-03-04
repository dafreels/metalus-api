import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Job} from "../../../models/jobs.model";

export interface JobInformation {
  job: Job;
  providerId: string;
}
@Component({
  templateUrl: './job-status.component.html',
  styleUrls: ['./job-status.component.scss']
})
export class JobStatusComponent {
  constructor(public dialogRef: MatDialogRef<JobStatusComponent>,
              @Inject(MAT_DIALOG_DATA) public data: JobInformation) {}

  closeDialog() {
    this.dialogRef.close();
  }
}
