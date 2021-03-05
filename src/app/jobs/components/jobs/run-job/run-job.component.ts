import {Component, Inject, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ProvidersService} from "../../../services/providers.service";
import {Cluster, Provider} from "../../../models/providers.model";
import {ApplicationsService} from "../../../../applications/applications.service";
import {Application} from "../../../../applications/applications.model";

export interface RunJobConfiguration {
  providers: Provider[];
}

export interface JobType {
  id: string;
  name: string;
}

@Component({
  templateUrl: './run-job.component.html'
})
export class RunJobComponent implements OnInit{
  name: string;
  clusters: Cluster[];
  selectedCluster: Cluster;
  applications: Application[];
  selectedApplication: Application;
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

  constructor(public dialogRef: MatDialogRef<RunJobComponent>,
              @Inject(MAT_DIALOG_DATA) public data: RunJobConfiguration,
              private providersService: ProvidersService,
              private applicationService: ApplicationsService) {}

  handleProviderSelection(providerId) {
    this.providersService.getClustersList(providerId).subscribe(result => this.clusters = result);
  }

  run() {
    this.dialogRef.close({
      name: this.name,
      clusterId: this.selectedCluster.id,
      clusterName: this.selectedCluster.name,
      applicationId: this.selectedApplication.id,
      jobType: this.selectedJobType.id
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
  }
  treeEditorUpdated(data){
  console.log("🚀 ~ file: run-job.component.ts ~ line 76 ~ RunJobComponent ~ treeEditorUpdated ~ data", data)
  }
}
