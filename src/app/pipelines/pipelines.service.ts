import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {IPipeline, IPipelineResponse, IPipelinesResponse} from "./pipelines.model";
import {map} from "rxjs/operators";
import {IStepResponse} from "../steps/steps.model";

@Injectable()
export class PipelinesService {
  constructor(private http: HttpClient) {}

  getPipelines(): Observable<IPipeline[]> {
    return this.http.get<IPipelinesResponse>(`/api/v1/pipelines`, { observe: 'response' })
      .pipe(
        map(response => response.body.pipelines));
  }

  addPipeline(pipeline: IPipeline): Observable<IPipeline> {
    return this.http.post<IPipelineResponse>('/api/v1/pipelines', pipeline,{observe: 'response'})
      .pipe(
        map(response => response.body.pipeline));
  }

  updatePipeline(pipeline: IPipeline): Observable<IPipeline> {
    return this.http.put<IPipelineResponse>(`/api/v1/pipelines/${pipeline.id}`, pipeline,{observe: 'response'})
      .pipe(
        map(response => response.body.pipeline));
  }
}
