import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../shared/services/auth.service';
import {User} from "../../../shared/models/users.models";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {ChangePasswordModalComponent} from "../changePassword/change-password-modal.component";
import {UsersService} from "../../../shared/services/users.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: User;

  constructor(private authService: AuthService,
              private usersService: UsersService,
              private displayDialogService: DisplayDialogService) {
  }

  ngOnInit() {
    this.user = this.authService.getUserInfo();
    this.authService.userItemSelection.subscribe(data => this.user = data);
  }

  startPasswordChange() {
    const changePasswordDialog = this.displayDialogService.openDialog(
      ChangePasswordModalComponent,
      generalDialogDimensions
    );
    changePasswordDialog.afterClosed().subscribe((result) => {
      result.id = this.user.id;
      this.usersService.changePassword(result).subscribe(result => {
        this.user = result;
      })
    });
  }
}
