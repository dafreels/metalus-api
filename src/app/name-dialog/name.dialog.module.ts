import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {NameDialogComponent} from "./name.dialog.component";
import {MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";

@NgModule({
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  declarations: [NameDialogComponent],
  exports: [NameDialogComponent],
  entryComponents: [NameDialogComponent]
})

export class NameDialogModule {}
