import {DisplayDialogService} from '../../../shared/services/display-dialog.service';
import {PipelinesService} from '../../../pipelines/services/pipelines.service';
import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Application, Execution, ExecutionTemplate} from '../../applications.model';
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
import {ErrorModalComponent} from "../../../shared/components/error-modal/error-modal.component";
import {MatDialog} from "@angular/material/dialog";
import {DndDropEvent, DropEffect} from "ngx-drag-drop";
import {CdkDragDrop, moveItemInArray, transferArrayItem} from "@angular/cdk/drag-drop";
import * as Ajv from "ajv";
import {StepsService} from "../../../steps/steps.service";
import {AuthService} from "../../../shared/services/auth.service";
import {User} from "../../../shared/models/users.models";
import {TreeEditorComponent} from "../../../shared/components/tree-editor/tree-editor.component";

@Component({
  selector: 'app-applications-editor',
  templateUrl: './applications-editor.component.html',
  styleUrls: ['./applications-editor.component.scss'],
})
export class ApplicationsEditorComponent implements OnInit {
  @ViewChild('canvas', { static: false }) canvas: ElementRef;
  originalApplication: Application;
  selectedApplication: Application;
  selectedExecution: ExecutionTemplate;
  selectedElement: DesignerElement;
  designerModel: DesignerModel = DesignerComponent.newModel();
  applications: Application[];
  pipelines: Pipeline[];
  availablePipelines: Pipeline[] = [];
  selectedPipelines: Pipeline[] = [];
  packageObjects: PackageObject[];
  applicationValidator;
  executionTemplates: ExecutionTemplate[] = [{
    name: 'Blank',
    description: 'A blank execution template',
    globals: {},
    id: 'Blank_Execution',
    initialPipelineId: '',
    mergeGlobals: false,
    parents: [],
    pipelines: [],
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
  }];
  dropEffect: DropEffect = 'copy';
  draggable = true;
  executionLookup = {};
  addExecutionSubject: Subject<DesignerElement> = new Subject<DesignerElement>();
  addExecutionOutput: Subject<DesignerElementAddOutput> = new Subject<DesignerElementAddOutput>();

  editName: boolean = false;
  errors = [];

  // Chip fields
  separatorKeysCodes: number[] = [ENTER, COMMA];
  stepPackageCtrl = new FormControl();
  requiredParametersCtrl = new FormControl();

  user: User;

