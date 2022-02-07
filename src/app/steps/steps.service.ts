import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {StaticSteps, Step, StepResponse, StepsResponse, StepTemplate, StepTemplateResponse} from './steps.model';
import { catchError, map, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StepsService {
  constructor(private http: HttpClient) {}

  getSteps(addStaticSteps = false): Observable<Step[]> {
    const cachedSteps = sessionStorage.getItem('steps');
    if (cachedSteps) {
      return of(JSON.parse(cachedSteps));
    }
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
              steps.push(StaticSteps.EXCEPTION_SKIP);
              steps.push(StaticSteps.EXCEPTION_PIPELINE);
              if (!steps.find(s => s.id === 'a7e17c9d-6956-4be0-a602-5b5db4d1c08b')) {
                steps.push(StaticSteps.SCALA_SCRIPT_STEP_BASE)
              }
              if (!steps.find(s => s.id === '8bf8cef6-cf32-4d85-99f4-e4687a142f84')) {
                steps.push(StaticSteps.SCALA_SCRIPT_STEP_OBJ)
              }
              if (!steps.find(s => s.id === '3ab721e8-0075-4418-aef1-26abdf3041be')) {
                steps.push(StaticSteps.SCALA_SCRIPT_STEP_OBJS)
              }
              if (!steps.find(s => s.id === '5e0358a0-d567-5508-af61-c35a69286e4e')) {
                steps.push(StaticSteps.JAVASCRIPT_STEP_BASE)
              }
              if (!steps.find(s => s.id === '570c9a80-8bd1-5f0c-9ae0-605921fe51e2')) {
                steps.push(StaticSteps.JAVASCRIPT_STEP_OBJ)
              }
              if (!steps.find(s => s.id === 'f92d4816-3c62-4c29-b420-f00994bfcd86')) {
                steps.push(StaticSteps.JAVASCRIPT_STEP_OBJS)
              }
            }
            sessionStorage.setItem('steps', JSON.stringify(steps));
            return steps;
          }
          return [];
        }),
        catchError(err => throwError(err)));
  }

  addStep(step: Step): Observable<Step> {
    sessionStorage.removeItem('steps');
    return this.http.post<StepResponse>('/api/v1/steps', step, {observe: 'response'})
      .pipe(
        map(response => response.body.step),
        catchError(err => throwError(err)));
  }

  updateStep(step: Step): Observable<Step> {
    sessionStorage.removeItem('steps');
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
    sessionStorage.removeItem('steps');
    const bulkSteps = steps.map(s => {
      delete s['_id'];
      return s;
    });
    return this.http.post<StepsResponse>('/api/v1/steps', bulkSteps, {observe: 'response'})
      .pipe(mergeMap(response => this.getSteps()),
        catchError(err => throwError(err)));
  }

  deleteStep(step: Step): Observable<boolean> {
    sessionStorage.removeItem('steps');
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
