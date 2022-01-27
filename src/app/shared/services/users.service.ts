import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {catchError, map} from "rxjs/operators";
import {Observable, throwError} from "rxjs";
import {ChangePassword, UsageReportResponse, User, UserResponse} from "../models/users.models";
import {AuthService} from "./auth.service";

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(private http: HttpClient,
              private authService: AuthService) {}

  changePassword(password: ChangePassword): Observable<User> {
    return this.http
      .put<User>(`/api/v1/users/${password.id}/changePassword`, password, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body),
        catchError((err) => throwError(err))
      );
  }

  updateUser(user: User): Observable<User> {
    const originalUser = this.authService.getUserInfo();
    if (originalUser.defaultProjectId !== user.defaultProjectId) {
      sessionStorage.removeItem('steps');
    }
    return this.http
      .put<User>(`/api/v1/users/${user.id}`, user, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body),
        catchError((err) => throwError(err))
      );
  }

  addUser(user: User): Observable<User> {
    return this.http.post<User>('/api/v1/users/', user, {
      observe: 'response',
    })
      .pipe(
        map((response) => response.body),
        catchError((err) => throwError(err))
      );
  }

  removeUser(user: User) {
    return this.http.delete(`/api/v1/users/${user.id}`, {})
      .pipe(catchError((err) => throwError(err)));
  }

  removeProject(user: User, projectId: string): Observable<User> {
    if (user.defaultProjectId === projectId) {
      sessionStorage.removeItem('steps');
    }
    return this.http
      .delete<User>(`/api/v1/users/${user.id}/project/${projectId}`, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body),
        catchError((err) => throwError(err))
      );
  }

  downloadMetadata(user: User, projectId: string, req:any) {
    return this.http
      .put(`/api/v1/users/${user.id}/project/${projectId}/export-metadata`, req,{ responseType: 'arraybuffer' });
  }

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<UserResponse>(`/api/v1/users`, {observe: 'response'})
      .pipe(
        map((response) => {
          if (response && response.body) {
            return response.body.users.map((p) => {
              delete p['_id'];
              return p;
            });
          }
          return [];
        }),
        catchError((err) => throwError(err))
      );
  }

  getUsageReport(user: User): Observable<UsageReportResponse> {
    return this.http.get<UsageReportResponse>(`/api/v1/users/${user.id}/usage-report`, {observe: 'response'})
      .pipe(
        map((response) => {
          if (response && response.body) {
            return response.body;
          }
          return null;
        }),
        catchError((err) => throwError(err))
      );
  }
}

