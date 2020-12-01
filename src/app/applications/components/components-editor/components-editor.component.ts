import {Component, Input} from '@angular/core';
import {BaseApplicationProperties} from '../../applications.model';
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {TreeEditorComponent} from "../../../shared/components/tree-editor/tree-editor.component";

@Component({
  selector: 'app-components-editor',
  templateUrl: './components-editor.component.html',
})
export class ComponentsEditorComponent {
  localData: BaseApplicationProperties;

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
    this.localData = inputData;
  }

  openEditor(parameters: object) {
  //   // TODO Will need to associate any new object back to original
  //   const editorDialogData = {
  //     allowSpecialParameters: false,
  //     packageObjects: this.data.packageObjects,
  //     propertiesObject: parameters || {},
  //   };
    const editorDialog = this.displayDialogService.openDialog(
      TreeEditorComponent,
      generalDialogDimensions,
      {
        mappings: parameters,
        hideMappingParameters: true,
    });
  }
}
