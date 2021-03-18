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
import {forkJoin, of, throwError, timer} from "rxjs";
import {catchError, map} from "rxjs/operators";

@Component({
  templateUrl: './jobs.component.html'
})
export class JobsComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'appName', 'providerName', 'lastStatus', 'actions'];
  jobs: ProviderJob[];
  providers: Provider[];
  refreshing = false;
  lastRefreshDate = new Date();

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

    timer(120000, 120000).subscribe(() => {
      this.refreshing = true;
      if (this.jobs) {
        const jobRequests = {};
        this.jobs.forEach(job => {
          if (job.job.lastStatus === 'PENDING' ||
            job.job.lastStatus === 'RUNNING') {
            jobRequests[job.job.id] = this.jobsService.getJob(job.provider.id, job.job.id);
          } else {
            jobRequests[job.job.id] = of(job.job);
          }
        });

        forkJoin(jobRequests)
          .pipe(map(results => {
              let finalJobs: ProviderJob[] = [];
              this.jobs.forEach(job => {
                job.job = results[job.job.id];
                finalJobs.push(job);
              });
              return finalJobs;
            }),
            catchError(err => throwError(err)))
          .subscribe(jobs => this.jobs = jobs);
      }
      this.refreshing = false;
      this.lastRefreshDate = new Date();
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
        const dialogRef = this.displayDialogService.openDialog(
          WaitModalComponent, {
            width: '25%',
            height: '25%',
          });
        this.jobsService.getJobsByProviders(this.providers).subscribe(jobs => {
          dialogRef.close();
          this.jobs = jobs;
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

  deleteJob(job: ProviderJob) {
    const dialogRef = this.displayDialogService.openDialog(
      WaitModalComponent, {
        width: '25%',
        height: '25%',
      });
    this.jobsService.deleteJob(job.provider.id, job.job.id).subscribe(() => {
      dialogRef.close();
      const jobs = [];
      this.jobs.forEach(j => {
        if (j.job.id !== job.job.id) {
          jobs.push(job);
        }
      });
      this.jobs = jobs;
    });
  }
}
