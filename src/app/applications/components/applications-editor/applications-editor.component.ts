import {DisplayDialogService} from '../../../shared/services/display-dialog.service';
import {PipelinesService} from '../../../pipelines/services/pipelines.service';
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Application, Execution} from '../../applications.model';
import {ApplicationsService} from '../../applications.service';
import {Pipeline} from '../../../pipelines/models/pipelines.model';
import {SharedFunctions} from '../../../shared/utils/shared-functions';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {FormControl} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {SparkConfEditorComponent} from '../spark-conf-editor/spark-conf-editor.component';
import {Subject} from 'rxjs';
import {PropertiesEditorModalComponent} from '../../../shared/components/properties-editor/modal/properties-editor-modal.component';
import {PackageObjectsService} from '../../../core/package-objects/package-objects.service';
import {PackageObject} from '../../../core/package-objects/package-objects.model';
import {CodeEditorComponent} from '../../../code-editor/components/code-editor/code-editor.component';
import {ComponentsEditorComponent} from '../components-editor/components-editor.component';
import {ExecutionEditorComponent} from '../execution-editor/execution-editor.component';
import {generalDialogDimensions} from 'src/app/shared/models/custom-dialog.model';
import {DesignerComponent} from "../../../designer/components/designer/designer.component";
import {
  DesignerConstants,
  DesignerElement,
  DesignerElementAction,
  DesignerElementAddOutput, DesignerElementOutput,
  DesignerModel
} from "../../../designer/designer-constants";

@Component({
  selector: 'app-applications-editor',
  templateUrl: './applications-editor.component.html',
  styleUrls: ['./applications-editor.component.scss'],
})
export class ApplicationsEditorComponent implements OnInit {
  @ViewChild('canvas', { static: false }) canvas: ElementRef;
  originalApplication: Application;
  selectedApplication: Application;
  designerModel: DesignerModel = DesignerComponent.newModel();
  applications: Application[];
  pipelines: Pipeline[];
  packageObjects: PackageObject[];
  executionLookup = {};
  addExecutionSubject: Subject<DesignerElement> = new Subject<DesignerElement>();
  addExecutionOutput: Subject<DesignerElementAddOutput> = new Subject<DesignerElementAddOutput>();

  // Chip fields
  separatorKeysCodes: number[] = [ENTER, COMMA];
  stepPackageCtrl = new FormControl();
  requiredParametersCtrl = new FormControl();

  constructor(
    private applicationsService: ApplicationsService,
    private pipelinesService: PipelinesService,
    private packageObjectsService: PackageObjectsService,
    private displayDialogService: DisplayDialogService
  ) {}

  ngOnInit(): void {
    this.newApplication();
    this.pipelinesService.getPipelines().subscribe((pipelines: Pipeline[]) => {
      if (pipelines) {
        this.pipelines = pipelines;
      } else {
        this.pipelines = [];
      }
    });
    this.applicationsService
      .getApplications()
      .subscribe((applications: Application[]) => {
        if (applications) {
          this.applications = applications;
        } else {
          this.applications = [];
        }
      });
    this.packageObjectsService
      .getPackageObjects()
      .subscribe((pkgObjs: PackageObject[]) => {
        if (pkgObjs) {
          this.packageObjects = pkgObjs;
        } else {
          this.packageObjects = [];
        }
      });
  }

  newApplication() {
    this.originalApplication = {
      applicationProperties: {},
      executions: [],
      globals: {},
      id: '',
      name: '',
      project: null,
      pipelineListener: {
        className: 'com.acxiom.pipeline.DefaultPipelineListener',
        parameters: {},
      },
      pipelineManager: undefined, // This is to ensure that the system will load the application pipelines by default
      pipelineParameters: [],
      requiredParameters: [],
      securityManager: {
        className: 'com.acxiom.pipeline.DefaultPipelineSecurityManager',
        parameters: {},
      },
      sparkConf: {
        kryoClasses: [
          'org.apache.hadoop.io.LongWritable',
          'org.apache.http.client.entity.UrlEncodedFormEntity',
        ],
        setOptions: [
          {
            name: 'spark.hadoop.io.compression.codecs',
            value:
              'org.apache.hadoop.io.compress.BZip2Codec,org.apache.hadoop.io.compress.DeflateCodec,' +
              'org.apache.hadoop.io.compress.GzipCodec,org.apache.' +
              'hadoop.io.compress.Lz4Codec,org.apache.hadoop.io.compress.SnappyCodec',
          },
        ],
      },
      stepMapper: {
        className: 'com.acxiom.pipeline.DefaultPipelineStepMapper',
        parameters: {},
      },
      stepPackages: [],
      pipelines: [],
    };
    this.selectedApplication = JSON.parse(
      JSON.stringify(this.originalApplication)
    );
  }

