import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
  Application,
  ApplicationResponse,
  ApplicationsResponse,
  RunTimeProfile,
  RunTimeProfileResponse
} from './applications.model';
import {Observable, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  constructor(private http: HttpClient) {}

  getApplications(): Observable<Application[]> {
    return this.http
      .get<ApplicationsResponse>(`/api/v1/applications`, {
        observe: 'response',
      })
      .pipe(
        map((response) => {
          if (response && response.body) {
            return response.body.applications;
          }
          return [];
        })
      );
  }

  getApplicationSchema(): Observable<any> {
    return this.http
      .get('/schemas/applications.json', { observe: 'response' })
      .pipe(
        map((response) => response.body),
        catchError((err) => throwError(err))
      );
  }

  addApplication(application: Application): Observable<Application> {
    return this.http
      .post<ApplicationResponse>('/api/v1/applications', application, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body.application),
        catchError((err) => throwError(err))
      );
  }

  updateApplication(application: Application): Observable<Application> {
    return this.http
      .put<ApplicationResponse>(`/api/v1/applications/${application.id}`, application, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body.application),
        catchError((err) => throwError(err))
      );
  }

  deleteApplication(application: Application): Observable<boolean> {
    return this.http
      .delete(`/api/v1/applications/${application.id}`, { observe: 'response' })
      .pipe(
        map((response) => true),
        catchError((err) => throwError(err))
      );
  }

  getRuntimeProfile(id: string): Observable<RunTimeProfile> {
    return this.http
      .get<RunTimeProfileResponse>(`/api/v1/applications/${id}/run-profile`, { observe: 'response' })
      .pipe(
        map((response) => response.body.runProfile),
        catchError((err) => throwError(err))
      );
  }

  addRuntimeProfile(runtimeProfile: RunTimeProfile): Observable<RunTimeProfile> {
    return this.http
      .post<RunTimeProfileResponse>(`/api/v1/applications/${runtimeProfile.applicationId}/run-profile`, runtimeProfile, {observe: 'response'})
      .pipe(
        map((response) => response.body.runProfile),
        catchError((err) => throwError(err))
      );
  }

  updateRuntimeProfile(runtimeProfile: RunTimeProfile): Observable<RunTimeProfile> {
    return this.http
      .put<RunTimeProfileResponse>(`/api/v1/applications/${runtimeProfile.applicationId}/run-profile`, runtimeProfile, {observe: 'response'})
      .pipe(
        map((response) => response.body.runProfile),
        catchError((err) => throwError(err))
      );
  }
}
