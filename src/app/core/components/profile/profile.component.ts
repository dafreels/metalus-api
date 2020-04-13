import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../shared/services/auth.service';
import {User} from "../../../shared/models/users.models";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {DialogDimensions, generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {ChangePasswordModalComponent} from "./changePassword/change-password-modal.component";
import {UsersService} from "../../../shared/services/users.service";
import {NameDialogComponent} from "../../../shared/components/name-dialog/name-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmationModalComponent} from "../../../shared/components/confirmation/confirmation-modal.component";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  user: User;

  constructor(private authService: AuthService,
              private usersService: UsersService,
              private displayDialogService: DisplayDialogService,
              public dialog: MatDialog) {
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
        this.authService.setUserInfo(this.user);
      });
    });
  }

  changeDefaultProject(projectId: string) {
    this.user.defaultProjectId = projectId;
    this.usersService.updateUser(this.user).subscribe(result => {
      this.authService.setUserInfo(this.user);
    });
  }

  removeProject(projectId: string) {
    const deleteProjectDialogData = {
      message:
        'Are you sure you wish to delete this project? This will remove the project and all project data. Would you like to continue?',
    };
    const deleteProjectDialogDimensions: DialogDimensions = {
      width: '450px',
      heigh: '200px',
    };
    const deleteStepDialog = this.displayDialogService.openDialog(
      ConfirmationModalComponent,
      deleteProjectDialogDimensions,
      deleteProjectDialogData
    );

    deleteStepDialog.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        this.user.defaultProjectId = projectId;
        this.usersService.removeProject(this.user, projectId).subscribe(result => {
          this.authService.setUserInfo(this.user);
        });
      }
    });
  }

  addProject() {
    const dialogRef = this.dialog.open(NameDialogComponent, {
      width: '25%',
      height: '25%',
      data: { name: '' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.trim().length > 0) {
        const name = result as string;
        let max = 0;
        this.user.projects.forEach((prj) => {
          max = Math.max(max, parseInt(prj.id));
        });
        this.user.projects.push({
          id: `${max + 1}`,
          displayName: name
        });
        this.usersService.updateUser(this.user).subscribe(result => {
          this.authService.setUserInfo(this.user);
        });
      }
    });
  }
}
