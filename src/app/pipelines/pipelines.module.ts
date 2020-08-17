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
import {ObjectMappingsComponent} from "./components/object-group-mappings/object-group-mappings.component";
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { TreeEditorComponent } from './components/tree-editor/tree-editor.component' 
import { TreeEditorPopupComponent } from './components/tree-editor/tree-editor-popup.component';
import { TreeonloadDirective } from './components/tree-editor/treeonload.directive';
@NgModule({
  imports: [SharedModule, StepsModule, DesignerModule, CodeEditorModule, CoreModule,NgJsonEditorModule],
  exports: [StepInformationComponent],
  declarations: [
    CustomBranchDialogComponent,
    PipelinesEditorComponent,
    PipelineParameterComponent,
    PipelinesSelectorModalComponent,
    ObjectMappingsComponent,
    StepInformationComponent,
    TreeEditorComponent,
    TreeEditorPopupComponent,
    TreeonloadDirective
  ],
  entryComponents: [
    CustomBranchDialogComponent,
    PipelinesSelectorModalComponent,
    ObjectMappingsComponent,
    TreeEditorComponent,
    TreeEditorPopupComponent
  ],
})
export class PipelinesModule {}
