import { DisplayDialogService } from './../../../shared/services/display-dialog.service';
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { ClassComponentProperties } from '../../applications.model';
import { PropertiesEditorModalComponent } from '../../../shared/components/properties-editor/modal/properties-editor-modal.component';
import { PackageObject } from '../../../core/package-objects/package-objects.model';
import { generalDialogDimensions } from 'src/app/shared/models/custom-dialog.model';

export interface ComponentsEditorData {
  properties: ClassComponentProperties;
  packageObjects: PackageObject[];
}

@Component({
  selector: 'app-components-editor',
  templateUrl: './components-editor.component.html',
})
export class ComponentsEditorComponent {
  constructor(
    public dialogRef: MatDialogRef<ComponentsEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ComponentsEditorData,
    private displayDialogService: DisplayDialogService
  ) {
    if (!data.properties.pipelineListener) {
      data.properties.pipelineListener = {
        className: 'com.acxiom.pipeline.DefaultPipelineListener',
        parameters: {},
      };
    }
    if (!data.properties.stepMapper) {
      data.properties.stepMapper = {
        className: 'com.acxiom.pipeline.DefaultPipelineStepMapper',
        parameters: {},
      };
    }

    if (!data.properties.securityManager) {
      data.properties.securityManager = {
        className: 'com.acxiom.pipeline.DefaultPipelineSecurityManager',
        parameters: {},
      };
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  openEditor(parameters: object) {
    // TODO Will need to associate any new object back to original
    const editorDialogData = {
      allowSpecialParameters: false,
      packageObjects: this.data.packageObjects,
      propertiesObject: parameters || {},
    };
    const editorDialog = this.displayDialogService.openDialog(
      PropertiesEditorModalComponent,
      generalDialogDimensions,
      editorDialogData
    );
  }
}
