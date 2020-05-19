import {Injectable} from "@angular/core";
import {HttpClient, HttpEventType, HttpRequest, HttpResponse} from "@angular/common/http";
import {catchError, map} from "rxjs/operators";
import {Observable, Subject, throwError} from "rxjs";
import {ChangePassword, User, UserResponse} from "../models/users.models";

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  constructor(private http: HttpClient) {}

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
    return this.http
      .delete<User>(`/api/v1/users/${user.id}/project/${projectId}`, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body),
        catchError((err) => throwError(err))
      );
  }

  getAllUsers(): Observable<User[]> {
    return this.http
      .get<UserResponse>(`/api/v1/users`, { observe: 'response' })
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
}