  loadApplication(id: string) {
    this.originalApplication = this.applications.find((app) => app.id === id);
    this.selectedApplication = JSON.parse(
      JSON.stringify(this.originalApplication)
    );
    // Create the model from the executions
    const model = DesignerComponent.newModel();
    // let nodeId;
    this.executionLookup = {};
    // const executions = {};
    this.selectedApplication.executions.forEach((execution) => {
      this.createModelNode(model, execution, -1, -1);
    });
    // Create connections
    const connectedNodes = [];
    let connection;
    this.selectedApplication.executions.forEach((execution) => {
      if (execution.parents) {
        execution.parents.forEach((parent) => {
          if (connectedNodes.indexOf(execution.id) === -1) {
            connectedNodes.push(execution.id);
          }
          connection = model.connections[`${parent}::${execution.id}`];
          if (!connection) {
            connection = {
              sourceNodeId: this.executionLookup[parent],
              targetNodeId: this.executionLookup[execution.id],
              endpoints: [],
            };
            model.connections[
              `${this.executionLookup[parent]}::${
                this.executionLookup[execution.id]
              }`
            ] = connection;
          }
          connection.endpoints.push({
            sourceEndPoint: execution.id,
            targetEndPoint: 'input',
          });
        });
      }
    });
    // See if automatic layout needs to be applied
    if (
      !this.selectedApplication.layout ||
      Object.keys(this.selectedApplication.layout).length === 0
    ) {
      // DesignerComponent.performAutoLayout(
      //   this.executionLookup,
      //   connectedNodes,
      //   model
      // );
    }
    this.designerModel = model;
  }

  handleElementAction(action: DesignerElementAction) {
    switch (action.action) {
      case 'editExecution':
        const originalId = action.element.data['id'];
        const elementActionDialogData = {
          packageObjects: this.packageObjects,
          pipelines: this.pipelines,
          execution: action.element.data,
        };
        const elementActionDialog = this.displayDialogService.openDialog(
          ExecutionEditorComponent,
          generalDialogDimensions,
          elementActionDialogData
        );

        elementActionDialog.afterClosed().subscribe((result) => {
          if (result && result.id !== originalId) {
            action.element.name = result.id;
          }
        });
        break;
      case 'addOutput':
        this.addExecutionOutput.next({
          element: action.element,
          output: `output-${new Date().getTime()}`,
        });
    }
  }

  removeStepPackage(pkg: string) {
    const index = this.selectedApplication.stepPackages.indexOf(pkg);
    if (index > -1) {
      this.selectedApplication.stepPackages.splice(index, 1);
    }

    if (
      this.selectedApplication.stepPackages &&
      this.selectedApplication.stepPackages.length === 0
    ) {
      delete this.selectedApplication.stepPackages;
    }
  }

