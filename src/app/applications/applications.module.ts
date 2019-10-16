import {NgModule} from "@angular/core";
import {ApplicationsEditorComponent} from "./applications.editor.component";
import {ApplicationsService} from "./applications.service";
import {SharedComponentsModule} from "../shared/shared.components";

@NgModule({
  imports: [
    SharedComponentsModule
  ],
  declarations: [
    ApplicationsEditorComponent
  ],
  exports: [
    ApplicationsEditorComponent
  ],
  providers: [
    ApplicationsService
  ]
})

export class ApplicationsModule {}
