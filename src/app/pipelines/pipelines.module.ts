import {NgModule} from '@angular/core';
import {PipelinesEditorComponent} from './components/pipelines-editor/pipelines-editor.component';
import {DesignerModule} from '../designer/designer.module';
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
import {CustomParameterEditorComponent} from './components/custom-parameter-editor/custom-parameter-editor.component';
import { PackageSelectorComponent } from './components/custom-parameter-editor/package-selector/package-selector.component';
import { packageNamePipe } from './components/custom-parameter-editor/package-selector/classname.pipe';
import { ExecutionSelectorComponent } from './components/custom-parameter-editor/execution-selector/execution-selector.component';

@NgModule({
  imports: [SharedModule, StepsModule, DesignerModule, CodeEditorModule, CoreModule, NgJsonEditorModule],
  exports: [StepInformationComponent],
  declarations: [
    CustomBranchDialogComponent,
    PipelinesEditorComponent,
    PipelinesSelectorModalComponent,
    ObjectMappingsComponent,
    StepInformationComponent,
    StepGroupResultModalComponent,
    CustomParameterEditorComponent,
    PackageSelectorComponent,
    packageNamePipe,
    ExecutionSelectorComponent,
  ],
  entryComponents: [
    CustomBranchDialogComponent,
    PipelinesSelectorModalComponent,
    ObjectMappingsComponent,
    StepGroupResultModalComponent,
  ],

})
export class PipelinesModule {}
