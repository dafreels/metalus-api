import {NgModule} from "@angular/core";
import {ConfirmationModalComponent} from "./confirmation.modal.component";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {MatDialogModule} from "@angular/material/dialog";
import {MatInputModule} from "@angular/material/input";

@NgModule({
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatInputModule
  ],
  declarations: [ConfirmationModalComponent],
  exports: [ConfirmationModalComponent],
  entryComponents: [ConfirmationModalComponent]
})

export class ConfirmationModalModule {}
