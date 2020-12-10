import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Application, ClassComponentProperties} from "../../applications.model";

@Component({
  templateUrl: './components-editor-modal.component.html',
})
export class ComponentsEditorModalComponent {
  localData: ClassComponentProperties;
  constructor(
    public dialogRef: MatDialogRef<ComponentsEditorModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Application) {
    this.localData = {
      exposePipelineManager: true,
      pipelineListener: this.data.pipelineListener,
      securityManager: this.data.securityManager,
      stepMapper: this.data.stepMapper,
      sparkListeners: this.data.sparkListeners,
      pipelineManager: this.data.pipelineManager,
    };
  }

  closeDialog() {
    this.data.pipelineListener = this.localData.pipelineListener;
    this.data.securityManager = this.localData.securityManager;
    this.data.stepMapper = this.localData.stepMapper;
    this.data.sparkListeners = this.localData.sparkListeners;
    this.data.pipelineManager = this.localData.pipelineManager;

    this.dialogRef.close();
  }
}
