import {Injectable} from "@angular/core";
import {forkJoin, Observable, throwError} from "rxjs";
import {Job, JobResponse, JobsResponse, JobStatus, JobType, ProviderJob} from "../models/jobs.model";
import {Provider} from "../models/providers.model";
import {catchError, map} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class JobsService {
  constructor(private http: HttpClient) {}

  getJobsByProvider(providerId: string): Observable<Job[]> {
    return this.http.get<JobsResponse>(`/api/v1/providers/${providerId}/jobs`, {observe: 'response'})
      .pipe(
        map(response => {
          if (response && response.body) {
            return response.body.jobs;
          }
          return null;
        }),
        catchError(err => throwError(err)));
  }

  getJobsByProviders(providers: Provider[]): Observable<ProviderJob[]> {
    const requests = {};
    providers.forEach(provider => {
      requests[provider.name] = this.http.get<JobsResponse>(`/api/v1/providers/${provider.id}/jobs`, {observe: 'response'})
        .pipe(
          map(response => {
            if (response && response.body && response.body.jobs) {
              return response.body.jobs.map(j => {
                return {
                  job: j,
                  provider,
                };
              });
            }
            return [];
          })
        );
    });
    return forkJoin(requests)
      .pipe(map(results => {
          let finalJobs: ProviderJob[] = [];
          providers.forEach(provider => {
            finalJobs = finalJobs.concat(results[provider.name]);
          });
          return finalJobs;
        }),
        catchError(err => throwError(err)));
  }

  getJobsByApplicationId(applicationId): Observable<Job[]> {
    return this.http.get<JobsResponse>(`/api/v1/applications/${applicationId}/jobs`, {observe: 'response'})
      .pipe(
        map(response => {
          if (response && response.body) {
            return response.body.jobs.sort((a, b) => a.startTime > b.startTime ? 1 : -1);
          }
          return null;
        }),
        catchError(err => throwError(err)));
  }

  runJob(runConfig: any): Observable<Job> {
    return this.http
      .post<JobResponse>(`/api/v1/providers/${runConfig.providerId}/jobs`, runConfig, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body.job),
        catchError((err) => throwError(err))
      );
  }

  getJob(providerId, jobId): Observable<Job> {
    return this.http.get<JobResponse>(`/api/v1/providers/${providerId}/jobs/${jobId}`, {observe: 'response'})
      .pipe(
        map(response => {
          if (response && response.body) {
            return response.body.job;
          }
          return null;
        }),
        catchError(err => throwError(err)));
  }

  deleteJob(providerId, jobId) {
    return this.http.delete<any>(`/api/v1/providers/${providerId}/jobs/${jobId}`, {observe: 'response'})
      .pipe(catchError(err => throwError(err)));
  }

  static getStatusString(status: JobStatus) {
    switch (status) {
      case JobStatus.COMPLETE:
        return 'Complete';
      case JobStatus.RUNNING:
        return 'Running';
      case JobStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Failed';
    }
  }

  static getJobTypeString(jobType: JobType) {
    if (jobType === JobType.STREAMING) {
      return 'Streaming';
    }
    return 'Batch';
  }

  cancelJob(job: Job) {
    return this.http.put(`/api/v1/providers/${job.providerId}/jobs/${job.id}`, {})
      .pipe(catchError(err => throwError(err)));
  }
}
