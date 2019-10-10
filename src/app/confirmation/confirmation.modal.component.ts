import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

export interface ConfirmationDialogData {
  message: string;
}

@Component({
  selector: 'confirmation-modal',
  templateUrl: './confirmation.modal.component.html',
  styleUrls: ['confirmation.modal.component.css']
})
export class ConfirmationModalComponent {
  constructor(public dialogRef: MatDialogRef<ConfirmationDialogData>,
              @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData) {}

  closeDialog(choice: boolean): void {
    this.dialogRef.close(choice);
  }
}
