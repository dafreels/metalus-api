import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {ExecutionsResponse, ExecutionTemplate} from "./applications.model";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root',
})
export class ExecutionsService {
  updateExecutionTemplate(selectedExecution: ExecutionTemplate, paramTemplate: any) {
    return this.http
      .put<ExecutionsResponse>(`/api/v1/executions`, {
        observe: 'response',
      })
  }
  constructor(private http: HttpClient) {}

  getExecutions(): Observable<ExecutionTemplate[]> {
    return this.http
      .get<ExecutionsResponse>(`/api/v1/executions`, {
        observe: 'response',
      })
      .pipe(
        map((response) => {
          if (response && response.body) {
            return response.body.executions;
          }
          return [];
        })
      );
  }
}
