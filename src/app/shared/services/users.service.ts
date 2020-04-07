import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {catchError, map} from "rxjs/operators";
import {Observable, throwError} from "rxjs";
import {ChangePassword, User} from "../models/users.models";
import {AuthService} from "./auth.service";

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
}
