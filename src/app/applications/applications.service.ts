import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Application, ApplicationsResponse } from './applications.model';
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
}
