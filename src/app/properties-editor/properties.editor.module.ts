import {NgModule} from "@angular/core";
import {PropertiesEditorComponent} from "./properties.editor.component";
import {MatMenuModule} from "@angular/material/menu";
import {MatCardModule} from "@angular/material/card";
import {FormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {CommonModule} from "@angular/common";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {PropertiesEditorModalComponent} from "./modal/properties.editor.modal.component";
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
    PropertiesEditorComponent,
    PropertiesEditorModalComponent
  ],
  entryComponents: [
    PropertiesEditorModalComponent
  ],
  exports: [
    PropertiesEditorComponent,
    PropertiesEditorModalComponent
  ]
})

export class PropertiesEditorModule {}
