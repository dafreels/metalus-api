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
import { PreviewParameterEditorComponent } from './components/preview-parameter-editor/preview-parameter-editor.component';
import { TreeEditorComponent } from './components/tree-editor/tree-editor.component'
import { TreeEditorPopupComponent } from './components/tree-editor/tree-editor-popup.component';
import { TreeonloadDirective } from './components/tree-editor/treeonload.directive';
import { IsGenericType } from './components/tree-editor/type-formatter.pipe';
import { PromptComponent } from './components/tree-editor/prompt/prompt.component';
import { TreeDatabase } from './components/tree-editor/tree.service';
import { ScalaScriptComponent } from './scala-script/scala-script.component';
import { PipelineParameterComponent } from '../pipelines/components/pipeline-parameter/pipeline-parameter.component';
import { ParameterEditorComponent } from './scala-script/parameter-editor/parameter-editor.component';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { ArrayTypeComponent } from './components/formly-types/array.type';
import { MultiSchemaTypeComponent } from './components/formly-types/multischema.type';
import { NullTypeComponent } from './components/formly-types/null.type';
import { ObjectTypeComponent } from './components/formly-types/object.type';
import { RepeatTypeComponent } from './components/formly-types/repeat-section.type';
import { StringsArrayTypeComponent } from './components/formly-types/strings-array.type';

const DEFAULT_ACE_CONFIG: AceConfigInterface = {};

const commonModules = [
  FormsModule,
  ReactiveFormsModule,
  CommonModule,
  RouterModule,
  DndModule,
  MaterialDesignFrameworkModule,
  MatTreeModule,
  AceModule,
  ReactiveFormsModule,
];

@NgModule({
  imports: [
    ...commonModules,
    ...materialDesignModules,
    FormlyModule.forRoot({
      validationMessages: [
        { name: 'required', message: 'This field is required' },
      ],
      types: [
        { name: 'string', extends: 'input' },
        {
          name: 'number',
          extends: 'input',
          defaultOptions: {
            templateOptions: {
              type: 'number',
            },
          },
        },
        {
          name: 'integer',
          extends: 'input',
          defaultOptions: {
            templateOptions: {
              type: 'number',
            },
          },
        },
        { name: 'boolean', extends: 'checkbox' },
        { name: 'enum', extends: 'select' },
        { name: 'null', component: NullTypeComponent, wrappers: ['form-field'] },
        { name: 'array', component: ArrayTypeComponent },
        { name: 'stringArray', component: StringsArrayTypeComponent },
        { name: 'object', component: ObjectTypeComponent },
        { name: 'multischema', component: MultiSchemaTypeComponent },
        { name: 'repeat', component: RepeatTypeComponent },
      ],
    }),
    FormlyMaterialModule,
  ],
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
    ParameterEditorComponent,
    PreviewParameterEditorComponent,
    ArrayTypeComponent,
    ObjectTypeComponent,
    MultiSchemaTypeComponent,
    NullTypeComponent,
    RepeatTypeComponent,
    StringsArrayTypeComponent
  ],
  exports: [
    ...commonModules,
    ...materialDesignModules,
    CloseDialogButtonComponent,
    MatSelectSearchComponent,
    IsGenericType,
    PipelineParameterComponent,
    PreviewParameterEditorComponent,
    TreeEditorComponent,
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
    { provide: ACE_CONFIG, useValue: DEFAULT_ACE_CONFIG },
    TreeDatabase,
  ],
})
export class SharedModule {}
