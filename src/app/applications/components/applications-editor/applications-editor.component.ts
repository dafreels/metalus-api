import {DisplayDialogService} from '../../../shared/services/display-dialog.service';
import {PipelinesService} from '../../../pipelines/services/pipelines.service';
import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Application, Execution, ExecutionTemplate} from '../../applications.model';
import {ApplicationsService} from '../../applications.service';
import {Pipeline} from '../../../pipelines/models/pipelines.model';
import {SharedFunctions} from '../../../shared/utils/shared-functions';
import {SparkConfEditorComponent} from '../spark-conf-editor/spark-conf-editor.component';
import {forkJoin, of, Subject, Subscription, throwError, timer} from 'rxjs';
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
import {RunJobComponent} from "../../../jobs/components/jobs/run-job/run-job.component";
import {ProvidersService} from "../../../jobs/services/providers.service";
import {Provider} from "../../../jobs/models/providers.model";
import {Job} from "../../../jobs/models/jobs.model";
import {JobsService} from "../../../jobs/services/jobs.service";
import {MatSnackBar} from '@angular/material/snack-bar';
import {JobsMessageComponent} from "../../../jobs/components/jobs/jobs-message/jobs-message.component";
import {catchError, map} from "rxjs/operators";
import {diff} from 'deep-object-diff';
import {ErrorHandlingComponent} from "../../../shared/utils/error-handling-component";
import {isArray} from "rxjs/internal-compatibility";

