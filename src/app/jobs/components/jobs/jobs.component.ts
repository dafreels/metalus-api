import {Component, OnInit} from "@angular/core";
import {Job, ProviderJob} from "../../models/jobs.model";
import {JobsService} from "../../services/jobs.service";
import {ProvidersService} from "../../services/providers.service";
import {Provider} from "../../models/providers.model";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {RunJobComponent} from "./run-job/run-job.component";
import {JobStatusComponent} from "./job-status/job-status.component";
import {WaitModalComponent} from "../../../shared/components/wait-modal/wait-modal.component";

@Component({
  templateUrl: './jobs.component.html'
})
export class JobsComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'appName', 'providerName', 'type', 'actions'];
  jobs: ProviderJob[];
  providers: Provider[];

  constructor(private jobsService: JobsService,
              private providersService: ProvidersService,
              private displayDialogService: DisplayDialogService) {}

  ngOnInit(): void {
    this.providersService.getProvidersList().subscribe(result => {
      this.providers = result;
      this.jobsService.getJobsByProviders(this.providers).subscribe(jobs => {
        this.jobs = jobs;
      });
    });
  }

  runJob() {
    const addDialog = this.displayDialogService.openDialog(
      RunJobComponent,
      generalDialogDimensions,
      {
        providers: this.providers
      }
    );
    addDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.jobsService.runJob(result).subscribe(job => {
          this.jobsService.getJobsByProviders(this.providers).subscribe(jobs => {
            this.jobs = jobs;
          });
        });
      }
    });
  }

  openJobStatus(job) {
    const dialogRef = this.displayDialogService.openDialog(
      WaitModalComponent, {
      width: '25%',
      height: '25%',
    });
    this.jobsService.getJob(job.providerId, job.id).subscribe(j => {
      dialogRef.close();
      this.displayDialogService.openDialog(
        JobStatusComponent,
        generalDialogDimensions,
        {
          providerId: j.providerId,
          job: j
        }
      );
    })
  }

  cancelJob(job: Job) {
    const dialogRef = this.displayDialogService.openDialog(
      WaitModalComponent, {
        width: '25%',
        height: '25%',
      });
    this.jobsService.cancelJob(job).subscribe(() => {
      dialogRef.close();
    });
  }
}
