import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {Job} from "../../models/jobs.model";
import {JobsService} from "../../services/jobs.service";
import {Provider} from "../../models/providers.model";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {JobStatusComponent} from "./job-status/job-status.component";
import {WaitModalComponent} from "../../../shared/components/wait-modal/wait-modal.component";
import {forkJoin, of, Subscription, throwError, timer} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {SharedFunctions} from "../../../shared/utils/shared-functions";

@Component({
  selector: 'jobs-listing',
  templateUrl: './jobs.component.html'
})
export class JobsComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'appName', 'providerName', 'lastStatus', 'actions'];
  lastRefreshDate = new Date();
  jobs: Job[];
  _provider: Provider;
  subscriptions: Subscription[] = [];

  constructor(private jobsService: JobsService,
              private displayDialogService: DisplayDialogService) {}

  @Input() set provider(provider: Provider) {
    this._provider = provider;
    if (this._provider) {
      this.jobsService.getJobsByProvider(this._provider.id).subscribe(jobs => {
        this.jobs = jobs;
      });
    }
  }

  ngOnInit(): void {
    this.subscriptions.push(timer(120000, 120000).subscribe(() => {
      if (this.jobs) {
        const jobRequests = {};
        this.jobs.forEach(job => {
          if (job.lastStatus === 'PENDING' ||
            job.lastStatus === 'RUNNING') {
            jobRequests[job.id] = this.jobsService.getJob(this._provider.id, job.id);
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
      this.lastRefreshDate = new Date();
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions = SharedFunctions.clearSubscriptions(this.subscriptions);
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

  deleteJob(job: Job) {
    const dialogRef = this.displayDialogService.openDialog(
      WaitModalComponent, {
        width: '25%',
        height: '25%',
      });
    this.jobsService.deleteJob(this._provider.id, job.id).subscribe(() => {
      dialogRef.close();
      const jobs = [];
      this.jobs.forEach(j => {
        if (j.id !== job.id) {
          jobs.push(j);
        }
      });
      this.jobs = jobs;
    });
  }
}
