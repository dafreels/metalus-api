import {
  Pipeline,
  PipelinesResponse,
  PipelineResponse,
} from './../models/pipelines.model';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PipelinesService {
  constructor(private http: HttpClient) {}

  getPipelines(): Observable<Pipeline[]> {
    return this.http
      .get<PipelinesResponse>(`/api/v1/pipelines`, { observe: 'response' })
      .pipe(
        map((response) => {
          if (response && response.body) {
            return response.body.pipelines.map((p) => {
              delete p['_id'];
              return p;
            });
          }
          return [];
        }),
        catchError((err) => throwError(err))
      );
  }

  addPipeline(pipeline: Pipeline): Observable<Pipeline> {
    return this.http
      .post<PipelineResponse>('/api/v1/pipelines', pipeline, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body.pipeline),
        catchError((err) => throwError(err))
      );
  }

  updatePipeline(pipeline: Pipeline): Observable<Pipeline> {
    return this.http
      .put<PipelineResponse>(`/api/v1/pipelines/${pipeline.id}`, pipeline, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body.pipeline),
        catchError((err) => throwError(err))
      );
  }

  deletePipeline(pipeline: Pipeline): Observable<boolean> {
    return this.http
      .delete(`/api/v1/pipelines/${pipeline.id}`, { observe: 'response' })
      .pipe(
        map((response) => true),
        catchError((err) => throwError(err))
      );
  }

  getPipelineSchema(): Observable<any> {
    return this.http
      .get('/schemas/pipelines.json', { observe: 'response' })
      .pipe(
        map((response) => response.body),
        catchError((err) => throwError(err))
      );
  }
}
