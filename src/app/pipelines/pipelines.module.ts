import {NgModule} from "@angular/core";
import {PipelinesService} from "./pipelines.service";
import {PipelinesEditorComponent} from "./pipelines.editor.component";
import {StepsModule} from "../steps/steps.module";
import {DesignerModule} from "../designer/designer.module";
import {SharedComponentsModule} from "../shared/shared.components";
import {PipelineParameterComponent} from "./parameters/pipeline.parameter.component";
import {ErrorModalModule} from "../error-modal/error.modal.module";
import {MatAutocompleteModule} from "@angular/material/autocomplete";

@NgModule({
  imports: [
    DesignerModule,
    ErrorModalModule,
    MatAutocompleteModule,
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