@Component({
  selector: 'app-applications-editor',
  templateUrl: './applications-editor.component.html',
  styleUrls: ['./applications-editor.component.scss'],
})
export class ApplicationsEditorComponent extends ErrorHandlingComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvas: ElementRef;
  @ViewChild('designerElement', {static: false}) designerElement: DesignerComponent;
  originalApplication: Application;
  selectedApplication: Application;
  selectedExecution: ExecutionTemplate;
  selectedElement: DesignerElement;
  designerModel: DesignerModel = DesignerComponent.newModel();
  applications: Application[];
  pipelines: Pipeline[];
  availablePipelines: Pipeline[] = [];
  packageObjects: PackageObject[];
  applicationValidator;
  executionTemplates: ExecutionTemplate[] = [{
    description: 'Blank Execution',
    exposePipelineManager: false,
    globals: {},
    id: 'Blank',
    displayName: 'Blank',
    initialPipelineId: '',
    mergeGlobals: false,
    parents: [],
    pipelines: [],
    pipelineListener: {
      className: 'com.acxiom.pipeline.DefaultPipelineListener',
      parameters: {},
    },
    pipelineParameters: { parameters: [] },
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
  private providers: Provider[];
  jobs: Job[];

  constructor(
    private applicationsService: ApplicationsService,
    private executionsService: ExecutionsService,
    private pipelinesService: PipelinesService,
    private stepsService: StepsService,
    private packageObjectsService: PackageObjectsService,
    private displayDialogService: DisplayDialogService,
    public dialog: MatDialog,
    private authService: AuthService,
    private providersService: ProvidersService,
    private jobsService: JobsService,
    private snackBar: MatSnackBar) {
    super(dialog);
    this.user = this.authService.getUserInfo();
    this.subscriptions.push(
      this.authService.userItemSelection.subscribe((data) => {
        if (data.defaultProjectId != this.user.defaultProjectId) {
        if(this.hasChanges) {
          const confirm = this.confirmChanges();
          if(confirm){
            confirm.then(res => {
              if (res){
                this.user = data;
                this.cancelApplicationChange();
                this.loadProjectRelatedData();
                this.newApplication();
                this.loadApplication(this.originalApplication);
              } else {
                this.authService.setUserInfo({ ...this.user });
              }
            })
          }
        } else {
          this.user = data;
          this.cancelApplicationChange();
          this.loadProjectRelatedData();
          this.newApplication();
          this.loadApplication(this.originalApplication);
        }
      }
      }));
  }

  ngOnInit(): void {
    this.loadProjectRelatedData();
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
    this.providersService.getProvidersList().subscribe(result => {
      this.providers = result;
    });
    // Setup job polling timer
    this.subscriptions.push(timer(120000, 120000).subscribe(() => {
      if (this.jobs) {
        const jobRequests = {};
        this.jobs.forEach(job => {
          if (job.lastStatus === 'PENDING' ||
            job.lastStatus === 'RUNNING') {
            jobRequests[job.id] = this.jobsService.getJob(job.providerId, job.id);
          } else {
            jobRequests[job.id] = of(job);
          }
        });
        forkJoin(jobRequests)
          .pipe(map(results => {
              let finalJobs: Job[] = [];
              this.jobs.forEach(job => {
                job = results[job.id];
                finalJobs.push(job);
              });
              return finalJobs;
            }),
            catchError(err => throwError(err)))
          .subscribe(jobs => this.jobs = jobs);
      }
    }));
  }

  private loadProjectRelatedData() {
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
          this.executionTemplates = this.executionTemplates.slice(0,1).concat(executions);
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

  ngOnDestroy(): void {
    this.subscriptions = SharedFunctions.clearSubscriptions(this.subscriptions);
  }

  createNewApplication() {
    if (this.hasApplicationChanged(this.generateApplication())) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        width: '450px',
        height: '200px',
        data: {
          message:
            'You have unsaved changes to the current application. Would you like to continue?',
        },
      });

      this.subscriptions.push(dialogRef.afterClosed().subscribe((confirmation) => {
        if (confirmation) {
          this.newApplication();
        }
      }));
    } else {
      this.newApplication();
    }
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
      // pipelineManager: undefined, // This is to ensure that the system will load the application pipelines by default
      pipelineParameters: { parameters: [] },
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
    this.jobs = [];
    this.errors = [];
  }

  loadApplication(application) {
    if (application.id === this.selectedApplication.id) {
      return;
    }
    this.disableNameEdit();
    if (this.hasApplicationChanged(this.generateApplication())) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        width: '450px',
        height: '200px',
        data: {
          message:
            'You have unsaved changes to the current application. Would you like to continue?',
        },
      });

      this.subscriptions.push(dialogRef.afterClosed().subscribe((confirmation) => {
        if (confirmation) {
          this.handleLoadApplication(application);
        }
      }));
    } else {
      this.handleLoadApplication(application);
    }
  }
  confirmChanges(){
    if (this.hasApplicationChanged(this.generateApplication())) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        width: '450px',
        height: '200px',
        data: {
          message:
            'You have unsaved changes to the current application. Would you like to continue?',
        },
      });
      const confirm = dialogRef.afterClosed().toPromise();
      return confirm;
    }
  }

  handleLoadApplication(application) {
    this.originalApplication = application;
    this.selectedApplication = SharedFunctions.clone(this.originalApplication);
    if (this.selectedApplication.id) {
      this.jobsService.getJobsByApplicationId(this.selectedApplication.id).subscribe(jobs => {
        this.jobs = jobs;
      },(error) => this.handleError(error, null));
    }
    // Create the model from the executions
    const model = DesignerComponent.newModel();
    this.executionLookup = {};
    const pipelineList = this.pipelines;
    this.convertPipelineParameters(this.selectedApplication);
    this.selectedApplication.executions.forEach((execution) => {
      if (execution.executionId && !execution['template']) {
        const template = this.executionTemplates.find((e) => e.id === execution.executionId);
        if (template) {
          execution['template'] = template.template;
        }
      }
      this.createModelNode(model, execution, -1, -1);
      execution.pipelines = [];
      execution.pipelineIds.forEach(pid => execution.pipelines.push(pipelineList.find(p => p.id === pid)));
      if (execution.evaluationPipelineIds) {
        execution.evaluationPipelines = [];
        execution.evaluationPipelineIds.forEach(pid => execution.evaluationPipelines.push(pipelineList.find(p => p.id === pid)));
      }
    });
    // Create connections
    const connectedNodes = [];
    let connection;
    this.selectedApplication.executions.forEach((execution) => {
      this.convertPipelineParameters(execution);
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
        DesignerComponent.performAutoLayout(model, this.designerElement);
        if (!this.selectedApplication.layout) {
          this.selectedApplication.layout = {};
        }
        Object.keys(model.nodes).forEach(k => {
          this.selectedApplication.layout[model.nodes[k].data.data.id] = {
            x: model.nodes[k].x,
            y: model.nodes[k].y,
          };
        });
    }
    this.designerModel = model;
    this.validateApplication();
  }

  private convertPipelineParameters(obj) {
    if (isArray(obj.pipelineParameters)) {
      obj.pipelineParameters = {
        parameters: obj.pipelineParameters
      };
    }
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
    const executionIds = [];
    newApplication.executions.forEach((exe) => {
      if (executionIds.indexOf(exe.id) !== -1) {
        errors.push({
          component: 'execution',
          field: 'id',
          message: `must be unique (${exe.id})`
        });
      }
      if (exe.id === 'Blank') {
        errors.push({
          component: 'execution',
          field: 'id',
          message: 'must not be named Blank'
        });
      }
      if (exe.id.trim().length === 0) {
        errors.push({
          component: 'execution',
          field: 'id',
          message: 'must not be empty'
        });
      }
      if (!exe.pipelineIds || exe.pipelineIds.length === 0) {
        errors.push({
          component: 'execution',
          field: 'pipelines',
          message: `requires at least one for (${exe.id})`
        });
      }
      executionIds.push(exe.id);
    });
    this.errors = errors;
  }

  get hasChanges() {
    return this.hasApplicationChanged(this.generateApplication());
  }

  hasApplicationChanged(application: Application) {
    const difference = diff(this.originalApplication, application);
    delete difference['project'];
    delete difference['layout'];
    console.log(`Application differences: ${Object.entries(difference).length}`);
    console.log(`Application differences: ${Object.entries(difference)}`);
    console.log(`Application differences: ${JSON.stringify(difference, null, 4)}`);
    return Object.entries(difference).length !== 0;
  }

  handleElementAction(action: DesignerElementAction) {
    if (action.action === 'addOutput') {
      this.addExecutionOutput.next({
        element: action.element,
        output: `output-${new Date().getTime()}`,
      });
    }
  }

  handleExecutionSelection(event: DesignerElement) {
    const execution = event.data as ExecutionTemplate;
    // pipelineIds override pipelines
    if (execution.pipelineIds && execution.pipelineIds.length > 0) {
      execution.pipelines = this.convertPipelineIds(execution.pipelineIds, execution.pipelines || []);
    } else {
      execution.pipelines = execution.pipelines || [];
    }
    const pipelines = execution.pipelines
    if (execution.evaluationPipelineIds && execution.evaluationPipelineIds.length > 0) {
      execution.evaluationPipelines = this.convertPipelineIds(execution.evaluationPipelineIds, execution.evaluationPipelines || []);
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
    this.selectedElement = event;
    this.selectedExecution = execution;
  }

  private convertPipelineIds(pipelineIds, executionPipelines: Pipeline[]) {
    let pipeline;
    const pipelines: Pipeline[] = [];
    pipelineIds.forEach((id) => {
      // See if the execution pipelines have the pipeline we need
      pipeline = executionPipelines.find(p => p.id === id);
      // Grab it from the global pipelines
      if (!pipeline) {
        pipeline = this.pipelines.find(p => p.id === id);
      }
      pipelines.push(pipeline);
      pipeline = null;
    });
    return pipelines;
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
            }, (error) => this.handleError(error, dialog)));
        }
      }));
  }

  importApplication() {
    const importApplicationDialogData = {
      code: '',
      language: 'json',
      allowSave: true,
    };
    const importDialog = this.displayDialogService.openDialog(
      CodeEditorComponent,
      generalDialogDimensions,
      importApplicationDialogData
    );
    this.subscriptions.push(
      importDialog.afterClosed().subscribe((result) => {
        if (result && result.code.trim().length > 0) {
          try {
            const application = JSON.parse(result.code);
            delete application._id;
            this.loadApplication(application);
          } catch (error) {
            this.dialog.open(ErrorModalComponent, {
              width: '450px',
              data: {
                messages: ['Unable to parse the JSON', error],
              },
            });
          }
        }
      }));
  }

  copyApplication() {
    const application = SharedFunctions.clone(this.selectedApplication);
    application.name = `${this.selectedApplication.name} (Copy)`;
    delete application.id;
    this.selectedApplication = application;
  }

  exportApplication() {
    const application = this.generateApplication();
    delete application._id;
    delete application.project;
    delete application.creationDate;
    delete application.modifiedDate;
    const exportApplicationDialogData = {
      code: JSON.stringify(application, null, 4),
      language: 'json',
      allowSave: false,
      exportFileName:`${application.name}-${application.id}.json`
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

  private generateApplication(includePipelines = false) {
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
      if (execution.globals && Object.keys(execution.globals).length === 0) {
        delete execution.globals;
      }
      delete execution.template; // Remove the form template
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
        execution.pipelineIds = this.updatePipelineIds(execution.pipelines);
        delete execution.pipelines;
      }
      if (execution.evaluationPipelines && execution.evaluationPipelines.length > 0) {
        execution.evaluationPipelineIds = this.updatePipelineIds(execution.evaluationPipelines);
        delete execution.evaluationPipelines;
      }
    });
    if (includePipelines) {
      application.pipelines = pipelines;
    }
    application.executions = executions;
    application.layout = layout;
    application.project = this.user.projects.find(p => p.id === this.user.defaultProjectId);
    return application;
  }

  private updatePipelineIds(pipelines) {
    const pipelineIds = [];
    let stepParameter;
    pipelines.forEach((pipeline) => {
      pipelineIds.push(pipeline.id);
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
    return pipelineIds;
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
    // TODO Ensure that pipelineIds get converted to pipelines
    // Set the executionId to the id of the dropped execution
    if (!execution.executionId) {
      execution.executionId = execution.id;
    }
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
    const application = this.generateApplication(true);
    delete application.layout;
    this.loadApplication(application);
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
    this.subscriptions.push(observable.subscribe((application: Application) => {
        this.selectedApplication = JSON.parse(JSON.stringify(application));
        let index = this.applications.findIndex((s) => s.id === this.selectedApplication.id);
        if (index === -1) {
          this.applications.push(this.selectedApplication);
        } else {
          this.applications[index] = this.selectedApplication;
        }
        // Change the reference to force the selector to refresh
        this.applications = [...this.applications];
        dialogRef.close();
      }, (error) => this.handleError(error, dialogRef)
    ));
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
    if (attributeName === 'globals' &&
      Object.keys(selectedExecution.globals || {}).length === 0) {
      let pipelineMappings = {};
      const pipelineIds = [];
      if (selectedExecution.executions) {
        selectedExecution.executions.forEach(execution => {
          this.extractGlobals(execution, pipelineIds, pipelineMappings);
        });
      } else {
        this.extractGlobals(selectedExecution, pipelineIds, pipelineMappings);
      }
      selectedExecution.globals = pipelineMappings;
    } else if (attributeName === 'applicationProperties' &&
      Object.keys(selectedExecution.applicationProperties || {}).length === 0) {
      selectedExecution.applicationProperties = {};
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
        if (attributeName === 'globals') {
          selectedExecution.globals = result;
        } else {
          selectedExecution.applicationProperties = result;
        }
      }
      this.validateApplication();
    });
  }

  // TODO Refactor to use the extractPipelineParameters from run job once it has been moved
  private extractGlobals(selectedExecution, pipelineIds: string[], pipelineMappings: object) {
    let pipeline;
    selectedExecution.pipelineIds.forEach(pipelineId => {
      if (pipelineIds.indexOf(pipelineId) === -1) {
        pipelineIds.push(pipelineId);
        pipeline = this.pipelines.find(p => p.id === pipelineId);
        Object.assign(pipelineMappings, SharedFunctions.generatePipelineMappings(pipeline));
      }
    });
  }

  openPipelineParametersEditor(pipeline: Pipeline, execution: boolean = true) {
    if (!this.selectedExecution.pipelineParameters) {
      this.selectedExecution.pipelineParameters = { parameters: [] };
    }
    let parameters = execution ? this.selectedExecution.pipelineParameters.parameters.find(p => p.pipelineId === pipeline.id) :
    this.selectedApplication.pipelineParameters.parameters.find(p => p.pipelineId === pipeline.id);
    if (!parameters) {
      parameters = {
        pipelineId: pipeline.id,
        parameters: Object.assign(SharedFunctions.generatePipelineMappings(pipeline, '?'),
          SharedFunctions.generatePipelineMappings(pipeline, '$')),
      };
      this.selectedExecution.pipelineParameters.parameters.push(parameters);
    }
    const dialog = this.displayDialogService.openDialog(
      TreeEditorComponent,
      generalDialogDimensions,
      {
        mappings: parameters.parameters,
        hideMappingParameters: true,
      });
    dialog.afterClosed().subscribe(() => {
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
    editorDialog.afterClosed().subscribe(() => {
      // if (result) {
      //   if (!selectedApplication.globals) {
      //     selectedApplication.globals = {};
      //   }
      //   selectedApplication.globals['GlobalLinks'] = result;
      // }
      this.validateApplication();
    });
  }

  openPropertiesEditor() {
    const mappings = this.generatedRequiredAndStepPackages();
    if (this.selectedApplication.requiredParameters && this.selectedApplication.requiredParameters.length > 0) {
      mappings['requiredParameters'] = this.selectedApplication.requiredParameters;
    }
    if (this.selectedApplication.stepPackages && this.selectedApplication.stepPackages.length > 0) {
      mappings['stepPackages'] = this.selectedApplication.stepPackages;
    }
    const dialog = this.displayDialogService.openDialog(
      TreeEditorComponent,
      generalDialogDimensions,
      {
        mappings,
        hideMappingParameters: true,
      });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedApplication.requiredParameters = result.requiredParameters;
        this.selectedApplication.stepPackages = result.stepPackages;
        this.validateApplication();
      }
    });
  }

  private generatedRequiredAndStepPackages() {
    const packages = [];
    const requiredFields = [];
    this.selectedApplication.executions.forEach((execution) => {
      execution.pipelines.forEach((pipeline) => {
        pipeline.steps.forEach((step) => {
          packages.push(step.engineMeta.pkg);
          step.params.forEach((param) => {
            if (param.required && typeof param.value === 'string' &&
              param.value.startsWith('!') && param.value.indexOf('||') === -1) {
              requiredFields.push(param.value.substring(1));
            }
          });
        });
      });
    });
    return {
      stepPackages: packages.filter((value, index, self) => self.indexOf(value) === index),
      requiredParameters: requiredFields.filter((value, index, self) => self.indexOf(value) === index)
    };
  }

  runJob() {
    const addDialog = this.displayDialogService.openDialog(
      RunJobComponent,
      generalDialogDimensions,
      {
        providers: this.providers,
        jobs: this.jobs,
        application: this.selectedApplication
      }
    );
    addDialog.afterClosed().subscribe((result) => {
      if (result) {
        const dialogRef = this.displayDialogService.openDialog(
          WaitModalComponent, {
            width: '25%',
            height: '25%',
          });
        this.jobsService.getJobsByApplicationId(this.selectedApplication.id).subscribe(jobs => {
          dialogRef.close();
          this.jobs = jobs;
        });
      }
    });
  }

  showJobs() {
    this.snackBar.openFromComponent(JobsMessageComponent, {
      data: this.jobs,
      duration: 3000,
      horizontalPosition: 'start',
      verticalPosition: 'top'
    })
  }

  templateValueChanged(value) {
    const execution = SharedFunctions.mergeDeep(this.selectedExecution, value);
    this.selectedExecution = Object.assign(this.selectedExecution, execution);
  }

  removeExecutionPipeline(pipeline: Pipeline, evaluation: boolean) {
    const pipelineList = evaluation ? this.selectedExecution.evaluationPipelines : this.selectedExecution.pipelines;
    pipelineList.splice(pipelineList.findIndex(p => p.id === pipeline.id), 1);
    this.validateApplication();
  }

  appendPipeline(pipeline: Pipeline, evaluation: boolean) {
    if (evaluation && !this.selectedExecution.evaluationPipelines) {
      this.selectedExecution.evaluationPipelines = [];
    }
    const pipelineList = evaluation ? this.selectedExecution.evaluationPipelines : this.selectedExecution.pipelines;
    pipelineList.push(pipeline);
    this.validateApplication();
  }
}