  addStepPackage(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    // Add our package
    if ((value || '').trim()) {
      if (!this.selectedApplication.stepPackages) {
        this.selectedApplication.stepPackages = [];
      }
      this.selectedApplication.stepPackages.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.stepPackageCtrl.setValue(null);
  }

  removeRequiredParameter(param: string) {
    const index = this.selectedApplication.requiredParameters.indexOf(param);
    if (index > -1) {
      this.selectedApplication.requiredParameters.splice(index, 1);
    }

    if (
      this.selectedApplication.requiredParameters &&
      this.selectedApplication.requiredParameters.length === 0
    ) {
      delete this.selectedApplication.requiredParameters;
    }
  }

  addRequiredParameter(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    // Add our package
    if ((value || '').trim()) {
      if (!this.selectedApplication.requiredParameters) {
        this.selectedApplication.requiredParameters = [];
      }
      this.selectedApplication.requiredParameters.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.requiredParametersCtrl.setValue(null);
  }

  openSparkConfEditor() {
    const sparkConfEditorDialog = this.displayDialogService.openDialog(
      SparkConfEditorComponent,
      generalDialogDimensions,
      this.selectedApplication
    );
  }

  openPropertiesEditor(mode: string) {
    const propertiesEditorDialogData = {
      allowSpecialParameters: false,
      packageObjects: this.packageObjects,
      propertiesObject:
        mode === 'globals'
          ? this.selectedApplication.globals
          : this.selectedApplication.applicationProperties,
    };
    const propertiesEditorDialog = this.displayDialogService.openDialog(
      PropertiesEditorModalComponent,
      generalDialogDimensions,
      propertiesEditorDialogData
    );
  }

  openComponentsEditor() {
    const componentEditorDialogData = {
      properties: this.selectedApplication,
      packageObjects: this.packageObjects,
    };
    const componentsEditorDialog = this.displayDialogService.openDialog(
      ComponentsEditorComponent,
      generalDialogDimensions,
      componentEditorDialogData
    );
  }

  exportApplication() {
    const exportApplicationDialogData = {
      code: JSON.stringify(this.generateApplication(), null, 4),
      language: 'json',
      allowSave: false,
    };
    const exportApplicationDialog = this.displayDialogService.openDialog(
      CodeEditorComponent,
      generalDialogDimensions,
      exportApplicationDialogData
    );
  }

  newExecution() {
    const execution: Execution = {
      globals: {},
      id: 'New_Execution',
      initialPipelineId: '',
      mergeGlobals: false,
      parents: [],
      pipelineListener: {
        className: 'com.acxiom.pipeline.DefaultPipelineListener',
        parameters: {},
      },
      pipelineParameters: [],
      securityManager: {
        className: 'com.acxiom.pipeline.DefaultPipelineSecurityManager',
        parameters: {},
      },
      stepMapper: {
        className: 'com.acxiom.pipeline.DefaultPipelineStepMapper',
        parameters: {},
      },
    };
    let element = this.createDesignerElement(
      execution,
      this.selectedApplication.executions
    );
    const canvasRect = this.canvas.nativeElement.getBoundingClientRect();
    element.layout = {
      x: 100 + canvasRect.x,
      y: 150 + canvasRect.y,
    };
    this.addExecutionSubject.next(element);
  }

  private generateApplication() {
    const pipelines = [];
    const pipelineIds = [];
    const executions = [];
    const layout = {};
    const connectionKeys = Object.keys(this.designerModel.connections);
    let execution;
    let pipeline;
    let stepGroup;
    let stepParameter;
    let connection;
    Object.keys(this.designerModel.nodes).forEach((key) => {
      execution = this.designerModel.nodes[key].data.data;
      layout[execution.id] = {
        x: this.designerModel.nodes[key].x,
        y: this.designerModel.nodes[key].y,
      };
      executions.push(execution);
      execution.parents = [];
      connectionKeys.forEach((connectionKey) => {
        connection = this.designerModel.connections[connectionKey];
        if (connection.targetNodeId === key) {
          execution.parents.push(
            this.designerModel.nodes[connection.sourceNodeId].data['name']
          );
        }
      });
      if (execution.pipelineIds) {
        execution.pipelineIds.forEach((id) => {
          if (pipelineIds.indexOf(id) === -1) {
            pipeline = this.pipelines.find((pipeline) => pipeline.id === id);
            pipelines.push(pipeline);
            pipelineIds.push(id);
            pipeline.steps.forEach((step) => {
              if (step.type === 'step-group') {
                stepParameter = step.params.find(
                  (p) => p.name === 'pipelineId'
                );
                if (
                  stepParameter &&
                  stepParameter.value &&
                  stepParameter.value.trim().length > 0
                ) {
                  this.setGlobalPipeline(
                    stepParameter.value,
                    pipelineIds,
                    pipelines
                  );
                } else {
                  stepParameter = step.params.find(
                    (p) => p.name === 'pipeline'
                  );
                  if (
                    stepParameter &&
                    stepParameter.type === 'pipeline' &&
                    stepParameter.value &&
                    stepParameter.value.trim().length > 0
                  ) {
                    this.setGlobalPipeline(
                      stepParameter.value.substring(0),
                      pipelineIds,
                      pipelines
                    );
                  }
                }
              }
            });
          }
        });
      }
    });
    this.selectedApplication.pipelines = pipelines;
    this.selectedApplication.executions = executions;
    this.selectedApplication.layout = layout;
    return this.selectedApplication;
  }

  private setGlobalPipeline(
    id: string,
    pipelineIds: string[],
    pipelines: Pipeline[]
  ) {
    if (!id) {
      return;
    }
    const pipelineId = id.trim();
    if (pipelineIds.indexOf(pipelineId) === -1) {
      const pipeline = this.pipelines.find(
        (pipeline) => pipeline.id === pipelineId
      );
      pipelines.push(pipeline);
      pipelineIds.push(pipelineId);
    }
  }

  private createModelNode(model, execution, x = -1, y = -1) {
    const nodeId = `designer-node-${model.nodeSeq++}`;
    model.nodes[nodeId] = {
      data: this.createDesignerElement(
        execution,
        this.selectedApplication.executions
      ),
      x:
        this.selectedApplication.layout &&
        this.selectedApplication.layout[execution.id].x
          ? this.selectedApplication.layout[execution.id].x
          : x,
      y:
        this.selectedApplication.layout &&
        this.selectedApplication.layout[execution.id].y
          ? this.selectedApplication.layout[execution.id].y
          : y,
    };
    this.executionLookup[execution.id] = nodeId;
  }

  private createDesignerElement(
    execution: Execution,
    executions: Execution[]
  ): DesignerElement {
    return {
      name: execution.id,
      tooltip: execution.id,
      icon: SharedFunctions.getMaterialIconName('execution'),
      input: true,
      outputs: this.generateOutputs(execution, executions),
      data: execution,
      event: null,
      style: null,
      actions: [
        {
          displayName: 'Edit',
          action: 'editExecution',
          enableFunction: () => true,
        },
        {
          displayName: 'Add Output',
          action: 'addOutput',
          enableFunction: () => true,
        },
      ],
    };
  }

  private generateOutputs(execution: Execution, executions: Execution[]) {
    const outputs = [];
    executions.forEach((exec) => {
      if (exec.parents && exec.parents.indexOf(execution.id) !== -1) {
        outputs.push(new DesignerElementOutput(exec.id, 'normal', DesignerConstants.DEFAULT_SOURCE_ENDPOINT));
      }
    });
    return outputs;
  }
}
