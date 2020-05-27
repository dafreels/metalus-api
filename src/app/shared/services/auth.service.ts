import {EventEmitter, Injectable, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {User} from "../models/users.models";
import {Observable, throwError} from "rxjs";
import {catchError, map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  @Output() userItemSelection = new EventEmitter();

  constructor(private http: HttpClient) {}

  public isAuthenticated(): boolean {
    const userData = this.getUserInfo();
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
