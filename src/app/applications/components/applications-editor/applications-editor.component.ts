import {DisplayDialogService} from '../../../shared/services/display-dialog.service';
import {PipelinesService} from '../../../pipelines/services/pipelines.service';
import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Application, Execution, ExecutionTemplate, RunTimeProfile} from '../../applications.model';
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
import {Step} from "../../../steps/steps.model";
import {ActivatedRoute} from "@angular/router";
import {SchemaEditorModalComponent} from "../../../shared/components/schema-editor/modal/schema-editor-modal.component";
import {PrimitiveEditorDialogComponent} from "../primitive-editor/primitive-editor-dialog.component";
import {ConnectorsModalComponent} from "../../../shared/components/connectors/modal/connectors-modal.component";

@Component({
  selector: 'app-applications-editor',
  templateUrl: './applications-editor.component.html',
  styleUrls: ['./applications-editor.component.scss'],
})
export class ApplicationsEditorComponent extends ErrorHandlingComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: false }) canvas: ElementRef;
  @ViewChild('designerElement', {static: false}) designerElement: DesignerComponent;
  zoomSubject: Subject<number> = new Subject<number>();
  zoomRatio = 1;
  originalApplication: Application;
  selectedApplication: Application;
  selectedExecution: ExecutionTemplate;
  executionParameterMap: object;
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
  private steps: Step[];

  useRuntimeProfile = false;
  runTimeProfile: RunTimeProfile;

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
    private snackBar: MatSnackBar,
    route: ActivatedRoute) {
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
    route.queryParams
      .subscribe(params => {
          this.useRuntimeProfile = params.useRuntimeProfile && params.useRuntimeProfile.toLowerCase() === 'true';
        }
      );
    // this.useRuntimeProfile = true;
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
    this.stepsService.getSteps(true).subscribe((steps: Step[]) => {
      this.steps = steps;
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
    if (this.useRuntimeProfile) {
      this.runTimeProfile = {
        parameters: {},
        mappings: {
          globals: {},
          pipeline: {}
        },
        executions: {},
        steps: {}
      };
    }
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
    ApplicationsEditorComponent.convertPipelineParameters(this.selectedApplication);
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
      ApplicationsEditorComponent.convertPipelineParameters(execution);
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
    if (!this.selectedApplication.layout ||
      Object.keys(this.selectedApplication.layout).length === 0) {
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
    // Create the runtime profile if it doesn't exist
    if (this.useRuntimeProfile) {
      this.applicationsService.getRuntimeProfile(this.selectedApplication.id).subscribe((profile) => {
        if (profile) {
          this.runTimeProfile = profile;
        } else {
          this.runTimeProfile = this.createRunProfile(this.selectedApplication);
        }
      });
    }
    this.designerModel = model;
    this.validateApplication();
  }

  modelChanged(event) {
    // Handle elements being removed
    if (Object.keys(event.nodes).length < this.selectedApplication.executions.length) {
      const executions = Object.keys(event.nodes).map(key => event.nodes[key].data.name);
      this.selectedApplication.executions.forEach((exe, index) => {
        if (executions.indexOf(exe.id) === -1) {
          // this.selectedApplication.executions.splice(index, 1);
          this.removeExecutionRuntimeProfile(exe, this.runTimeProfile);
        }
      });
    }
  }

  private static convertPipelineParameters(obj) {
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
    this.parseExecutionParameters(execution);
    this.selectedElement = event;
    this.selectedExecution = execution;
  }

  private parseExecutionParameters(execution: ExecutionTemplate) {
    // Group the parameters for this execution by pipeline/step
    if (this.useRuntimeProfile && this.runTimeProfile.executions[execution.id]) {
      const parameterMap = {};
      let entry;
      let paramId;
      let param;
      Object.keys(this.runTimeProfile.executions[execution.id].parameters).forEach((key) => {
        entry = this.runTimeProfile.executions[execution.id].parameters[key];
        paramId = `${entry.pipelineId}::${entry.stepId}`
        if (parameterMap[paramId]) {
          param = parameterMap[paramId];
        } else {
          param = {
            stepId: entry.stepId,
            entries: [],
          };
          parameterMap[paramId] = param;
        }
        if (this.runTimeProfile.parameters[entry.paramId] && this.runTimeProfile.parameters[entry.paramId].required) {
          param.required = true;
        }
        param.entries.push(entry);
      });
      this.executionParameterMap = parameterMap;
    }
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
    const runtime = SharedFunctions.clone(this.runTimeProfile || {});
    application.name = `${this.selectedApplication.name} (Copy)`;
    delete application.id;
    delete runtime.applicationId;
    delete runtime.id;
    this.selectedApplication = application;
    this.runTimeProfile = runtime;
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
    this.addExecutionRuntimeProfile(event.data, this.runTimeProfile, this.selectedApplication);
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
      const originalId = this.selectedElement.name;
      this.selectedElement.name = this.selectedExecution.id;
      if (this.useRuntimeProfile) {
        this.runTimeProfile.executions[this.selectedExecution.id] = this.runTimeProfile.executions[originalId];
        delete this.runTimeProfile.executions[originalId];
      }
    }
  }

  changeZoom(increase: boolean) {
    this.zoomRatio += (increase ? 0.25 : -0.25);
    this.zoomSubject.next(this.zoomRatio);
  }

  resetZoom() {
    this.zoomRatio = 1;
    this.zoomSubject.next(this.zoomRatio);
  }

  private generateApplication(includePipelines = false) {
    const application = SharedFunctions.clone(this.selectedApplication);
    const pipelines = [];
    const executions = [];
    const layout = {};
    const connectionKeys = Object.keys(this.designerModel.connections);
    let execution;
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
    if (this.selectedApplication.id &&
      this.pipelines.findIndex((p) => p.id === this.selectedApplication.id)) {
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
        if (this.useRuntimeProfile) {
          if (!this.runTimeProfile.applicationId) {
            this.runTimeProfile.applicationId = this.selectedApplication.id;
            delete this.runTimeProfile.id;
          }
          if (this.runTimeProfile.id) {
            observable = this.applicationsService.updateRuntimeProfile(this.runTimeProfile);
          } else {
            observable = this.applicationsService.addRuntimeProfile(this.runTimeProfile);
          }
          this.subscriptions.push(observable.subscribe((profile) => {
            this.runTimeProfile = profile;
            // Change the reference to force the selector to refresh
            this.applications = [...this.applications];
            dialogRef.close();
          }, (error) => this.handleError(error, dialogRef)));
        } else {
          // Change the reference to force the selector to refresh
          this.applications = [...this.applications];
          dialogRef.close();
        }
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
        application: this.selectedApplication,
        runTimeProfile: this.runTimeProfile,
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
    this.removePipelineRuntimeProfile(pipeline, this.selectedExecution, this.runTimeProfile);
    this.validateApplication();
  }

  appendPipeline(pipeline: Pipeline, evaluation: boolean) {
    if (evaluation && !this.selectedExecution.evaluationPipelines) {
      this.selectedExecution.evaluationPipelines = [];
    }
    const pipelineList = evaluation ? this.selectedExecution.evaluationPipelines : this.selectedExecution.pipelines;
    pipelineList.push(pipeline);
    this.addPipelineRuntimeProfile(pipeline, this.selectedExecution, this.runTimeProfile, this.selectedApplication);
    this.parseExecutionParameters(this.selectedExecution);
    this.validateApplication();
  }

  openParameterEditor(paramName, mapping, applicationLevel, globalLink) {
    // Get the step parameter
    const parameter = this.runTimeProfile.parameters[paramName];
    let dialog;
    if (parameter) {
      // The type will determine the editor
      if (mapping.isGlobalLink || globalLink) {
        dialog = this.displayDialogService.openDialog(
          GlobalLinksEditorComponent,
          generalDialogDimensions,
          {
            executions: Array.from(this.getParentExecutions(this.selectedExecution).values()),
            globalLinks: this.getMappingValue(mapping, {}, applicationLevel),
            addName: mapping.mappingName,
          });
      } else if (SharedFunctions.isConnector(this.runTimeProfile.parameters[paramName].parameterType)) {
        dialog = this.displayDialogService.openDialog(
          ConnectorsModalComponent,
          generalDialogDimensions,
          {
            connector: this.getMappingValue(mapping, {}, applicationLevel),
            showEmbeddedVariablesToggle: true
          });
      } else {
        switch (parameter.type) {
          case 'script':
            dialog = this.displayDialogService.openDialog(
              CodeEditorComponent,
              generalDialogDimensions,
              {
                code: this.getMappingValue(mapping, '', applicationLevel),
                language: parameter.language,
                allowSave: true,
              });
            break;
          case 'object':
            if (parameter.className === 'com.acxiom.pipeline.steps.Schema') {
              dialog = this.displayDialogService.openDialog(
                SchemaEditorModalComponent,
                generalDialogDimensions,
                this.getMappingValue(mapping, {
                  attributes: []
                }, applicationLevel));
            } else {
              let component: any = TreeEditorComponent;
              let data: object = {
                mappings: this.getMappingValue(mapping, {}, applicationLevel),
              };
              const pkg = this.packageObjects.find(p => p.id === parameter.className);
              if (parameter.className && pkg && pkg.template) {
                // See if the className is set and then see if there is a form that can be used
                component = PrimitiveEditorDialogComponent;
                data = {
                  value: data['mappings'],
                  template: pkg.template
                }
              }
              dialog = this.displayDialogService.openDialog(
                component,
                generalDialogDimensions,
                data,
              );
            }
            break;
          case 'list':
            dialog = this.displayDialogService.openDialog(
              TreeEditorComponent,
              generalDialogDimensions,
              {
                mappings: this.getMappingValue(mapping, [], applicationLevel),
              }
            );
            break;
          default:
            dialog = this.displayDialogService.openDialog(
              PrimitiveEditorDialogComponent,
              {
                width: '35%',
                height: '25%',
              },
              this.getMappingValue(mapping, '', applicationLevel));
        }
      }
      if (dialog) {
        dialog.afterClosed().subscribe((value) => {
          if (value) {
            this.setMappingParameter(paramName, applicationLevel, mapping, value, globalLink);
          }
          this.validateApplication();
        });
      }
    }
  }

  private setMappingParameter(paramId, applicationLevel, mapping, value, globalLink) {
    const parent = applicationLevel ? this.selectedApplication : this.selectedExecution;
    let mappingLoc = 'globals';
    let mappingKey = mapping.mappingName;
    const executionParameter = this.runTimeProfile.executions[this.selectedExecution.id].parameters[paramId];
    const executionId = executionParameter.executionId;
    const pipelineId = executionParameter.pipelineId;
    const stepId = executionParameter.stepId;
    if (mapping.type === 'global') {
      parent.globals[mapping.mappingName] = value;
    } else {
      mappingLoc = 'pipeline';
      mappingKey = `${pipelineId}_${mapping.mappingName}`;
      let parameters = parent.pipelineParameters.parameters.find(p => p.pipelineId === pipelineId);
      if (!parameters) {
        parameters = {
          pipelineId: pipelineId,
          parameters: {}
        };
        parent.pipelineParameters.parameters.push(parameters);
      }
      parameters.parameters[mapping.mappingName] = value;
    }
    let mappingRef = this.runTimeProfile.mappings[mappingLoc][mappingKey].references.find(m =>
      m.executionId === this.selectedExecution.id &&
      m.pipelineId === pipelineId &&
      m.stepId === stepId);
    if (!mappingRef) {
      mappingRef = {
        executionId: this.selectedExecution.id,
        pipelineId: pipelineId,
        stepId: stepId,
        level: (applicationLevel ? 'application' : 'execution'),
        populated: true,
        isGlobalLink: globalLink
      };
      this.runTimeProfile.mappings[mappingLoc][mappingKey].references.push(mappingRef);
    }
    mappingRef.populated = true;
    mappingRef.isGlobalLink = globalLink;
    mappingRef.level = applicationLevel ? 'application' : 'execution';
    mapping.level = applicationLevel ? 'application' : 'execution';
    mapping.populated = true;
    mapping.isGlobalLink = globalLink;
    // Find other instances of this mapping and mark them populated at the appropriate level
    this.runTimeProfile.mappings[mappingLoc][mappingKey].references
      .filter(r => (r.level === mapping.level || !r.populated) &&
          (mapping.level === 'application' || r.executionId === executionId))
      .forEach((ref) => {
        // Update the reference
        ref.populated = mapping.populated;
        ref.isGlobalLink = mapping.isGlobalLink;
        ref.level = mapping.level;
        // Navigate to the execution mapping and update
        this.runTimeProfile.parameters[ref.paramId].required = false;
        this.runTimeProfile.executions[ref.executionId].parameters[ref.paramId].mappings
          .filter(m => m.mappingName === mapping.mappingName).forEach((m) => {
          m.populated = mapping.populated;
          m.isGlobalLink = mapping.isGlobalLink;
          m.level = mapping.level;
        });
      });
    this.runTimeProfile.parameters[paramId].required = false;
    this.parseExecutionParameters(this.selectedExecution);
  }

  private getParentExecutions(execution, parents = new Map()) {
    let parent;
    if (execution.parents && execution.parents.length > 0) {
      execution.parents.forEach(executionId => {
        parent = this.selectedApplication.executions.find(e => e.id === executionId);
        if (!parents.has(executionId)) {
          parents.set(executionId, parent);
          this.getParentExecutions(parent, parents);
        }
      });
    }
    return parents;
  }

  private getMappingValue(mapping, defaultValue, applicationLevel) {
    let mappings = defaultValue;
    const obj = applicationLevel || mapping.level === 'application' ? this.selectedApplication : this.selectedExecution;
    if (mapping.populated) {
      if (mapping.isGlobalLink && obj.globals['GlobalLinks']) {
        mappings = obj.globals['GlobalLinks'][mapping.mappingName];
      } else if (mapping.type === 'global') {
        mappings = obj.globals[mapping.mappingName];
      } else {
        mappings = obj.pipelineParameters.parameters.find(p => p.pipelineId === mapping.pipelineId)[mapping.mappingName];
      }
    }
    return mappings;
  }

  /**
   * Creates a run profile for a given application.
   * @param application The application to use for the run profile.
   */
  createRunProfile(application: Application): RunTimeProfile {
    if (!this.useRuntimeProfile) {
      return null;
    }
    const runTimeProfile = {
      applicationId: application.id,
      parameters: {},
      mappings: {
        globals: {},
        pipeline: {}
      },
      executions: {},
      steps: {}
    };
    application.executions.forEach(execution => this.addExecutionRuntimeProfile(execution, runTimeProfile, application));
    return runTimeProfile;
  }

  /**
   * Called when an execution is added to an application.
   * @param execution The execution to process
   * @param runTimeProfile The current run time profile
   * @param application The owner application
   */
  private addExecutionRuntimeProfile(execution, runTimeProfile, application) {
    if (!this.useRuntimeProfile) {
      return;
    }
    // Create the execution lookup
    if (!runTimeProfile.executions[execution.id]) {
      runTimeProfile.executions[execution.id] = {
        parameters: {}
      };
    }
    let pipelines;
    // Get all the pipelines for this execution
    pipelines = this.gatherPipelines(execution.pipelines, execution.pipelineIds);
    pipelines.concat(this.gatherPipelines(execution.evaluationPipelines, execution.evaluationPipelineIds));
    // Iterate the pipelines building the profile
    pipelines.forEach(pipeline => this.addPipelineRuntimeProfile(pipeline, execution, runTimeProfile, application));
  }

  /**
   * Called when an execution is removed to clean up the runtime profile.
   *
   * @param execution The execution that owned the pipeline
   * @param runTimeProfile The profile to update
   */
  private removeExecutionRuntimeProfile(execution, runTimeProfile) {
    if (!this.useRuntimeProfile) {
      return;
    }
    let pipelines;
    // Get all the pipelines for this execution
    pipelines = this.gatherPipelines(execution.pipelines, execution.pipelineIds);
    pipelines.concat(this.gatherPipelines(execution.evaluationPipelines, execution.evaluationPipelineIds));
    // Iterate the pipelines building the profile
    pipelines.forEach(pipeline => this.removePipelineRuntimeProfile(pipeline, execution, runTimeProfile));

    delete runTimeProfile.executions[execution.id];
  }

  /**
   * Called when a pipeline is removed from an execution to clean up the runtime profile.
   *
   * @param pipeline The pipeline being removed
   * @param execution The execution that owned the pipeline
   * @param runTimeProfile The profile to update
   */
  private removePipelineRuntimeProfile(pipeline, execution, runTimeProfile) {
    if (!this.useRuntimeProfile) {
      return;
    }
    let paramId;
    let mappedEntity;
    let mappedKey;
    pipeline.steps.forEach((step) => {
      if (step.params && step.params.length > 0) {
        step.params.forEach((param) => {
          paramId = `${step.id}_${pipeline.id}_${param.name}`;
          // Remove any mapped values that only exist for this execution.pipeline.step.param combination
          if (runTimeProfile.executions[execution.id].parameters[paramId]) {
            runTimeProfile.executions[execution.id].parameters[paramId].mappings.forEach((mapping) => {
              if (mapping.defaultMapping) {
                // Nothing to do here, just want to catch the condition and ignore
              } else if (mapping.type === 'global') {
                if (runTimeProfile.mappings.globals[mapping.mappingName]) {
                  mappedEntity = runTimeProfile.mappings.globals[mapping.mappingName];
                  mappedKey = mapping.mappingName;
                }
              } else {
                mappedKey = `${pipeline.id}_${mapping.mappingName}`;
                if (runTimeProfile.mappings.pipeline[mappedKey]) {
                  mappedEntity = runTimeProfile.mappings.pipeline[mappedKey];
                }
              }
              if (mappedEntity) {
                const indexes = [];
                mappedEntity.references.forEach((ref, index) => {
                  if (ref.executionId === execution.id &&
                    ref.pipelineId === pipeline.id &&
                    ref.stepId === step.id) {
                    indexes.push(index);
                  }
                });
                indexes.reverse().forEach(index => mappedEntity.references.splice(index, 1));
              }
            });
            // Remove the execution parameter
            delete runTimeProfile.executions[execution.id].parameters[paramId];
          }
          // Remove the parameter
          delete runTimeProfile.parameters[paramId];
        });
      }
    });
  }

  /**
   * Used to clean out unused mappings from the globals and pipeline parameters.
   * @param runTimeProfile The runTimeProfile to use
   * @param application The application to clean
   */
  private cleanUnusedMappings(runTimeProfile, application) {
    if (!this.useRuntimeProfile) {
      return;
    }
    Object.keys(runTimeProfile.mappings.globals).forEach((key) => {
      if (runTimeProfile.mappings.globals[key].references.length === 0) {
        delete runTimeProfile.mappings.globals[key];
        delete application.globals[key];
        application.executions.forEach(exe => delete exe.globals[key]);
      }
    });
    // execution.pipelineParameters.parameters <-- keyed by pipeline id
    let pipelineId;
    let mapping;
    let pipelineMappings;
    Object.keys(runTimeProfile.mappings.pipeline).forEach((key) => {
      if (runTimeProfile.mappings.pipeline[key].references.length === 0) {
        delete runTimeProfile.mappings.pipeline[key];
        pipelineId = key.split('_')[0];
        mapping = key.split('_')[1];
        if (application.pipelineParameters && application.pipelineParameters.parameters) {
          pipelineMappings = application.pipelineParameters.parameters.find(p => p.pipelineId === pipelineId) || {};
          delete pipelineMappings[mapping];
        }
        application.executions.forEach((exe) => {
          if (exe.pipelineParameters && exe.pipelineParameters.parameters) {
            pipelineMappings = exe.pipelineParameters.parameters.find(p => p.pipelineId === pipelineId) || {};
            delete pipelineMappings[mapping];
          }
        });
      }
    });
  }

  /**
   * Called when a pipeline is added to an execution.
   * @param pipeline The pipeline to process
   * @param execution The execution to process
   * @param runTimeProfile The current run time profile
   * @param application The owner application
   */
  private addPipelineRuntimeProfile(pipeline, execution, runTimeProfile, application) {
    if (!this.useRuntimeProfile) {
      return;
    }
    let value;
    let values;
    let paramId;
    let stepTemplate;
    let paramTemplate;
    pipeline.steps.forEach((step) => {
      if (step.params && step.params.length > 0) {
        step.params.forEach((param) => {
          value = param.value || param.defaultValue;
          if (value && typeof value === 'string' &&
            (value.indexOf('!') === 0 || value.indexOf('$') === 0 || value.indexOf('?') === 0)) {
            values = value.split('||').map((s) => s.trim());
            values.forEach((v, index) => {
              const type = SharedFunctions.getType(v, 'text');
              paramId = `${step.id}_${pipeline.id}_${param.name}`;
              switch (type) {
                case 'global':
                case 'runtime':
                case 'mapped_runtime':
                  let v1 = SharedFunctions.trimSpecialCharacter(v);
                  // Create the parameter lookup
                  if (!runTimeProfile.executions[execution.id].parameters[paramId]) {
                    runTimeProfile.executions[execution.id].parameters[paramId] = {
                      setAtRuntime: false,
                      pipelineId: pipeline.id,
                      stepId: step.id,
                      paramName: param.name,
                      paramId,
                      mappings: [{
                        index,
                        mappingName: v1,
                        type: type === 'global' ? type : 'pipeline',
                        originalType: type,
                      }]
                    };
                  } else {
                    runTimeProfile.executions[execution.id].parameters[paramId].mappings.push({
                      index,
                      mappingName: v1,
                      type: type === 'global' ? type : 'pipeline',
                      originalType: type,
                      pipelineId: pipeline.id,
                      stepId: step.stepId,
                    });
                  }
                  // Keep the mappings in index order
                  runTimeProfile.executions[execution.id].parameters[paramId].mappings.sort((e1, e2) => e1.index - e2.index);
                  // Create a parameter lookup
                  if (!runTimeProfile.parameters[paramId]) {
                    stepTemplate = this.steps.find(s => s.id === step.stepId) || { params: [] };
                    paramTemplate = stepTemplate.params.find(p => p.name === param.name) || {};
                    runTimeProfile.parameters[paramId] = {
                      name: param.name || paramTemplate.displayName,
                      type: paramTemplate.type,
                      language: paramTemplate.language,
                      className: paramTemplate.className,
                      parameterType: paramTemplate.parameterType,
                      description: param.description || paramTemplate.description,
                      required: paramTemplate.required || false,
                      stepId: step.stepId,
                    };
                  }
                  if (!runTimeProfile.steps[step.id]) {
                    runTimeProfile.steps[step.id] = {
                      name: step.displayName,
                      description: step.description
                    }
                  }
                  const dotIndex = v1.indexOf('.');
                  if (dotIndex > -1) {
                    v1 = v1.substring(0, dotIndex);
                  }
                  // Add this location
                  const populated = this.addRuntimeParameterLocation(type, execution, v1, runTimeProfile, application, pipeline, step, paramId);
                  if (populated) {
                    runTimeProfile.parameters[paramId].required = false;
                  }
                  break;
                case 'text':
                  if (runTimeProfile.parameters[paramId]) {
                    runTimeProfile.parameters[paramId].required = false;
                  }
                  // Push the static value to the already existing mappings
                  runTimeProfile.executions[execution.id].parameters[paramId].mappings.push({
                    index,
                    mappingName: v,
                    type,
                    originalType: type,
                    pipelineId: pipeline.id,
                    stepId: step.stepId,
                    defaultMapping: true,
                  });
                  break;
                default:
              }
            });
          }
        });
      }
    });
  }

  private addRuntimeParameterLocation(type, execution, mappingName, runTimeProfile, application, pipeline, step, paramId) {
    let level = 'execution'
    let populated = false;
    let isGlobalLink = false;
    if (type === 'global') {
      if (execution.globals && execution.globals.GlobalLinks && execution.globals.GlobalLinks[mappingName]) {
        isGlobalLink = true;
        populated = true;
      } else if (execution.globals && execution.globals[mappingName]) {
        populated = true;
      } else if (application.globals && application.globals.GlobalLinks && application.globals.GlobalLinks[mappingName]) {
        level = 'application';
        isGlobalLink = true;
        populated = true;
      } else if (application.globals && application.globals[mappingName]) {
        level = 'application';
        populated = true;
      }

      if (!runTimeProfile.mappings.globals[mappingName]) {
        runTimeProfile.mappings.globals[mappingName] = {
          references: []
        };
      }
      if (!runTimeProfile.mappings.globals[mappingName].references.find(r => r.executionId === execution.id &&
        r.pipelineId == pipeline.id &&
      r.stepId === step.id)) {
        runTimeProfile.mappings.globals[mappingName].references.push({
          executionId: execution.id,
          pipelineId: pipeline.id,
          stepId: step.id,
          level,
          populated,
          isGlobalLink,
          paramId,
        });
      }
    } else {
      const mappingId = `${pipeline.id}_${mappingName}`;
      if (!runTimeProfile.mappings.pipeline[mappingId]) {
        runTimeProfile.mappings.pipeline[mappingId] = {
          references: []
        };
      }
      let params = (application.pipelineParameters.parameters || []).find(p => p.pipelineId === pipeline.id);
      if (params && params.parameters[mappingName]) {
        level = 'application';
        populated = true;
      }
      params = (execution.pipelineParameters ? execution.pipelineParameters.parameters || [] : []).find(p => p.pipelineId === pipeline.id);
      if (params && params.parameters[mappingName]) {
        level = 'execution';
        populated = true;
      }
      if (!runTimeProfile.mappings.pipeline[mappingId].references.find(r => r.executionId === execution.id &&
        r.pipelineId == pipeline.id &&
        r.stepId === step.id)) {
        runTimeProfile.mappings.pipeline[mappingId].references.push({
          executionId: execution.id,
          pipelineId: pipeline.id,
          stepId: step.id,
          level,
          populated,
          isGlobalLink: false,
          paramId,
        });
      }
    }
    const param = runTimeProfile.executions[execution.id].parameters[paramId].mappings.find(p => p.mappingName === mappingName);
    param.level = level;
    param.populated = populated;
    param.isGlobalLink = isGlobalLink;

    return populated;
  }

  private gatherPipelines(pipelines, pipelineIds) {
    const pipelineList = this.pipelines;
    const pipelineArray = [];
    (pipelines || []).forEach((pipeline) => {
      if (pipelineArray.findIndex(p => p.id === pipeline.id) === -1) {
        pipelineArray.push(pipeline);
      }
    });
    (pipelineIds || []).forEach((pid) => {
      if (pipelineArray.findIndex(p => p.id === pid) === -1) {
        pipelineArray.push(pipelineList.find(p => p.id === pid));
      }
    });
    return pipelineArray;
  }
}
