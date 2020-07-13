import { Component, Input, OnDestroy } from '@angular/core';
import { Project, User } from '../../../shared/models/users.models';
import { AuthService } from '../../../shared/services/auth.service';
import { Router } from '@angular/router';
import { UsersService } from '../../../shared/services/users.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { LogOutComponent } from '../log-out/log-out.component';

@Component({
  selector: 'user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent implements OnDestroy
 {
  defaultUser: User;
  defaultProject: Project;
  userSubscription;

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private route: Router,
    public matDialog: MatDialog
  ) {
    this.user = this.authService.getUserInfo();
    this.userSubscription = this.authService.userItemSelection.subscribe(data => {
      this.user = data;
    });
  }
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  @Input()
  set user(user) {
    this.defaultUser = user;
    this.defaultProject = user.projects.find(
      (p) => p.id === user.defaultProjectId
    );
  }

  public openModal() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    const modalDialog = this.matDialog.open(LogOutComponent, dialogConfig);
    modalDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.route.navigate(['login'], { queryParams: { returnUrl: '/' } });
      }
    });
  }

  changeDefaultProject(projectId: string) {
    // Clone user so project only shows up after the update is complete
    const user = JSON.parse(JSON.stringify(this.defaultUser));
    user.defaultProjectId = projectId;
    this.usersService.updateUser(user).subscribe((updatedUser) => {
      this.authService.setUserInfo(updatedUser);
    });
  }
}
