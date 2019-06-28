import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {catchError} from "rxjs/operators";
import {IStep} from "./steps.model";

@Injectable()
export class StepsService {
  constructor(private http: HttpClient) {}

  getSteps(): Observable<IStep[]> {
    return this.http.get('/api/v1/steps').pipe(catchError(this.handleError<IStep[]>('getSteps', [])))
  }

  getStep(id: string): Observable<IStep> {
    return this.http.get('/api/v1/steps/' + id).pipe(catchError(this.handleError<IStep>('getStep')))
  }

  getStepsCount() {
    return 5;
  }

  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      // TODO Handle the error
      console.log(error);
      return of(result as T);
    }
  }
}
