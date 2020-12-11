import {DisplayDialogService} from '../../../shared/services/display-dialog.service';
import {PipelinesService} from '../../../pipelines/services/pipelines.service';
import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Application, Execution, ExecutionTemplate} from '../../applications.model';
import {ApplicationsService} from '../../applications.service';
import {Pipeline} from '../../../pipelines/models/pipelines.model';
import {SharedFunctions} from '../../../shared/utils/shared-functions';
import {SparkConfEditorComponent} from '../spark-conf-editor/spark-conf-editor.component';
import {Subject, Subscription} from 'rxjs';
import {PackageObjectsService} from '../../../core/package-objects/package-objects.service';
import {PackageObject} from '../../../core/package-objects/package-objects.model';
import {CodeEditorComponent} from '../../../code-editor/components/code-editor/code-editor.component';
import {generalDialogDimensions} from 'src/app/shared/models/custom-dialog.model';
import {DesignerComponent} from "../../../designer/components/designer/designer.component";
import {
  DesignerConstants,
  DesignerElement,
  DesignerElementAction,
  DesignerElementAddOutput,
  DesignerElementOutput,
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
import {WaitModalComponent} from "../../../shared/components/wait-modal/wait-modal.component";
import {ConfirmationModalComponent} from "../../../shared/components/confirmation/confirmation-modal.component";
import {UdcEditorComponent} from "../udc-editor/udc-editor.component";
import {GlobalLinksEditorComponent} from "../global-links-editor/global-links-editor.components";
import {ComponentsEditorModalComponent} from "../components-editor/components-editor-modal.component";
import {ExecutionsService} from "../../executions.service";

@Component({
  selector: 'app-applications-editor',
  templateUrl: './applications-editor.component.html',
  styleUrls: ['./applications-editor.component.scss'],
})
export class ApplicationsEditorComponent implements OnInit, OnDestroy {
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
    description: 'Blank Execution',
    exposePipelineManager: false,
    globals: {},
    id: 'Blank',
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

  user: User;
  subscriptions: Subscription[] = [];

  constructor(
    private applicationsService: ApplicationsService,
    private executionsService: ExecutionsService,
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
    this.executionsService
      .getExecutions()
      .subscribe((executions: ExecutionTemplate[]) => {
        if (executions) {
          this.executionTemplates = this.executionTemplates.concat(executions);
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

  ngOnDestroy(): void {
    this.subscriptions = SharedFunctions.clearSubscriptions(this.subscriptions);
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
    this.selectedExecution = null;
    this.designerModel = DesignerComponent.newModel();
  }

  loadApplication(id: string) {
    this.originalApplication = this.applications.find((app) => app.id === id);
    this.selectedApplication = SharedFunctions.clone(this.originalApplication);
    // Create the model from the executions
    const model = DesignerComponent.newModel();
    // let nodeId;
    this.executionLookup = {};
    // const executions = {};
    const pipelineList = this.pipelines;
    this.selectedApplication.executions.forEach((execution) => {
      this.createModelNode(model, execution, -1, -1);
      execution.pipelines = [];
      execution.pipelineIds.forEach(pid => execution.pipelines.push(pipelineList.find(p => p.id === pid)));
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
      // TODO Run autolayout
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

  openSparkConfEditor() {
    this.displayDialogService.openDialog(
      SparkConfEditorComponent,
      generalDialogDimensions,
      this.selectedApplication
    );
  }

  openUDCsEditor() {
    this.displayDialogService.openDialog(
      UdcEditorComponent,
      generalDialogDimensions,
      this.selectedApplication
    );
  }

  deleteApplication() {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '450px',
      height: '200px',
      data: {
        message: 'Are you sure you wish to permanently delete this application?',
      },
    });
    this.subscriptions.push(dialogRef.afterClosed().subscribe(
      (confirmation) => {
        if (confirmation) {
          const dialog = this.dialog.open(WaitModalComponent, {
            width: '25%',
            height: '25%',
          });
          this.subscriptions.push(this.applicationsService.deleteApplication(this.selectedApplication).subscribe(
            () => {
              const index = this.applications.findIndex(
                (s) => s.id === this.selectedApplication.id
              );
              if (index > -1) {
                this.applications.splice(index, 1);
                this.newApplication();
                // Change the reference to force the selector to refresh
                this.applications = [...this.applications];
              }
              dialog.close();
            },
            (error) => this.handleError(error, dialog)));
        }
      }));
  }

  importApplication() {

  }

  copyApplication() {
    const application = SharedFunctions.clone(this.selectedApplication);
    application.name = `${this.selectedApplication.name} (Copy)`;
    delete application.id;
    this.selectedApplication = application;
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

  addExecution(event: DndDropEvent) {
    let element = this.createDesignerElement(
      event.data,
      this.selectedApplication.executions
    );
    element.event = event;
    this.addExecutionSubject.next(element);
    this.validateApplication();
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
    this.validateApplication();
  }

  private generateApplication() {
    const application = SharedFunctions.clone(this.selectedApplication);
    const pipelines = [];
    const pipelineIds = [];
    const executions = [];
    const layout = {};
    const connectionKeys = Object.keys(this.designerModel.connections);
    let execution;
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
    const dialogRef = this.dialog.open(WaitModalComponent, {
      width: '25%',
      height: '25%',
    });
    const newApplication = this.generateApplication();
    let observable;
    if (
      this.selectedApplication.id &&
      this.pipelines.findIndex((p) => p.id === this.selectedApplication.id)
    ) {
      observable = this.applicationsService.updateApplication(newApplication);
    } else {
      observable = this.applicationsService.addApplication(newApplication);
    }
    this.subscriptions.push(observable.subscribe(
      (application: Application) => {
        // this.selectedApplication = application;
        this.selectedApplication = JSON.parse(JSON.stringify(application));
        let index = this.applications.findIndex(
          (s) => s.id === this.selectedApplication.id
        );
        if (index === -1) {
          this.applications.push(this.selectedApplication);
        } else {
          this.applications[index] = this.selectedApplication;
        }
        // Change the reference to force the selector to refresh
        this.applications = [...this.applications];
        dialogRef.close();
      },
      (error) => this.handleError(error, dialogRef)
    ));
  }

  private handleError(error, dialogRef) {
    let message;
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      message = error.error.message;
    } else {
      message = error.message;
    }
    dialogRef.close();
    this.dialog.open(ErrorModalComponent, {
      width: '450px',
      height: '300px',
      data: { messages: message.split('\n') },
    });
  }

  cancelApplicationChange() {
    if (this.selectedApplication.id) {
      this.selectedApplication = this.applications.find(a => a.id === this.selectedApplication.id);
    } else {
      this.newApplication();
    }
    this.validateApplication();
  }

  openMapEditor(selectedExecution, attributeName = 'globals') {
    let mappings;
    if (attributeName === 'globals' && !selectedExecution.globals) {
      selectedExecution.globals = {};
      mappings = selectedExecution.globals;
    } else if (attributeName === 'applicationProperties' && !selectedExecution.applicationProperties) {
      selectedExecution.applicationProperties = {};
      mappings = selectedExecution.applicationProperties;
    }
    const editorDialog = this.displayDialogService.openDialog(
      TreeEditorComponent,
      generalDialogDimensions,
      {
        mappings: attributeName === 'globals' ? selectedExecution.globals : selectedExecution.applicationProperties,
        hideMappingParameters: true,
      });
    editorDialog.afterClosed().subscribe((result) => {
      if (result) {
        mappings = result;
      }
      this.validateApplication();
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
    const dialog = this.displayDialogService.openDialog(
      TreeEditorComponent,
      generalDialogDimensions,
      {
        mappings: parameters.parameters,
        hideMappingParameters: true,
      });
    dialog.afterClosed().subscribe((result) => {
      this.validateApplication();
    });
  }

  openGlobalLinksEditor(selectedApplication: Application) {
    let globalLinks = {};
    if (selectedApplication.globals && selectedApplication.globals['GlobalLinks']) {
      globalLinks = selectedApplication.globals['GlobalLinks'];
    }
    const editorDialog = this.displayDialogService.openDialog(
      GlobalLinksEditorComponent,
      generalDialogDimensions,
      {
        executions: selectedApplication.executions,
        globalLinks
      });
    editorDialog.afterClosed().subscribe((result) => {
      if (result) {
        if (!selectedApplication.globals) {
          selectedApplication.globals = {};
        }
        selectedApplication.globals['GlobalLinks'] = result;
      }
      this.validateApplication();
    });
  }

  openClassOverridesEditor() {
    const editorDialog = this.displayDialogService.openDialog(
      ComponentsEditorModalComponent,
      generalDialogDimensions,
      this.selectedApplication);
    editorDialog.afterClosed().subscribe((result) => {
      // if (result) {
      //   if (!selectedApplication.globals) {
      //     selectedApplication.globals = {};
      //   }
      //   selectedApplication.globals['GlobalLinks'] = result;
      // }
      this.validateApplication();
    });
  }
}
