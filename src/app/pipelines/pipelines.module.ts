import {NgModule} from "@angular/core";
import {PipelinesService} from "./pipelines.service";
import {PipelinesEditorComponent} from "./pipelines.editor.component";
import {StepsModule} from "../steps/steps.module";
import {DesignerModule} from "../designer/designer.module";
import {SharedComponentsModule} from "../shared/shared.components";
import {PipelineParameterComponent} from "./parameters/pipeline.parameter.component";

@NgModule({
  imports: [
    DesignerModule,
    SharedComponentsModule,
    StepsModule
  ],
  declarations: [
    PipelinesEditorComponent,
    PipelineParameterComponent
  ],
  exports: [
    PipelinesEditorComponent
  ],
  providers: [
    PipelinesService
  ]
})

export class PipelinesModule {}
