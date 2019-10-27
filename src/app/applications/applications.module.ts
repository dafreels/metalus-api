import {NgModule} from "@angular/core";
import {ApplicationsEditorComponent} from "./applications.editor.component";
import {ApplicationsService} from "./applications.service";
import {SharedComponentsModule} from "../shared/shared.components";
import {DesignerModule} from "../designer/designer.module";

@NgModule({
  imports: [
    DesignerModule,
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
