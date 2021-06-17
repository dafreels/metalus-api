import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import {StaticSteps, Step, StepResponse, StepsResponse, StepTemplate, StepTemplateResponse} from './steps.model';
import { catchError, map, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StepsService {
  constructor(private http: HttpClient) {}

  getSteps(addStaticSteps = false): Observable<Step[]> {
    return this.http.get<StepsResponse>('/api/v1/steps', {observe: 'response'})
      .pipe(
        map(response => {
          if (response && response.body) {
            const steps = response.body.steps;
            if (addStaticSteps) {
              steps.push(StaticSteps.FORK_STEP);
              steps.push(StaticSteps.JOIN_STEP);
              steps.push(StaticSteps.SPLIT_STEP);
              steps.push(StaticSteps.MERGE_STEP);
              steps.push(StaticSteps.STEP_GROUP);
              steps.push(StaticSteps.CUSTOM_BRANCH_STEP);
            }
            return steps;
          }
          return [];
        }),
        catchError(err => throwError(err)));
  }

  addStep(step: Step): Observable<Step> {
    return this.http.post<StepResponse>('/api/v1/steps', step, {observe: 'response'})
      .pipe(
        map(response => response.body.step),
        catchError(err => throwError(err)));
  }

  updateStep(step: Step): Observable<Step> {
    return this.http.put<StepResponse>(`/api/v1/steps/${step.id}`, step, {observe: 'response'})
      .pipe(
        map(response => response.body.step),
        catchError(err => throwError(err)));
  }

  getStepTemplates(): Observable<StepTemplate[]> {
    return this.http.get<StepTemplateResponse>(`/api/v1/steps/_/template`,{ observe: 'response' })
      .pipe(map((response:any) => {
          if(response.body){
            return response.body.stepTemplates;
          } else {
            return [];
          }
        }),
        catchError(err => throwError(err)));
  }

  getParamTemplate(stepId: string): Observable<any> {
    return this.http.get(`/api/v1/steps/${stepId}/template`,{ observe: 'response' })
      .pipe(map((response:any) => {
        if(response.body){
          return response.body.stepTemplate;
        } else {
          return {};
        }
      }),
      catchError(err => throwError(err)));
  }

  updateParamTemplate(stepID, stepTemplate:any): Observable<Step> {
    return this.http.put<StepResponse>(`/api/v1/steps/${stepID}/template`, stepTemplate, {observe: 'response'})
      .pipe(
        map(response => response.body.step),
        catchError(err => throwError(err)));
  }

  updateSteps(steps: Step[]): Observable<Step[]> {
    const bulkSteps = steps.map(s => {
      delete s['_id'];
      return s;
    });
    return this.http.post<StepsResponse>('/api/v1/steps', bulkSteps, {observe: 'response'})
      .pipe(mergeMap(response => this.getSteps()),
        catchError(err => throwError(err)));
  }

  deleteStep(step: Step): Observable<boolean> {
    return this.http.delete(`/api/v1/steps/${step.id}`, {observe: 'response'})
      .pipe(map(response => true),
        catchError(err => throwError(err)));
  }

  getStepSchema(): Observable<any> {
    return this.http.get('/schemas/steps.json', { observe: 'response' })
      .pipe(map(response => response.body),
        catchError(err => throwError(err)));
  }
}
