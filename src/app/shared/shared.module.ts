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

const commonModules = [
  FormsModule,
  ReactiveFormsModule,
  CommonModule,
  RouterModule,
  DndModule,
  MaterialDesignFrameworkModule,
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
  ],
  exports: [
    ...commonModules,
    ...materialDesignModules,
    CloseDialogButtonComponent,
    MatSelectSearchComponent,
  ],
  entryComponents: [
    NameDialogComponent,
    PasswordDialogComponent,
    ConfirmationModalComponent,
    ErrorModalComponent,
    PropertiesEditorModalComponent,
    WaitModalComponent,
    ObjectEditorComponent,
  ],
})
export class SharedModule {}
