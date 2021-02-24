import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../../shared/services/auth.service';
import {User} from "../../../shared/models/users.models";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {DialogDimensions, generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {ChangePasswordModalComponent} from "./changePassword/change-password-modal.component";
import {UsersService} from "../../../shared/services/users.service";
import {MatDialog} from "@angular/material/dialog";
import {ConfirmationModalComponent} from "../../../shared/components/confirmation/confirmation-modal.component";
import {NewProjectDialogComponent} from "./new-project/new-project.component";
import {ProjectTemplatesDialogComponent} from "./project-templates/project-templates-dialog.component";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  displayedColumns: string[] = ['id', 'displayName', 'default', 'preloadedProjects', 'remove'];
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
      this.usersService.changePassword(result).subscribe(updatedUser => {
        this.authService.setUserInfo(updatedUser);
      });
    });
  }

  changeDefaultProject(projectId: string) {
    // Clone user so project only shows up after the update is complete
    const user = JSON.parse(JSON.stringify(this.user));
    user.defaultProjectId = projectId;
    this.usersService.updateUser(user).subscribe(updatedUser => {
      this.authService.setUserInfo(updatedUser);
    });
  }

  openProjectTemplates(projectId: string) {
    console.log('doo doo')
    const deleteProjectDialogDimensions: DialogDimensions = {
      width: '450px',
      height: '200px',
    };
    const selectedProject = this.user.projects.find(p => p.id === projectId);
    let preloadedLibraries = [];
    if (selectedProject) {
      preloadedLibraries = selectedProject.preloadedLibraries || [];
    }
    const preloadTemplateDialog = this.displayDialogService.openDialog(
      ProjectTemplatesDialogComponent,
      deleteProjectDialogDimensions,
      preloadedLibraries
    );
    preloadTemplateDialog.afterClosed().subscribe(templates => {
      if (templates) {
        const user = JSON.parse(JSON.stringify(this.user));
        const projects = [];
        let selectedTemplates = [];
        let libraries;
        user.projects.forEach(project => {
          if (project.id === projectId) {
            libraries = project.preloadedLibraries || [];
            selectedTemplates = templates.filter(t => libraries.indexOf(t) === -1);
            project.preloadedLibraries = templates;
          }
          projects.push(project);
        });
        user.projects = projects;
        user.metaDataLoad = {
          projectId: user.defaultProjectId,
          selectedTemplates,
        };
        this.usersService.updateUser(user).subscribe(updatedUser => {
          this.authService.setUserInfo(updatedUser);
        });
      }
    });
  }

  removeProject(projectId: string) {
    const deleteProjectDialogData = {
      message:
        'Are you sure you wish to delete this project? This will remove the project and all project data. Would you like to continue?',
    };
    const deleteProjectDialogDimensions: DialogDimensions = {
      width: '450px',
      height: '200px',
    };
    const deleteStepDialog = this.displayDialogService.openDialog(
      ConfirmationModalComponent,
      deleteProjectDialogDimensions,
      deleteProjectDialogData
    );

    deleteStepDialog.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        this.usersService.removeProject(this.user, projectId).subscribe(updatedUser => {
          this.authService.setUserInfo(updatedUser);
        });
      }
    });
  }

  addProject() {
    const dialogRef = this.dialog.open(NewProjectDialogComponent, {
      width: '30%',
      height: '400px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.name.trim().length > 0) {
        const name = result.name;
        let max = 0;
        // Clone user so project only shows up after the update is complete
        const user = JSON.parse(JSON.stringify(this.user));
        user.projects.forEach((prj) => {
          max = Math.max(max, parseInt(prj.id));
        });
        const newProjectId = `${max + 1}`;
        user.projects.push({
          id: newProjectId,
          displayName: name,
          preloadedLibraries: result.selectedTemplates,
        });
        if (result.selectedTemplates && result.selectedTemplates.length > 0) {
          user.metaDataLoad = {
            projectId: newProjectId,
            selectedTemplates: result.selectedTemplates,
          };
        }
        this.usersService.updateUser(user).subscribe(updatedUser => {
          this.authService.setUserInfo(updatedUser);
        });
      }
    });
  }
}
