import {Component, Input} from "@angular/core";
import {User} from "../../../shared/models/users.models";

@Component({
  selector: 'nav-toolbar',
  templateUrl: './nav-toolbar.component.html',
  styleUrls: ['./nav-toolbar.component.scss']
})
export class NavToolbarComponent {
  @Input() user: User;
  @Input() page: string;
  @Input() title: string;
}
