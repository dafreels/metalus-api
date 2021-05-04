import {Component, OnDestroy, OnInit} from '@angular/core';
import {User} from "./shared/models/users.models";
import {AuthService} from "./shared/services/auth.service";
import {interval, Subscription} from "rxjs";
import {Router} from "@angular/router";
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'metalus-api';
  user: User;
  private readonly checkAuth = interval(600000).pipe(map((timeOut)=>{
    return this.authService.getAutoLogout();
  })); // Every 10 minutes - 600000
  private authSubscription: Subscription;

  constructor(private authService: AuthService, private route : Router) {
    this.user = this.authService.getUserInfo();
    this.authService.userItemSelection.subscribe(data => this.user = data);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.authSubscription = this.checkAuth.subscribe(val => {
      if(!val){
        return;
      }
      return this.authService.checkUserAuth(this.user)
        .subscribe(status => {
          if (this.user && (!status || !status.authorized)) {
            this.authService.removeUserInfo();
            this.route.navigate(['login'], {queryParams: {returnUrl: '/'}});
          }
        });
    });
  }
}
