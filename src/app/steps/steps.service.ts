import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {IStep, IStepResponse, IStepsResponse} from "./steps.model";
import {map} from "rxjs/operators";

@Injectable()
export class StepsService {
  constructor(private http: HttpClient) {}

  getSteps(): Observable<IStep[]> {
    return this.http.get<IStepsResponse>('/api/v1/steps', { observe: 'response' })
      .pipe(
      // catchError(this.handleError<IStepsResponse>('getSteps', null)),
      map(response => response.body.steps));
  }

  addStep(step: IStep): Observable<IStep> {
    return this.http.post<IStepResponse>('/api/v1/steps', step,{observe: 'response'})
      .pipe(
        map(response => response.body.step));
  }

  updateStep(step: IStep): Observable<IStep> {
    return this.http.put<IStepResponse>(`/api/v1/steps/${step.id}`, step,{observe: 'response'})
      .pipe(
        map(response => response.body.step));
  }

  // getStep(id: string): Observable<IStep> {
  //   return this.http.get<IStepResponse>('/api/v1/steps/' + id).pipe(catchError(this.handleError<IStep>('getStep')))
  // }

  // private handleError<T> (operation = 'operation', result?: T) {
  //   return (error: any): Observable<T> => {
  //     // TODO Handle the error
  //     console.log(error);
  //     return of(result as T);
  //   }
  // }
}
