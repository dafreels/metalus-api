import {NgModule} from "@angular/core";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatDialogModule} from "@angular/material/dialog";
import {MatSelectModule} from "@angular/material/select";
import {FormsModule} from "@angular/forms";
import {ObjectEditorComponent} from "./object.editor.component";
import { MaterialDesignFrameworkModule } from 'angular6-json-schema-form';
import {BrowserModule} from "@angular/platform-browser";

@NgModule({
  imports: [
    BrowserModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatSelectModule,
    FormsModule,
    MaterialDesignFrameworkModule
  ],
  declarations: [
    ObjectEditorComponent
  ],
  exports: [
    ObjectEditorComponent
  ],
  entryComponents: [
    ObjectEditorComponent
  ]
})

export class ObjectEditorModule {}
