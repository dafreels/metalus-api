import { ObjectEditorComponent } from './../shared/components/object-editor/object-editor.component';
import { NgModule } from '@angular/core';
import { PipelinesEditorComponent } from './components/pipelines-editor/pipelines-editor.component';
import { DesignerModule } from '../designer/designer.module';
import { PipelineParameterComponent } from './components/pipeline-parameter/pipeline-parameter.component';
import { PipelinesSelectorModalComponent } from './components/pipelines-selector-modal/pipelines-selector-modal.component';
import { SharedModule } from '../shared/shared.module';
import { StepsModule } from '../steps/steps.module';
import { CodeEditorModule } from '../code-editor/code-editor.module';
import { StepInformationComponent } from './components/step-information/step-information.component';
import {CoreModule} from "../core/core.module";

@NgModule({
  imports: [SharedModule, StepsModule, DesignerModule, CodeEditorModule, CoreModule],
  exports: [StepInformationComponent],
  declarations: [
    PipelinesEditorComponent,
    PipelineParameterComponent,
    PipelinesSelectorModalComponent,
    StepInformationComponent,
  ],
  entryComponents: [PipelinesSelectorModalComponent],
})
export class PipelinesModule {}
