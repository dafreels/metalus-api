import {EventEmitter, Injectable, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {User} from "../models/users.models";
import {Observable, of, throwError} from "rxjs";
import {catchError, map} from "rxjs/operators";

export interface AuthorizationStatus {
  timeRemaining: number;
  authorized: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private autoLogout = true;
  getAutoLogout(){
    return this.autoLogout;
  }

  setAutoLogout(logout:boolean){
    this.autoLogout = logout;
  }

  @Output() userItemSelection = new EventEmitter();
  private unauthorizedResponse: AuthorizationStatus = {
    authorized: false,
    timeRemaining: 0
  };

  constructor(private http: HttpClient) {}

  public isAuthenticated(): boolean {
    const userData = this.getUserInfo();
    // TODO if there is no user data, make a call to the API to see if the sid cookie is stil valid
    return userData && userData.id && userData.id.trim().length > 0;
  }

  public getUserInfo(): User {
    const userData = sessionStorage.getItem('userInfo');
    return JSON.parse(userData) as User;
  }

  public setUserInfo(user: User) {
    sessionStorage.setItem('userInfo', JSON.stringify(user));
    this.userItemSelection.emit(user);
  }

  public removeUserInfo() {
    sessionStorage.removeItem('userInfo');
  }

  public checkUserAuth(user: User): Observable<AuthorizationStatus> {
    if (!user) {
      return of(this.unauthorizedResponse);
    }
    return this.http.get<any>(`/api/v1/users/${user.id}/session-valid`, {observe: 'response'})
      .pipe(
        map((response) => {
          const timeRemaining = new Date(response.body.expires).getTime() - new Date().getTime();
          return {
            authorized: response.status === 200,
            timeRemaining
          };
        }),
        catchError((err) => {
          return of(this.unauthorizedResponse);
        })
      );
  }

  public login(username, password): Observable<User> {
    return this.http.post<User>('/api/v1/users/login', {'username': username, 'password': password}, {
      observe: 'response',
    })
      .pipe(
        map((response) => {
          const user = response.body;
          this.setUserInfo(user);
          return user;
        }),
        catchError((err) => throwError(err))
      );
  }

  public logout() {
    return this.http.post<any>('/api/v1/users/logout', null, { observe: 'response' })
      .pipe(
        map(() => {
          sessionStorage.removeItem('userInfo');
          this.userItemSelection.emit(null);
        }),
        catchError((err) => throwError(err))
      );
  }
}
