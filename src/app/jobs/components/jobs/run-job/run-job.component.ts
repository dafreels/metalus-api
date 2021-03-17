import {Component, Inject, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ProvidersService} from "../../../services/providers.service";
import {Cluster, Provider} from "../../../models/providers.model";
import {ApplicationsService} from "../../../../applications/applications.service";
import {Application, Execution} from "../../../../applications/applications.model";
import {Pipeline} from "../../../../pipelines/models/pipelines.model";
import {PipelinesService} from "../../../../pipelines/services/pipelines.service";

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
  name: string;
  clusters: Cluster[];
  selectedCluster: Cluster;
  applications: Application[];
  selectedApplication: Application;
  pipelines: Pipeline[];
  missingParameters = {};
  jobTypes: JobType[] = [
    {
      id: 'batch',
      name: 'Batch'
    },
    {
      id: 'kinesis',
      name: 'AWS Kinesis'
    },
    {
      id: 'kafka',
      name: 'Kafka'
    },
    {
      id: 'pubsub',
      name: 'GCP Pub/Sub'
  }];
  selectedJobType: JobType = this.jobTypes[0];
  selectedProvider: Provider;
  bucket: string;
  streamingInfo = {
    duration: null,
    durationType: 'seconds'
  };
  selectedLogLevel: string = 'INFO';

  constructor(public dialogRef: MatDialogRef<RunJobComponent>,
              @Inject(MAT_DIALOG_DATA) public data: RunJobConfiguration,
              private providersService: ProvidersService,
              private applicationService: ApplicationsService,
              private pipelinesService: PipelinesService) {}

  handleProviderSelection(providerId) {
    this.providersService.getClustersList(providerId).subscribe(result => this.clusters = result);
  }

  run() {
    this.dialogRef.close({
      name: this.name,
      clusterId: this.selectedCluster.id,
      clusterName: this.selectedCluster.name,
      applicationId: this.selectedApplication.id,
      jobType: this.selectedJobType.id,
      providerId: this.selectedProvider.id,
      bucket: this.bucket,
      streamingInfo: this.streamingInfo,
      selectedLogLevel: this.selectedLogLevel
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
  }

  determineRequiredFields() {
    const parameters = {};
    this.selectedApplication.executions.forEach((execution) => {
      let pipeline;
      let values;
      let name;
      execution.pipelineIds.forEach(pid => {
        pipeline = this.pipelines.find(p => p.id === pid);
        if (pipeline) {
          pipeline.steps.forEach(step => {
            step.params.forEach(param => {
              if (typeof param.value === 'string' && (param.value.indexOf('!') !== -1 || param.value.indexOf('$') !== -1 || param.value.indexOf('?') !== -1)) {
                values = param.value.split('||');
                values.forEach(value => {
                  name = value.substring(1);
                  if (value.startsWith('!') &&
                    RunJobComponent.isMissingFromGlobals(execution, this.selectedApplication, name) &&
                    !parameters[name]) {
                    parameters[name] = {
                      type: 'global',
                      description: param.description,
                      className: param.className,
                      parameterType: param.parameterType,
                      required: values.length < 2
                    }
                  } else if ((value.startsWith('$') || value.startsWith('?')) &&
                    RunJobComponent.isMissingFromGlobals(execution, this.selectedApplication, name) &&
                    !parameters[name]) {
                    parameters[name] = {
                      type: 'runtime',
                      description: param.description,
                      className: param.className,
                      parameterType: param.parameterType,
                      required: values.length < 2
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
  }

  private static isMissingFromGlobals(execution: Execution, application: Application, name: string) {
    let globals = execution.globals || { GlobalLinks: {}};
    if (globals[name] || (globals['GlobalLinks'] && globals['GlobalLinks'][name])) {
      return false;
    }
    globals = application.globals || { GlobalLinks: {}};
    return globals[name] || (globals['GlobalLinks'] && globals['GlobalLinks'][name]);
  }
  treeEditorUpdated(data){
    this.missingParameters = data;
  }
}
