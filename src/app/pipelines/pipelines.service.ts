import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {IPipeline, IPipelinesResponse} from "./pipelines.model";
import {map} from "rxjs/operators";

@Injectable()
export class PipelinesService {
  constructor(private http: HttpClient) {}

  getPipelines(): Observable<IPipeline[]> {
    return this.http.get<IPipelinesResponse>(`/api/v1/pipelines`, { observe: 'response' })
      .pipe(
        map(response => response.body.pipelines));
  }
}
