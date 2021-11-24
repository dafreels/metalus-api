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
import {FilesService} from "../../../shared/services/files.service";
import {WaitModalComponent} from "../../../shared/components/wait-modal/wait-modal.component";
import {Subject, timer} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {ErrorModalComponent} from "../../../shared/components/error-modal/error-modal.component";

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
              private filesService: FilesService,
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
    const deleteProjectDialogDimensions: DialogDimensions = {
      width: '600px',
      height: '400px',
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
        const waitDialogRef = this.dialog.open(WaitModalComponent, {
          width: '25%',
          height: '25%',
        });
        this.usersService.updateUser(user).subscribe(updatedUser => {
          if (user.metaDataLoad) {
            const subject = new Subject();
            // Wait 20 seconds before checking status and then poll every 10 seconds
            timer(20000, 10000).pipe(
              takeUntil(subject),
            ).subscribe(() => {
              this.filesService.checkProcessingStatus(this.user).subscribe((status) => {
                if (status.status === 'failed') {
                  subject.next();
                  this.handleError(new Error(status.error || 'There was an error processing metadata.'), waitDialogRef);
                } else if (status.status === 'complete') {
                  subject.next();
                  waitDialogRef.close();
                  // this.router.navigate(['landing']);
                }
              });
            });
          }
          this.authService.setUserInfo(updatedUser);
        },
          (error) => {
            this.handleError(error, waitDialogRef);
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

  private handleError(error, dialogRef) {
    let message;
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      message = error.error.message;
    } else {
      message = error.message;
    }
    dialogRef.close();
    this.dialog.open(ErrorModalComponent, {
      width: '450px',
      height: '300px',
      data: { messages: message.split('\n') },
    });
  }
}
