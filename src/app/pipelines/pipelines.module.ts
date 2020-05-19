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
import {CustomBranchDialogComponent} from "./components/custom-branch-step/custom-branch-dialog.component";
import {StepGroupMappingsComponent} from "./components/step-group-mappings/step-group-mappings.component";

@NgModule({
  imports: [SharedModule, StepsModule, DesignerModule, CodeEditorModule, CoreModule],
  exports: [StepInformationComponent],
  declarations: [
    CustomBranchDialogComponent,
    PipelinesEditorComponent,
    PipelineParameterComponent,
    PipelinesSelectorModalComponent,
    StepGroupMappingsComponent,
    StepInformationComponent,
  ],
  entryComponents: [
    CustomBranchDialogComponent,
    PipelinesSelectorModalComponent,
    StepGroupMappingsComponent
  ],
})
export class PipelinesModule {}
