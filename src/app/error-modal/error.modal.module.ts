import {NgModule} from "@angular/core";
import {ErrorModalComponent} from "./error.modal.component";
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
  declarations: [ErrorModalComponent],
  exports: [ErrorModalComponent],
  entryComponents: [ErrorModalComponent]
})

export class ErrorModalModule {}
