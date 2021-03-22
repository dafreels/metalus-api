import {Component, Inject, ViewEncapsulation} from "@angular/core";
import {MAT_SNACK_BAR_DATA} from "@angular/material/snack-bar";
import {Job} from "../../../models/jobs.model";

@Component({
  templateUrl: './jobs-message.component.html',
  styleUrls: ['./jobs-message.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class JobsMessageComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: Job[]) { }

  getStatusIcon(status) {
    switch(status) {
      case 'COMPLETE':
        return 'check_circle';
      case 'PENDING':
        return 'donut_large';
      case 'CANCELLED':
        return 'dangerous';
      case 'FAILED':
        return 'error';
      case 'RUNNING':
      default:
        return 'directions_run';
    }
  }
}
