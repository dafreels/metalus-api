import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { PackageObject, PackageObjectResponse, PackageObjectsResponse } from './package-objects.model';

@Injectable({
  providedIn: 'root',
})
export class PackageObjectsService {
  updatePackageTemplate(selectedPackage: PackageObject) {
    return this.http.put<PackageObjectsResponse>(`/api/v1/package-objects/${selectedPackage.id}`,selectedPackage, { observe: 'response' })
    .pipe(
      map(response => {
        if (response && response.body) {
          return response.body['package-object'];
        }
        return [];
      }));
  }
  constructor(private http: HttpClient) {}

  getPackageObjects(): Observable<PackageObject[]> {
    return this.http.get<PackageObjectsResponse>(`/api/v1/package-objects`, { observe: 'response' })
      .pipe(
        map(response => {
          if (response && response.body) {
            return response.body['package-objects'];
          }
          return [];
        }));
  }

  updatePackageObjects(pkgObjs: PackageObject[]): Observable<PackageObject[]> {
    const bulkPackageObjects = pkgObjs.map(s => {
      delete s['_id'];
      return s;
    });
    return this.http.post<PackageObjectResponse>('/api/v1/package-objects', bulkPackageObjects, {observe: 'response'})
      .pipe(mergeMap(response => this.getPackageObjects()), catchError(err => throwError(err)));
  }
}
