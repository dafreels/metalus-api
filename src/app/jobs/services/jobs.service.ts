import {Injectable} from "@angular/core";
import {forkJoin, Observable, throwError} from "rxjs";
import {JobsResponse, JobStatus, JobType, ProviderJob} from "../models/jobs.model";
import {Provider} from "../models/providers.model";
import {catchError, map} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class JobsService {
  constructor(private http: HttpClient) {
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
}
