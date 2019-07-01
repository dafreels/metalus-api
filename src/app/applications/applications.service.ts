import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {IApplication, IApplicationsResponse} from "./applications.model";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";

@Injectable()
export class ApplicationssService {
  constructor(private http: HttpClient) {}

  getApplications(): Observable<IApplication[]> {
    return this.http.get<IApplicationsResponse>(`/api/v1/applications`, { observe: 'response' })
      .pipe(
        map(response => response.body.applications));
  }
}
