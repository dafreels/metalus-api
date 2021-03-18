import {Component, Inject, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ProvidersService} from "../../../services/providers.service";
import {Cluster, Provider} from "../../../models/providers.model";
import {ApplicationsService} from "../../../../applications/applications.service";
import {Application, Execution} from "../../../../applications/applications.model";
import {Pipeline} from "../../../../pipelines/models/pipelines.model";
import {PipelinesService} from "../../../../pipelines/services/pipelines.service";
import {JobsService} from "../../../services/jobs.service";
import {Job, ProviderJob} from "../../../models/jobs.model";
import {MatSelectChange} from "@angular/material/select";

export interface RunJobConfiguration {
  providers: Provider[];
}

export interface JobType {
  id: string;
  name: string;
}

@Component({
  templateUrl: './run-job.component.html',
  styleUrls: ['./run-job.component.scss']
})
export class RunJobComponent implements OnInit {
  running = false;
  name: string;
  clusters: Cluster[];
  selectedCluster: Cluster;
  applications: Application[];
  selectedApplication: Application;
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
  useCredentialProvider: boolean;
  jobs: ProviderJob[];

  constructor(public dialogRef: MatDialogRef<RunJobComponent>,
              @Inject(MAT_DIALOG_DATA) public data: RunJobConfiguration,
              private providersService: ProvidersService,
              private applicationService: ApplicationsService,
              private pipelinesService: PipelinesService,
              private jobsService: JobsService) {}

  handleProviderSelection(providerId, clusterId) {
    this.providersService.getClustersList(providerId).subscribe(result => {
      this.clusters = result;
      if (clusterId) {
        this.selectedCluster = this.clusters.find(c => c.id === clusterId);
      }
    });
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
      if (info.type === 'global') {
        globals[key] = this.missingParameters[key];
      } else if (info.type === 'runtime' || info.type === 'mapped_runtime') {
        new Set(info.pipelineIds).forEach(pipelineId => {
          parameter = pipelineParameters.parameters.find(p => p.pipelineId === pipelineId);
          if (!parameter) {
            parameter = {
              pipelineId: info.pipelineId,
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
      applicationId: this.selectedApplication.id,
      jobType: this.selectedJobType.id,
      providerId: this.selectedProvider.id,
      bucket: this.bucket,
      streamingInfo: this.streamingInfo,
      selectedLogLevel: this.selectedLogLevel,
      useCredentialProvider: this.useCredentialProvider,
      globals,
      pipelineParameters
    };
    this.jobsService.runJob(body).subscribe(job => {
      this.dialogRef.close();
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.applicationService.getApplications().subscribe(result => {
      if (result) {
        this.applications = result;
      }
    });
    this.pipelinesService.getPipelines().subscribe((pipelines: Pipeline[]) => {
      if (pipelines) {
        this.pipelines = pipelines;
      } else {
        this.pipelines = [];
      }
    });
    this.jobsService.getJobsByProviders(this.data.providers).subscribe(jobs => {
      if (jobs) {
        this.jobs = jobs;
      } else {
        this.jobs = [];
      }
    });
  }

  determineRequiredFields() {
    const parameters = {};
    const parameterProperties = [];
    this.selectedApplication.executions.forEach((execution) => {
      let pipeline;
      let values;
      let name;
      execution.pipelineIds.forEach(pid => {
        pipeline = this.pipelines.find(p => p.id === pid);
        if (pipeline) {
          pipeline.steps.forEach(step => {
            step.params.forEach(param => {
              if (typeof param.value === 'string' &&
                (param.value.indexOf('!') !== -1 ||
                  param.value.indexOf('$') !== -1 ||
                  param.value.indexOf('?') !== -1)) {
                values = param.value.split('||');
                values.forEach(value => {
                  name = value.substring(1);
                  if (value.startsWith('!') &&
                    this.isMissingFromGlobals(execution, this.selectedApplication, name) &&
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
                    this.isMissingFromRuntime(execution, this.selectedApplication, name)) {
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
          });
        }
      });
    });
    this.missingParameters = parameters;
    this.runtimeParameterInformation = parameterProperties;
  }

  private isMissingFromGlobals(execution: Execution, application: Application, name: string) {
    let globals = execution.globals || { GlobalLinks: {}};
    if (globals[name] || (globals['GlobalLinks'] && globals['GlobalLinks'][name])) {
      return false;
    }
    globals = application.globals || { GlobalLinks: {}};
    return globals[name] === undefined ||
      (globals['GlobalLinks'] &&
      globals['GlobalLinks'][name] === undefined);
  }

  private isMissingFromRuntime(execution: Execution, application: Application, name: string) {
    let parameters = execution.pipelineParameters.parameters || {};
    if (parameters[name]) {
      return false;
    }
    parameters = application.pipelineParameters.parameters || {};
    return parameters[name] === undefined;
  }

  treeEditorUpdated(data){
    this.missingParameters = data;
  }

  copyJob(change: MatSelectChange) {
    const job = change.value;
    this.selectedProvider = this.data.providers.find(p => p.id === job.job.providerId);
    this.handleProviderSelection(job.job.providerId, job.job.providerInformation.clusterId);
    this.selectedApplication = this.applications.find(a => a.id === job.job.applicationId);
    this.name = `copy-${job.job.name}`;
    this.selectedLogLevel = job.job.logLevel || 'INFO';
    this.bucket = job.job.providerInformation['bucket'];
    this.selectedJobType = this.jobTypes.find(t => t.id === job.job.jobType);
    this.useCredentialProvider = job.job.useCredentialProvider;
  }
}
