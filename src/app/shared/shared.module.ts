import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { materialDesignModules } from './material-design-modules';
import { DndModule } from 'ngx-drag-drop';
import { MaterialDesignFrameworkModule } from 'angular6-json-schema-form';
import { NameDialogComponent } from './components/name-dialog/name-dialog.component';
import { ConfirmationModalComponent } from './components/confirmation/confirmation-modal.component';
import { ErrorModalComponent } from './components/error-modal/error-modal.component';
import { PropertiesEditorComponent } from './components/properties-editor/properties-editor.component';
import { PropertiesEditorModalComponent } from './components/properties-editor/modal/properties-editor-modal.component';
import { WaitModalComponent } from './components/wait-modal/wait-modal.component';
import { ObjectEditorComponent } from './components/object-editor/object-editor.component';
import { CloseDialogButtonComponent } from './components/close-dialog-button/close-dialog-button.component';
import { MatSelectSearchComponent } from './components/mat-select-search/mat-select-search.component';
import {PasswordDialogComponent} from "./components/password-dialog/password-dialog.component";
import {MatTreeModule} from '@angular/material/tree';
import { ACE_CONFIG, AceConfigInterface, AceModule } from 'ngx-ace-wrapper';

import { TreeEditorComponent } from '../shared/components/tree-editor/tree-editor.component'
import { TreeEditorPopupComponent } from '../shared/components/tree-editor/tree-editor-popup.component';
import { TreeonloadDirective } from '../shared/components/tree-editor/treeonload.directive';
import { IsGenericType } from '../shared/components/tree-editor/type-formatter.pipe';
import { PromptComponent } from '../shared/components/tree-editor/prompt/prompt.component';
import { TreeDatabase } from '../shared/components/tree-editor/tree.service';
import { ScalaScriptComponent } from './scala-script/scala-script.component';
import { PipelineParameterComponent } from '../pipelines/components/pipeline-parameter/pipeline-parameter.component';
import { ParameterEditorComponent } from './scala-script/parameter-editor/parameter-editor.component';

const DEFAULT_ACE_CONFIG: AceConfigInterface = {};

const commonModules = [
  FormsModule,
  ReactiveFormsModule,
  CommonModule,
  RouterModule,
  DndModule,
  MaterialDesignFrameworkModule,
  MatTreeModule,
  AceModule
];

@NgModule({
  imports: [...commonModules, ...materialDesignModules],
  declarations: [
    NameDialogComponent,
    PasswordDialogComponent,
    ConfirmationModalComponent,
    ErrorModalComponent,
    PropertiesEditorComponent,
    PropertiesEditorModalComponent,
    WaitModalComponent,
    ObjectEditorComponent,
    CloseDialogButtonComponent,
    MatSelectSearchComponent,
    TreeEditorComponent,
    TreeEditorPopupComponent,
    TreeonloadDirective,
    IsGenericType,
    PromptComponent,
    ScalaScriptComponent,
    PipelineParameterComponent,
    ParameterEditorComponent
  ],
  exports: [
    ...commonModules,
    ...materialDesignModules,
    CloseDialogButtonComponent,
    MatSelectSearchComponent,
    IsGenericType,
    PipelineParameterComponent
  ],
  entryComponents: [
    NameDialogComponent,
    PasswordDialogComponent,
    ConfirmationModalComponent,
    ErrorModalComponent,
    PropertiesEditorModalComponent,
    WaitModalComponent,
    ObjectEditorComponent,
    TreeEditorComponent,
    TreeEditorPopupComponent,
    PromptComponent,
    ScalaScriptComponent,
  ],
  providers: [
    { provide: ACE_CONFIG, useValue: DEFAULT_ACE_CONFIG, },
    TreeDatabase
  ]
})
export class SharedModule {}
