import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {catchError, map} from "rxjs/operators";
import {GetTemplatesResponse, Template} from "../models/templates.model";

@Injectable({
  providedIn: 'root'
})
export class TemplatesService {
  constructor(private http: HttpClient) {}

  getTemplate(): Observable<Template> {
    return this.http
      .get<GetTemplatesResponse>(`/api/v1/templates`, {observe: 'response'})
      .pipe(
        map((response) => {
          if (response && response.body) {
            return response.body.template;
          }
          return null;
        }),
        catchError((err) => throwError(err))
      );
  }
}
