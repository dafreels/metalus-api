import {Component, Inject, Input, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {ProvidersService} from "../../../services/providers.service";
import {Cluster, Provider} from "../../../models/providers.model";
import {Application, Execution} from "../../../../applications/applications.model";
import {Pipeline} from "../../../../pipelines/models/pipelines.model";
import {PipelinesService} from "../../../../pipelines/services/pipelines.service";
import {JobsService} from "../../../services/jobs.service";
import {MatSelectChange} from "@angular/material/select";
import {Job} from "../../../models/jobs.model";
import {SharedFunctions} from "../../../../shared/utils/shared-functions";
import {FormlyJsonschema} from "@ngx-formly/core/json-schema";
import {FormlyFieldConfig} from "@ngx-formly/core";
import {ErrorHandlingComponent} from "../../../../shared/utils/error-handling-component";
import { AuthService } from "src/app/shared/services/auth.service";
import { finalize } from "rxjs/operators";
import {FormControl} from "@angular/forms";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {MatChipInputEvent} from "@angular/material";

export interface RunJobConfiguration {
  providers: Provider[];
  jobs: Job[];
  application: Application;
}

export interface JobType {
  id: string;
  name: string;
}

@Component({
  templateUrl: './run-job.component.html',
  styleUrls: ['./run-job.component.scss']
})
export class RunJobComponent extends ErrorHandlingComponent implements OnInit {
  running = false;
  name: string;
  clusters: Cluster[];
  selectedCluster: Cluster;
  pipelines: Pipeline[];
  missingParameters = {};
  runtimeParameterInformation = {};
  jobTypes: JobType[] = [
    {
      id: 'batch',
      name: 'Batch'
    },
    {
      id: 'kinesis',
      name: 'AWS Kinesis'
    },
    // {
    //   id: 'kafka',
    //   name: 'Kafka'
    // },
    {
      id: 'pubsub',
      name: 'GCP Pub/Sub'
  }];
  selectedJobType: JobType = this.jobTypes[0];
  selectedProvider: Provider;
  bucket: string;
  streamingInfo = {
    duration: 30,
    durationType: 'seconds',
    streamName: undefined,
    appName: undefined,
    consumerStreams: undefined,
    subscription: undefined
  };
  selectedLogLevel: string = 'INFO';
  selectedRootLogLevel: string = 'WARN';
  customLogLevelsList: string[] = [];
  customLogLevelsCtrl = new FormControl();
  separatorKeysCodes: number[] = [ENTER, COMMA];
  useCredentialProvider: boolean = false;
  forceCopy: boolean = false;
  includePipelines: boolean = true;
  loglevelList = [
    'INFO',
    'WARN',
    'DEBUG',
    'ERROR',
    'TRACE',
    'FATAL',
    'OFF'
  ];
  // Custom form support
  _model;
  @Input() set model(value) {
    this._model = value;
  }
  get model() {
    return this._model;
  }
  _fields: FormlyFieldConfig[];
  formValue: object;

  constructor(public dialogRef: MatDialogRef<RunJobComponent>,
              @Inject(MAT_DIALOG_DATA) public data: RunJobConfiguration,
              private formlyJsonschema: FormlyJsonschema,
              private providersService: ProvidersService,
              private pipelinesService: PipelinesService,
              private jobsService: JobsService,
              private authService: AuthService,
              public dialog: MatDialog) {
    super(dialog);
  }

  templateValueChanged(value) {
    this.formValue = value;
  }

  handleProviderSelection(providerId, providerInformation) {
    this.providersService.getClustersList(providerId).subscribe(result => {
      this.clusters = result.filter(c => c.canRunJob);
      if (providerInformation && providerInformation.clusterId) {
        this.selectedCluster = this.clusters.find(c => c.id === providerInformation.clusterId);
      }
      this.providersService.getCustomJobForm(providerId).subscribe(formlyJson => {
        if (formlyJson) {
          if (formlyJson.schema) {
            this._fields = [this.formlyJsonschema.toFieldConfig(formlyJson.schema)];
          } else if(Array.isArray(formlyJson)) {
            this._fields = SharedFunctions.convertFormlyForm(formlyJson);
          } else {
            this._fields = SharedFunctions.convertFormlyForm([formlyJson]);
          }
          if (providerInformation && providerInformation.customFormValues) {
            this._model = providerInformation.customFormValues;
            this.formValue = providerInformation.customFormValues;
          }
        }
      },(error) => this.handleError(error, null))
    },(error) => this.handleError(error, null));
  }

  run() {
    this.running = true;
    // TODO Track required fields and disable run button
    // Separate the globals from the runtime
    let info;
    const globals = {};
    const pipelineParameters = {
      parameters: []
    };
    let parameter;
    Object.keys(this.missingParameters || {}).forEach(key => {
      info = this.runtimeParameterInformation[key];
      // TODO Strip the leading character from the value?
      if (!info || info.type === 'global') {
        globals[key] = this.missingParameters[key];
      } else if (info.type === 'runtime' || info.type === 'mapped_runtime') {
        new Set(info.pipelineIds).forEach(pipelineId => {
          parameter = pipelineParameters.parameters.find(p => p.pipelineId === pipelineId);
          if (!parameter) {
            parameter = {
              pipelineId: pipelineId,
              parameters: {}
            }
            pipelineParameters.parameters.push(parameter);
          }
          parameter.parameters[key] = this.missingParameters[key];
        });
      }
    });
    const body = {
      name: this.name,
      clusterId: this.selectedCluster.id,
      clusterName: this.selectedCluster.name,
      applicationId: this.data.application.id,
      jobType: this.selectedJobType.id,
      providerId: this.selectedProvider.id,
      bucket: this.bucket,
      streamingInfo: this.streamingInfo,
      selectedLogLevel: this.selectedLogLevel,
      selectedRootLogLevel: this.selectedRootLogLevel,
      customLogLevels: this.customLogLevelsList.length > 0 ? this.customLogLevelsList.join(',') : undefined,
      useCredentialProvider: this.useCredentialProvider,
      includePipelines: this.includePipelines,
      forceCopy: this.forceCopy,
      globals,
      pipelineParameters,
      customFormValues: this.formValue
    };
    this.authService.setAutoLogout(false);
    this.jobsService.runJob(body).pipe(finalize(()=>{
     this.authService.setAutoLogout(true);
    })).subscribe(job => {
      this.authService.setAutoLogout(false);
      this.dialogRef.close(job);
    },(error) => this.handleError(error, null));
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.pipelinesService.getPipelines().subscribe((pipelines: Pipeline[]) => {
      if (pipelines) {
        this.pipelines = pipelines;
      } else {
        this.pipelines = [];
      }
      this.determineRequiredFields();
    });
  }

  determineRequiredFields() {
    const parameters = {};
    const parameterProperties = [];
    this.data.application.executions.forEach((execution) => {
      let pipeline;
      execution.pipelineIds.forEach(pid => {
        pipeline = this.pipelines.find(p => p.id === pid);
        this.extractPipelineParameters(pipeline, execution, parameters, parameterProperties);
      });
    });
    this.missingParameters = parameters;
    this.runtimeParameterInformation = parameterProperties;
  }

  // TODO Move this to shared functions so it can be used for globals
  private extractPipelineParameters(pipeline, execution: Execution, parameters: {}, parameterProperties: any[]) {
    if (pipeline) {
      pipeline.steps.forEach(step => {
        if (step.type === 'step-group') {
          const idParam = step.params.find((p) => p.name === 'pipelineId');
          const pipelineParam = step.params.find((p) => p.name === 'pipeline');
          let subPipeline;
          let paramName;
          let pipelineId;
          if (idParam && idParam.value && idParam.value.trim().length > 0) {
            if (idParam.value.startsWith('!')) {
              paramName = idParam.value.substring(1);
              pipelineId = execution.globals[paramName] || this.data.application.globals[paramName]
            } else {
              pipelineId = idParam.value;
            }
            subPipeline = this.pipelines.find(p => p.id === pipelineId);
          } else if (pipelineParam && pipelineParam.value && typeof pipelineParam.value === 'object') {
            subPipeline = pipelineParam.value;
          }
          if (subPipeline) {
            this.extractPipelineParameters(subPipeline, execution, parameters, parameterProperties);
          }
        } else {
          step.params.forEach(param => {
            if (typeof param.value === 'string' &&
              (param.value.indexOf('!') !== -1 ||
                param.value.indexOf('$') !== -1 ||
                param.value.indexOf('?') !== -1)) {
              let match;
              const values = [];
              param.value.split('||').forEach((s) => {
                match = s.match(/([!@$%#&?]{.*?})/);
                if (match && match.length > 0) {
                  s.split(/([!@$%#&?]{.*?})/).forEach((v) => {
                    values.push(v.trim().replace(/{/, '').replace(/}/, ''));
                  });
                } else {
                  values.push(s.trim());
                }
              });
              values.forEach(value => {
                const name = value.substring(1);
                if (value.startsWith('!') &&
                  this.isMissingFromGlobals(execution, this.data.application, name) &&
                  !parameters[name]) {
                  parameters[name] = '!';
                  parameterProperties[name] = {
                    type: 'global',
                    description: param.description,
                    className: param.className,
                    parameterType: param.parameterType,
                    required: values.length < 2
                  }
                } else if ((value.startsWith('$') || value.startsWith('?')) &&
                  this.isMissingFromRuntime(execution, this.data.application, name)) {
                  parameters[name] = `${value.startsWith('$') ? '$' : '?'}`;
                  if (parameterProperties[name]) {
                    parameterProperties[name].pipelineIds.push(pipeline.id);
                  } else {
                    parameterProperties[name] = {
                      type: value.startsWith('$') ? 'runtime' : 'mapped_runtime',
                      description: param.description,
                      className: param.className,
                      parameterType: param.parameterType,
                      required: values.length < 2,
                      pipelineIds: [pipeline.id]
                    }
                  }
                }
              });
            }
          });
        }
      });
    }
  }

  private isMissingFromGlobals(execution: Execution, application: Application, name: string) {
    let globals = execution.globals || { GlobalLinks: {}};
    let value;
    if (globals[name]) {
      value = globals[name];
    }
    if ((globals['GlobalLinks'] && globals['GlobalLinks'][name])) {
      value = globals['GlobalLinks'][name];
    }
    globals = application.globals || { GlobalLinks: {}};
    if (globals[name]) {
      value = globals[name];
    }
    if ((globals['GlobalLinks'] && globals['GlobalLinks'][name])) {
      value = globals['GlobalLinks'][name];
    }
    return !value || (typeof value === 'string' && value.trim().length === 0);
  }

  private isMissingFromRuntime(execution: Execution, application: Application, name: string) {
    let parameters = execution.pipelineParameters && execution.pipelineParameters.parameters ? execution.pipelineParameters.parameters : { parameters: [] };
    if (parameters[name]) {
      return false;
    }
    parameters = application.pipelineParameters && application.pipelineParameters.parameters ? application.pipelineParameters.parameters : { parameters: [] };
    return parameters[name] === undefined;
  }

  treeEditorUpdated(data){
    this.missingParameters = data;
  }

  copyJob(change: MatSelectChange) {
    const job = change.value;
    this.selectedProvider = this.data.providers.find(p => p.id === job.providerId);
    this.handleProviderSelection(job.providerId, job.providerInformation);
    this.name = `copy-${job.name}`;
    this.selectedLogLevel = job.logLevel || 'INFO';
    this.selectedRootLogLevel = job.rooLogLevel || 'WARN';
    this.customLogLevelsList = job.customLogLevels ? job.customLogLevels.split(',') : [];
    this.bucket = job.providerInformation['bucket'];
    this.selectedJobType = this.jobTypes.find(t => t.id === job.jobType);
    this.useCredentialProvider = job.useCredentialProvider;
  }

  addCustomLogLevel(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    // Add our package
    if ((value || '').trim()) {
      if (!this.customLogLevelsList) {
        this.customLogLevelsList = [];
      }
      this.customLogLevelsList.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.customLogLevelsCtrl.setValue(null);
  }

  removeCustomLogLevel(level: string) {
    const index = this.customLogLevelsList.indexOf(level);
    if (index > -1) {
      this.customLogLevelsList.splice(index, 1);
    }
  }
}
