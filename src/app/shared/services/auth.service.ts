import {EventEmitter, Injectable, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {User} from "../models/users.models";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  @Output() userItemSelection = new EventEmitter();

  constructor(private http: HttpClient) {}

  public isAuthenticated(): Boolean {
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

  public login(username, password) {
    return this.http.post('/api/v1/users/login', {'username': username, 'password': password}).toPromise()
  }
}
