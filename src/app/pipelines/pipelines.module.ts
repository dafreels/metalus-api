import {NgModule} from "@angular/core";
import {PipelinesService} from "./pipelines.service";
import {PipelinesEditorComponent} from "./pipelines.editor.component";
import {StepsModule} from "../steps/steps.module";
import {DesignerModule} from "../designer/designer.module";
import {SharedComponentsModule} from "../shared/shared.components";
import {PipelineParameterComponent} from "./parameters/pipeline.parameter.component";
import {ErrorModalModule} from "../error-modal/error.modal.module";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {PipelinesSelectorModalComponent} from "./selector/pipelines.selector.modal.component";
import {MatDialogModule} from "@angular/material/dialog";

@NgModule({
  imports: [
    DesignerModule,
    ErrorModalModule,
    MatAutocompleteModule,
    MatDialogModule,
    SharedComponentsModule,
    StepsModule
  ],
  declarations: [
    PipelinesEditorComponent,
    PipelineParameterComponent,
    PipelinesSelectorModalComponent
  ],
  entryComponents: [
    PipelinesSelectorModalComponent
  ],
  exports: [
    PipelinesEditorComponent
  ],
  providers: [
    PipelinesService
  ]
})

export class PipelinesModule {}