  constructor(
    private applicationsService: ApplicationsService,
    private pipelinesService: PipelinesService,
    private stepsService: StepsService,
    private packageObjectsService: PackageObjectsService,
    private displayDialogService: DisplayDialogService,
    private dialog: MatDialog,
    private authService: AuthService) {
    this.user = this.authService.getUserInfo();
  }

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
    this.applicationsService.getApplicationSchema().subscribe((applicationSchema) => {
      const ajv = new Ajv({allErrors: true});
      this.pipelinesService.getPipelineSchema().subscribe((pipelineSchema) => {
        this.stepsService.getStepSchema().subscribe((stepSchema) => {
          this.applicationValidator = ajv
            .addSchema(stepSchema, 'stepSchema')
            .addSchema(pipelineSchema, 'pipelineSchema')
            .addSchema(applicationSchema)
            .compile(applicationSchema.definitions.applications);
        });
      });
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
    this.selectedExecution = this.createBlankExecution();
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

  validateApplication() {
    const errors = [];
    const newApplication = this.generateApplication();
    if (!this.applicationValidator(newApplication)) {
      if (this.applicationValidator.errors && this.applicationValidator.errors.length > 0) {
        this.applicationValidator.errors.forEach((err) => {
          errors.push({
            component: 'application',
            field: err.dataPath.substring(1),
            message: err.message
          });
        });
      }
    }
    this.errors = errors;
  }

  handleElementAction(action: DesignerElementAction) {
    switch (action.action) {
      // case 'editExecution':
      //   const originalId = action.element.data['id'];
      //   const elementActionDialogData = {
      //     packageObjects: this.packageObjects,
      //     pipelines: this.pipelines,
      //     execution: action.element.data,
      //   };
      //   const elementActionDialog = this.displayDialogService.openDialog(
      //     ExecutionEditorComponent,
      //     generalDialogDimensions,
      //     elementActionDialogData
      //   );
      //
      //   elementActionDialog.afterClosed().subscribe((result) => {
      //     if (result && result.id !== originalId) {
      //       action.element.name = result.id;
      //     }
      //   });
      //   break;
      case 'addOutput':
        this.addExecutionOutput.next({
          element: action.element,
          output: `output-${new Date().getTime()}`,
        });
    }
  }

  handleExecutionSelection(event: DesignerElement) {
    const execution = event.data as ExecutionTemplate;
    let pipelines = [];
    const executionPipelines = execution.pipelines || [];
    // pipelineIds override pipelines
    let pipeline;
    if (execution.pipelineIds && execution.pipelineIds.length > 0) {
      execution.pipelineIds.forEach((id) => {
        // See if the execution pipelines have the pipeline we need
        executionPipelines.forEach((pipe) => {
          if (pipe.id === id) {
            pipeline = pipe;
          }
        });
        // Grab it from the global pipelines
        if (!pipeline) {
          this.pipelines.forEach((pipe) => {
            if (pipe.id === id) {
              pipeline = pipe;
            }
          });
        }
        pipelines.push(pipeline);
        pipeline = null;
      });
    } else {
      pipelines = execution.pipelines || [];
    }

    // Use the embedded pipelines instead of the global pipelines
    this.availablePipelines = (this.pipelines ? this.pipelines : []).filter((globalPipeline) => {
      let existingPipeline = false;
      if (pipelines) {
        pipelines.forEach((pipe) => {
          if (globalPipeline.id === pipe.id) {
            existingPipeline = true;
          }
        });
      }
      return !existingPipeline;
    });
    this.selectedPipelines = pipelines;
    this.selectedElement = event;
    this.selectedExecution = execution;
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

  deleteApplication() {

  }

  importApplication() {

  }

  copyApplication() {

  }

  exportApplication() {
    const exportApplicationDialogData = {
      code: JSON.stringify(this.generateApplication(), null, 4),
      language: 'json',
      allowSave: false,
    };
    this.displayDialogService.openDialog(
      CodeEditorComponent,
      generalDialogDimensions,
      exportApplicationDialogData
    );
  }

  showErrors() {
    const messages = [];
    this.errors.forEach((err) => {
      messages.push(`${err.component} ${err.field}: ${err.message}`);
    });
    this.dialog.open(ErrorModalComponent, {
      width: '450px',
      height: '300px',
      data: { messages },
    });
  }

  createBlankExecution() {
    return {
      globals: {},
      id: '',
      name: '',
      description: 'Empty execution',
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
  }

  addExecution(event: DndDropEvent) {
    let element = this.createDesignerElement(
      event.data,
      this.selectedApplication.executions
    );
    element.event = event;
    this.addExecutionSubject.next(element);
  }

  handleExecutionIdChange() {
    if (this.selectedElement) {
      this.selectedElement.name = this.selectedExecution.id;
    }
  }

  dropPipeline(event: CdkDragDrop<Pipeline[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  private generateApplication() {
    const application = SharedFunctions.clone(this.selectedApplication);
    const pipelines = [];
    const pipelineIds = [];
    const executions = [];
    const layout = {};
    const connectionKeys = Object.keys(this.designerModel.connections);
    let execution;
    // let pipeline;
    let stepParameter;
    let connection;
    Object.keys(this.designerModel.nodes).forEach((key) => {
      execution = SharedFunctions.clone(this.designerModel.nodes[key].data.data);
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
      if (execution.pipelines && execution.pipelines.length > 0) {
        execution.pipelineIds = [];
        execution.pipelines.forEach((pipeline) => {
          execution.pipelineIds.push(pipeline.id);
          if (pipelines.findIndex(p => p.id === pipeline.id) === -1) {
            pipelines.push(pipeline);
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
                  stepParameter = step.params.find((p) => p.name === 'pipeline');
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
        delete execution.pipelines;
      }
      // if (execution.pipelineIds) {
      //   execution.pipelineIds.forEach((id) => {
      //     if (pipelineIds.indexOf(id) === -1) {
      //       pipeline = this.pipelines.find((p) => p.id === id);
      //       // pipelines.push(pipeline);
      //       pipelineIds.push(id);
      //       pipeline.steps.forEach((step) => {
      //         if (step.type === 'step-group') {
      //           stepParameter = step.params.find(
      //             (p) => p.name === 'pipelineId'
      //           );
      //           if (
      //             stepParameter &&
      //             stepParameter.value &&
      //             stepParameter.value.trim().length > 0
      //           ) {
      //             this.setGlobalPipeline(
      //               stepParameter.value,
      //               pipelineIds,
      //               pipelines
      //             );
      //           } else {
      //             stepParameter = step.params.find((p) => p.name === 'pipeline');
      //             if (
      //               stepParameter &&
      //               stepParameter.type === 'pipeline' &&
      //               stepParameter.value &&
      //               stepParameter.value.trim().length > 0
      //             ) {
      //               this.setGlobalPipeline(
      //                 stepParameter.value.substring(0),
      //                 pipelineIds,
      //                 pipelines
      //               );
      //             }
      //           }
      //         }
      //       });
      //     }
      //   });
      // }
    });
    application.pipelines = pipelines;
    application.executions = executions;
    application.layout = layout;
    application.project = this.user.projects.find(p => p.id === this.user.defaultProjectId);
    return application;
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
        // {
        //   displayName: 'Edit',
        //   action: 'editExecution',
        //   enableFunction: () => true,
        // },
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

  disableNameEdit() {
    this.editName = false;
    this.validateApplication();
  }

  enableNameEdit() {
    this.editName = true;
  }

  autoLayout() {

  }

  saveApplication() {

  }

  cancelApplicationChange() {

  }

  openGlobalsEditor(selectedExecution) {
    if (!selectedExecution.globals) {
      selectedExecution.globals = {};
    }
    const editorDialog = this.displayDialogService.openDialog(
      TreeEditorComponent,
      generalDialogDimensions,
      {
        mappings: selectedExecution.globals,
        hideMappingParameters: true,
      });
    editorDialog.afterClosed().subscribe((result) => {
      if (result) {
        selectedExecution.globals = result;
      }
    });
  }

  openPipelineParametersEditor(selectedExecution: ExecutionTemplate, pipeline: Pipeline) {
    if (!selectedExecution.pipelineParameters) {
      selectedExecution.pipelineParameters = [];
    }
    let parameters = selectedExecution.pipelineParameters.find(p => p.pipelineId === pipeline.id);
    if (!parameters) {
      parameters = {
        pipelineId: pipeline.id,
        parameters: {},
      };
      selectedExecution.pipelineParameters.push(parameters);
    }
    pipeline.steps.forEach((step) => {
      step.params.forEach((param) => {
        if (param.value && typeof param.value === 'string') {
          param.value.split('||').forEach((value) => {
            if (value.trim().startsWith('$') || value.trim().startsWith('?')) {
              const paramName = value.trim().substring(1);
              if (!parameters.parameters[paramName]) {
                parameters.parameters[paramName] = null;
              }
            }
          });
        }
      });
    });
    this.displayDialogService.openDialog(
      TreeEditorComponent,
      generalDialogDimensions,
      {
        mappings: parameters.parameters,
        hideMappingParameters: true,
      });
  }
}
