import {NgModule} from '@angular/core';
import {PipelinesEditorComponent} from './components/pipelines-editor/pipelines-editor.component';
import {DesignerModule} from '../designer/designer.module';
import {PipelineParameterComponent} from './components/pipeline-parameter/pipeline-parameter.component';
import {PipelinesSelectorModalComponent} from './components/pipelines-selector-modal/pipelines-selector-modal.component';
import {SharedModule} from '../shared/shared.module';
import {StepsModule} from '../steps/steps.module';
import {CodeEditorModule} from '../code-editor/code-editor.module';
import {StepInformationComponent} from './components/step-information/step-information.component';
import {CoreModule} from "../core/core.module";
import {CustomBranchDialogComponent} from "./components/custom-branch-step/custom-branch-dialog.component";
import {ObjectMappingsComponent} from "./components/object-group-mappings/object-group-mappings.component";
import {NgJsonEditorModule} from 'ang-jsoneditor';
import {StepGroupResultModalComponent} from "./components/step-group-result-modal/step-group-result-modal.component";

@NgModule({
  imports: [SharedModule, StepsModule, DesignerModule, CodeEditorModule, CoreModule,NgJsonEditorModule],
  exports: [StepInformationComponent],
  declarations: [
    CustomBranchDialogComponent,
    PipelinesEditorComponent,
    // PipelineParameterComponent,
    PipelinesSelectorModalComponent,
    ObjectMappingsComponent,
    StepInformationComponent,
    StepGroupResultModalComponent,
  ],
  entryComponents: [
    CustomBranchDialogComponent,
    PipelinesSelectorModalComponent,
    ObjectMappingsComponent,
    StepGroupResultModalComponent,
  ],

})
export class PipelinesModule {}
