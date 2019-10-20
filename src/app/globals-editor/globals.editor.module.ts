import {NgModule} from "@angular/core";
import {GlobalsEditorComponent} from "./globals.editor.component";
import {MatMenuModule} from "@angular/material/menu";
import {MatCardModule} from "@angular/material/card";
import {FormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {CommonModule} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {GlobalsEditorModalComponent} from "./modal/globals.editor.modal.component";
import {MatDialogModule} from "@angular/material/dialog";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSlideToggleModule
  ],
  declarations: [
    GlobalsEditorComponent,
    GlobalsEditorModalComponent
  ],
  entryComponents: [
    GlobalsEditorModalComponent
  ],
  exports: [
    GlobalsEditorComponent,
    GlobalsEditorModalComponent
  ]
})

export class GlobalsEditorModule {}
