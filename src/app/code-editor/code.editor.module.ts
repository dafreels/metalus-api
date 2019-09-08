import {AceModule} from 'ngx-ace-wrapper';
import { ACE_CONFIG } from 'ngx-ace-wrapper';
import { AceConfigInterface } from 'ngx-ace-wrapper';
import {NgModule} from "@angular/core";
import {CodeEditorComponent} from "./code.editor.component";
import {MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {MatSelectModule} from "@angular/material/select";
import {FormsModule} from "@angular/forms";
import {MatCardModule} from "@angular/material/card";

const DEFAULT_ACE_CONFIG: AceConfigInterface = {};

@NgModule({
  imports: [
    AceModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatSelectModule,
    FormsModule
  ],
  declarations: [
    CodeEditorComponent
  ],
  exports: [
    CodeEditorComponent
  ],
  entryComponents: [
    CodeEditorComponent
  ],
  providers: [
    {
      provide: ACE_CONFIG,
      useValue: DEFAULT_ACE_CONFIG
    }
  ]
})

export class CodeEditorModule {}
