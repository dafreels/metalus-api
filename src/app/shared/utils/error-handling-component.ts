import {ErrorModalComponent} from "../components/error-modal/error-modal.component";
import {MatDialog} from "@angular/material/dialog";

export class ErrorHandlingComponent {
  constructor(public dialog: MatDialog) {}

  handleError(error, dialogRef) {
    let message;
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      message = error.error.message;
    } else {
      message = error.message;
    }
    if (dialogRef) {
      dialogRef.close();
    }
    this.dialog.open(ErrorModalComponent, {
      width: '450px',
      height: '300px',
      data: { messages: message.split('\n') },
    });
  }
}
