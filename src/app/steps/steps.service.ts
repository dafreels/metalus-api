import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {IStep, IStepResponse, IStepsResponse} from "./steps.model";
import {catchError, map} from "rxjs/operators";

@Injectable()
export class StepsService {
  constructor(private http: HttpClient) {}

  getSteps(): Observable<IStep[]> {
    return this.http.get<IStepsResponse>('/api/v1/steps', {observe: 'response'})
      .pipe(
        map(response => response.body.steps),
        catchError(err => throwError(err)));
  }

  addStep(step: IStep): Observable<IStep> {
    return this.http.post<IStepResponse>('/api/v1/steps', step, {observe: 'response'})
      .pipe(
        map(response => response.body.step),
        catchError(err => throwError(err)));
  }

  updateStep(step: IStep): Observable<IStep> {
    return this.http.put<IStepResponse>(`/api/v1/steps/${step.id}`, step, {observe: 'response'})
      .pipe(
        map(response => response.body.step),
        catchError(err => throwError(err)));
  }

  updateSteps(steps: IStep[]): Observable<IStep[]> {
    const bulkSteps = steps.map(s => {
      delete s['_id'];
      return s;
    });
    return this.http.post<IStepsResponse>('/api/v1/steps', bulkSteps, {observe: 'response'})
      .pipe(response => this.getSteps(),
        catchError(err => throwError(err)));
  }
}
