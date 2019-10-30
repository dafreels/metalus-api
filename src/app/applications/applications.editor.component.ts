import {Component, OnInit} from "@angular/core";
import {IApplication, IExecution} from "./applications.model";
import {DesignerComponent, DesignerElementAction, DesignerModel} from "../designer/designer.component";
import {ApplicationsService} from "./applications.service";
import {IPipeline} from "../pipelines/pipelines.model";
import {PipelinesService} from "../pipelines/pipelines.service";
import {SharedFunctions} from "../shared/SharedFunctions";

@Component({
  selector: 'applications-editor',
  templateUrl: './applications.editor.component.html',
  styleUrls: ['./applications.editor.component.css']
})
export class ApplicationsEditorComponent implements OnInit {
  originalApplication: IApplication;
  selectedApplication: IApplication;
  designerModel: DesignerModel = DesignerComponent.newModel();
  applications: IApplication[];
  pipelines: IPipeline[];
  executionLookup = {};

  constructor(private applicationsService: ApplicationsService,
              private pipelinesService: PipelinesService) {}

  ngOnInit(): void {
    this.newApplication();
    this.pipelinesService.getPipelines().subscribe((pipelines: IPipeline[]) => {
      if (pipelines) {
        this.pipelines = pipelines;
      } else {
        this.pipelines = [];
      }
    });

    this.applicationsService.getApplications().subscribe((applications: IApplication[]) => {
      if (applications) {
        this.applications = applications
      } else {
        this.applications = [];
      }
    });
  }

  newApplication() {
    this.originalApplication = {
      applicationProperties: {},
      executions: [],
      globals: {},
      id: "",
      name: "",
      pipelineListener: {
        className: 'com.acxiom.pipeline.DefaultPipelineListener',
        parameters: {}
      },
      pipelineManager: undefined, // This is to ensure that the system will load the application pipelines by default
      pipelineParameters: [],
      requiredParameters: [],
      securityManager: {
        className: 'com.acxiom.pipeline.DefaultPipelineSecurityManager',
        parameters: {}
      },
      sparkConf: {
        kryoClasses: ['org.apache.hadoop.io.LongWritable', 'org.apache.http.client.entity.UrlEncodedFormEntity'],
        setOptions: [
          {
            name: 'spark.hadoop.io.compression.codecs',
            value: 'org.apache.hadoop.io.compress.BZip2Codec,org.apache.hadoop.io.compress.DeflateCodec,' +
              'org.apache.hadoop.io.compress.GzipCodec,org.apache.' +
              'hadoop.io.compress.Lz4Codec,org.apache.hadoop.io.compress.SnappyCodec'
          }
        ]
      },
      stepMapper: {
        className: 'com.acxiom.pipeline.DefaultPipelineStepMapper',
        parameters: {}
      },
      stepPackages: [],
      pipelines: []
    };
    this.selectedApplication = JSON.parse(JSON.stringify(this.originalApplication));
  }

  loadApplication(id: string) {
    this.originalApplication = this.applications.find(app => app.id === id);
    this.selectedApplication = JSON.parse(JSON.stringify(this.originalApplication));
    // Create the model from the executions
    const model = DesignerComponent.newModel();
    let nodeId;
    this.executionLookup = {};
    const executions = {};
    this.selectedApplication.executions.forEach(execution => {
      nodeId = `designer-node-${model.nodeSeq++}`;
      model.nodes[nodeId] = {
        data: this.createDesignerElement(execution, this.selectedApplication.executions),
        x: this.selectedApplication.layout && this.selectedApplication.layout[execution.id].x ? this.selectedApplication.layout[execution.id].x : -1,
        y: this.selectedApplication.layout && this.selectedApplication.layout[execution.id].y ? this.selectedApplication.layout[execution.id].y : -1
      };
      this.executionLookup[execution.id] = nodeId;
      executions[execution.id] = execution;
    });
    // Create connections
    const connectedNodes = [];
    let connection;
    this.selectedApplication.executions.forEach(execution => {
      if (execution.parents) {
        execution.parents.forEach(parent => {
          if (connectedNodes.indexOf(execution.id) === -1) {
            connectedNodes.push(execution.id);
          }
          connection = model.connections[`${parent}::${execution.id}`];
          if (!connection) {
            connection = {
              sourceNodeId: this.executionLookup[parent],
              targetNodeId: this.executionLookup[execution.id],
              endpoints: []
            };
            model.connections[`${this.executionLookup[parent]}::${this.executionLookup[execution.id]}`] = connection;
          }
          connection.endpoints.push({
            sourceEndPoint: execution.id,
            targetEndPoint: 'input'
          });
        });
      }
    });
    // See if automatic layout needs to be applied
    if (!this.selectedApplication.layout ||
      Object.keys(this.selectedApplication.layout).length === 0) {
      DesignerComponent.performAutoLayout(this.executionLookup, connectedNodes, model);
    }
    this.designerModel = model;
  }

  handleElementAction(action: DesignerElementAction) {
    switch(action.action) {
      case 'editExecution':
        // TODO Implement edit application
    }
  }

  private createDesignerElement(execution: IExecution, executions: IExecution[]) {
    return {
      name: execution.id,
      tooltip: execution.id,
      icon: SharedFunctions.getMaterialIconName('execution'),
      input: true,
      outputs: this.generateOutputs(execution, executions),
      data: execution,
      event: null,
      style: null,
      actions: [{
        displayName: 'Edit',
        action: 'editExecution',
        enableFunction: () => true
      }]
    };
  }

  private generateOutputs(execution: IExecution, executions: IExecution[]) {
    const outputs = [];
    executions.forEach(exec => {
      if (exec.parents && exec.parents.indexOf(execution.id) !== -1) {
        outputs.push(exec.id);
      }
    });
    return outputs;
  }
}
