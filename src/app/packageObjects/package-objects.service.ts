import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable, throwError} from "rxjs";
import {catchError, map, mergeMap} from "rxjs/operators";
import {IPackageObject, IPackageObjectResponse, IPackageObjectsResponse} from "./package-objects.model";

@Injectable()
export class PackageObjectsService {
  constructor(private http: HttpClient) {}

  getPackageObjects(): Observable<IPackageObject[]> {
    return this.http.get<IPackageObjectsResponse>(`/api/v1/package-objects`, { observe: 'response' })
      .pipe(
        map(response => {
          if (response && response.body) {
            return response.body["package-objects"];
          }
          return [];
        }));
  }

  updatePackageObjects(pkgObjs: IPackageObject[]): Observable<IPackageObject[]> {
    const bulkPackageObjects = pkgObjs.map(s => {
      delete s['_id'];
      return s;
    });
    return this.http.post<IPackageObjectResponse>('/api/v1/package-objects', bulkPackageObjects, {observe: 'response'})
      .pipe(mergeMap(response => this.getPackageObjects()), catchError(err => throwError(err)));
  }
}
