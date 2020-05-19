import {Component, OnInit} from "@angular/core";
import {User} from "../../../shared/models/users.models";
import {UsersService} from "../../../shared/services/users.service";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {MatDialog} from "@angular/material/dialog";
import {AuthService} from "../../../shared/services/auth.service";
import {DialogDimensions} from "../../../shared/models/custom-dialog.model";
import {ConfirmationModalComponent} from "../../../shared/components/confirmation/confirmation-modal.component";
import {UsersModalComponent} from "./manage/users-modal.component";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {

  currentUser: User;
  users: User[];

  constructor(private authService: AuthService,
              private usersService: UsersService,
              private displayDialogService: DisplayDialogService,
              public dialog: MatDialog) {
  }

  ngOnInit() {
    this.currentUser = this.authService.getUserInfo();
    this.usersService.getAllUsers().subscribe(data => this.users = data);
    this.authService.userItemSelection.subscribe(data => this.currentUser = data);
  }

  addUser() {
    const dialogRef = this.dialog.open(UsersModalComponent, {
      width: '50%',
      height: '60%',
      data: {
        username: '',
        password: '',
        displayName: '',
        role: 'developer',
        defaultProjectId: '1',
        projects: [
          {
            id: '1',
            displayName: 'Default Project'
          }
        ]
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      this.users.push(result);
      this.users = [...this.users];
    });
  }

  editUser(user: User) {
    const dialogRef = this.dialog.open(UsersModalComponent, {
      width: '50%',
      height: '60%',
      data: user,
    });
    dialogRef.afterClosed().subscribe((result) => {
      const userIndex = this.users.findIndex(u => u.id === result.id);
      this.users.splice(userIndex, 1, result);
      this.users = [...this.users];
    })
  }

  removeUser(user: User) {
    const deleteStepDialogData = {
      message:
        'Are you sure you wish to delete this user? This will remove the user and all project data. Would you like to continue?',
    };
    const deleteStepDialogDimensions: DialogDimensions = {
      width: '450px',
      height: '200px',
    };
    const deleteStepDialog = this.displayDialogService.openDialog(
      ConfirmationModalComponent,
      deleteStepDialogDimensions,
      deleteStepDialogData
    );

    deleteStepDialog.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        this.usersService.removeUser(user).subscribe(data => {
          this.usersService.getAllUsers().subscribe(data => this.users = data);
        });
      }
    });
  }
}
