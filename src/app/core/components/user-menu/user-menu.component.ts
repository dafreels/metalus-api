import {Component, Input} from '@angular/core';
import {User} from "../../../shared/models/users.models";
import {AuthService} from "../../../shared/services/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent {
  @Input() user: User;

  constructor(private authService : AuthService, private route : Router) {}

  logout() {
    this.authService.logout().subscribe(() => {
      this.route.navigate(['login'], { queryParams: { returnUrl: '/' } });
    });
  }
}
