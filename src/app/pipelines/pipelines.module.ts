import {NgModule} from "@angular/core";
import {PipelinesService} from "./pipelines.service";
import {PipelinesEditorComponent} from "./pipelines.editor.component";
import {StepsModule} from "../steps/steps.module";
import {DesignerModule} from "../designer/designer.module";
import {SharedComponentsModule} from "../shared/shared.components";

@NgModule({
  imports: [
    DesignerModule,
    SharedComponentsModule,
    StepsModule
  ],
  declarations: [
    PipelinesEditorComponent
  ],
  exports: [
    PipelinesEditorComponent
  ],
  providers: [
    PipelinesService
  ]
})

export class PipelinesModule {}
