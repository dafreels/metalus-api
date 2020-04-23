import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../shared/services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  username: String;
  userPassword: String;
  loginError: Boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {

  }

  login() {
    this.authService.login(this.username, this.userPassword)
      .subscribe(
        user => {
          this.loginError = false;
          this.router.navigate(['landing']);
        },
        error => {
          console.log(error);
          this.loginError = true;
        }
        );
  }
}
