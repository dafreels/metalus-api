import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {map} from "rxjs/operators";
import {IPackageObject, IPackageObjectsResponse} from "./package-objects.model";

@Injectable()
export class PackageObjectsService {
  constructor(private http: HttpClient) {}

  getPackageObjects(): Observable<IPackageObject[]> {
    return this.http.get<IPackageObjectsResponse>(`/api/v1/package-objects`, { observe: 'response' })
      .pipe(
        map(response => response.body["package-objects"]));
  }
}
