import {Component, Input} from '@angular/core';
import {BaseApplicationProperties, ClassInfo} from '../../applications.model';
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {TreeEditorComponent} from "../../../shared/components/tree-editor/tree-editor.component";

export interface SparkListener extends ClassInfo {
  id: number;
}

@Component({
  selector: 'app-components-editor',
  templateUrl: './components-editor.component.html',
})
export class ComponentsEditorComponent {
  localData: BaseApplicationProperties;
  sparkListeners: SparkListener[] = [];
  id = 0;

  constructor(private displayDialogService: DisplayDialogService) {}

  @Input()
  set data(inputData: BaseApplicationProperties) {
    if (!inputData.pipelineListener) {
      inputData.pipelineListener = {
        className: 'com.acxiom.pipeline.DefaultPipelineListener',
        parameters: {},
      };
    }
    if (!inputData.stepMapper) {
      inputData.stepMapper = {
        className: 'com.acxiom.pipeline.DefaultPipelineStepMapper',
        parameters: {},
      };
    }

    if (!inputData.securityManager) {
      inputData.securityManager = {
        className: 'com.acxiom.pipeline.DefaultPipelineSecurityManager',
        parameters: {},
      };
    }
    if (inputData.sparkListeners && inputData.sparkListeners.length > 0) {
      inputData.sparkListeners.forEach((prop) => {
        if (prop.className.trim().length > 0) {
          this.sparkListeners.push({
            id: this.id++,
            className: prop.className,
            parameters: prop.parameters,
          });
        }
      });
    }
    this.localData = inputData;
  }

  openEditor(parameters: object) {
    this.displayDialogService.openDialog(
      TreeEditorComponent,
      generalDialogDimensions,
      {
        mappings: parameters,
        hideMappingParameters: true,
    });
  }

  addSparkListener() {
    this.sparkListeners.push({
      id: this.id++,
      className: '',
      parameters: {},
    });
  }

  removeSparkListener(id: number) {
    const index = this.sparkListeners.findIndex((p) => p.id === id);
    if (index > -1) {
      this.sparkListeners.splice(index, 1);
      this.generateSparkListeners();
    }
  }

  generateSparkListeners() {
    const listeners = [];
    this.sparkListeners.forEach((prop) => {
      if (prop.className.trim().length > 0) {
        listeners.push({
          className: prop.className,
          parameters: prop.parameters,
        });
      }
    });
    this.localData.sparkListeners = listeners;
  }
}
