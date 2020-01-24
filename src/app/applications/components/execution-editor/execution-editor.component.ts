import {Component, Inject} from "@angular/core";
import {IPackageObject} from "../../../core/package-objects/package-objects.model";
import {IExecution} from "../../applications.model";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {IPipeline} from "../../../pipelines/pipelines.model";
import {PropertiesEditorModalComponent} from "../../../shared/components/properties-editor/modal/properties-editor-modal.component";
import {CdkDragDrop, moveItemInArray, transferArrayItem} from "@angular/cdk/drag-drop";
import {ComponentsEditorComponent} from "../components-editor/components-editor.component";

export interface ExecutionEditorData {
  packageObjects: IPackageObject[];
  pipelines: IPipeline[];
  execution: IExecution;
}

@Component({
  selector: 'app-execution-editor',
  templateUrl: './execution-editor.component.html',
  styleUrls: ['./execution-editor.component.scss']
})
export class ExecutionEditorComponent {
  availablePipelines: IPipeline[] = [];
  selectedPipelines: IPipeline[] = [];
  constructor(public dialogRef: MatDialogRef<ExecutionEditorComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ExecutionEditorData,
              public dialog: MatDialog) {
    if (!data.execution.pipelineIds) {
      data.execution.pipelineIds = [];
    }
    let index;
    data.pipelines.forEach(pipeline => {
      if (pipeline.category !== 'step-group') {
        index = data.execution.pipelineIds.indexOf(pipeline.id);
        if (index === -1) {
          this.availablePipelines.push(pipeline);
        } else {
          this.selectedPipelines.splice(index, 0, pipeline);
        }
      }
    });
  }

  openPipelinePropertiesEditor(pipelineId: string) {
    if (!this.data.execution.pipelineParameters) {
      this.data.execution.pipelineParameters = [];
    }
    let params = this.data.execution.pipelineParameters.find(param => param.pipelineId === pipelineId);
    if (!params) {
      params = {
        pipelineId,
        parameters: {}
      };
      this.data.execution.pipelineParameters.push(params);
    }
    this.openPropertiesEditor(params.parameters);
  }

  openPropertiesEditor(parameters: object) {
    this.dialog.open(PropertiesEditorModalComponent, {
      width: '75%',
      height: '90%',
      data: {
        allowSpecialParameters: false,
        packageObjects: this.data.packageObjects,
        propertiesObject: parameters
      }
    });
  }

  openComponentsEditor() {
    this.dialog.open(ComponentsEditorComponent, {
      width: '75%',
      height: '90%',
      data: {
        properties: this.data.execution,
        packageObjects: this.data.packageObjects
      }
    });
  }

  drop(event: CdkDragDrop<IPipeline[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
  }

  closeDialog() {
    if (!this.data.execution.pipelineParameters) {
      this.data.execution.pipelineParameters = [];
    }
    this.data.execution.pipelineIds = [];
    const pipelineParameters = [];
    this.selectedPipelines.forEach(pipeline => {
      this.data.execution.pipelineIds.push(pipeline.id);
      pipelineParameters.push(this.data.execution.pipelineParameters.find(p => p.pipelineId === pipeline.id));
    });
    this.data.execution.pipelineParameters = pipelineParameters;
    this.dialogRef.close(this.data.execution);
  }
}
