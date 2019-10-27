import {Component, OnInit} from "@angular/core";
import {IApplication} from "./applications.model";
import {DesignerComponent, DesignerModel} from "../designer/designer.component";

@Component({
  selector: 'applications-editor',
  templateUrl: './applications.editor.component.html',
  styleUrls: ['./applications.editor.component.css']
})
export class ApplicationsEditorComponent implements OnInit {
  selectedApplication: IApplication;
  designerModel: DesignerModel =  DesignerComponent.newModel();

  ngOnInit(): void {
    this.newApplication();
  }

  newApplication() {
    this.selectedApplication = {
      applicationProperties: undefined,
      executions: [],
      globals: undefined,
      id: "",
      name: "",
      pipelineListener: undefined,
      pipelineManager: undefined,
      pipelineParameters: [],
      requiredParameters: [],
      securityManager: undefined,
      sparkConf: undefined,
      stepMapper: undefined,
      stepPackages: [],
      pipelines: []
    };
  }

}
