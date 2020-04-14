import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../shared/services/auth.service';
import {Router} from '@angular/router';
import {User} from "../../../shared/models/users.models";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  username: String;
  userPassword: String;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {

  }

  login() {
    this.authService.login(this.username, this.userPassword)
      .then((response) => {
        this.authService.setUserInfo(response as User);
        this.router.navigate(['landing']);
      })
  }
}
