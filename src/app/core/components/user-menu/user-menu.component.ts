import {Component, Input} from '@angular/core';
import {User} from "../../../shared/models/users.models";

@Component({
  selector: 'user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent {
  @Input() user: User;

  constructor() {}
}
