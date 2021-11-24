import {PipelinesService} from '../../../pipelines/services/pipelines.service';
import {Component, OnInit} from '@angular/core';
import {StepsService} from '../../../steps/steps.service';
import {ApplicationsService} from '../../../applications/applications.service';
import {PackageObjectsService} from '../../package-objects/package-objects.service';
import {AuthService} from "../../../shared/services/auth.service";
import {UsersService} from "../../../shared/services/users.service";
import {WaitModalComponent} from "../../../shared/components/wait-modal/wait-modal.component";
import {MatDialog} from "@angular/material/dialog";
import {Subject, timer} from "rxjs";
import {takeUntil} from "rxjs/operators";
import {FilesService} from "../../../shared/services/files.service";
import {ErrorModalComponent} from "../../../shared/components/error-modal/error-modal.component";

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  applicationCount = 0;
  executionsCount = 0;
  pipelineCount = 0;
  packageObjectCount = 0;
  stepCount = 0;
  providersCount = 0;
  jobsCount = 0;
  wizard = 'none';
  project;

  constructor(
    private applicationService: ApplicationsService,
    private packageObjectsService: PackageObjectsService,
    private pipelinesService: PipelinesService,
    private stepsService: StepsService,
    private authService: AuthService,
    private usersService: UsersService,
    private filesService: FilesService,
    private dialog: MatDialog) {
    this.authService.userItemSelection.subscribe(() => {
      this.loadCounts();
    });
  }

  ngOnInit(): void {
    this.loadCounts();
  }

  private loadCounts() {
    if (this.authService.getUserInfo()) {
      this.usersService.getUsageReport(this.authService.getUserInfo()).subscribe(report => {
        this.applicationCount = report.report.applicationsCount;
        this.pipelineCount = report.report.pipelinesCount;
        this.packageObjectCount = report.report.packageObjectsCount;
        this.stepCount = report.report.stepsCount;
        this.providersCount = report.report.providersCount;
        this.jobsCount = report.report.jobsCount;
        this.executionsCount = report.report.executionTemplatesCount;
      });
    }
  }

  loadWizard(wizard: string) {
    if (wizard === 'newProject') {
      this.project = {
        name: undefined,
        makeDefaultProject: false,
        templates: undefined
      }
    }
    this.wizard = wizard;
  }

  setSelectedTemplates(templates: string[]) {
    this.project.templates = templates;
  }

  createProject() {
    const user = JSON.parse(JSON.stringify(this.authService.getUserInfo()));
    let max = 0;
    user.projects.forEach((prj) => {
      max = Math.max(max, parseInt(prj.id));
    });
    const newProjectId = `${max + 1}`;
    user.projects.push({
      id: newProjectId,
      displayName: this.project.name,
      preloadedLibraries: this.project.templates,
    });
    if (this.project.templates && this.project.templates.length > 0) {
      user.metaDataLoad = {
        projectId: newProjectId,
        selectedTemplates: this.project.templates,
      };
    }
    if (this.project.makeDefaultProject) {
      user.defaultProjectId = newProjectId;
    }
    const waitDialogRef = this.dialog.open(WaitModalComponent, {
      width: '25%',
      height: '25%',
    });
    this.usersService.updateUser(user).subscribe(updatedUser => {
      if (user.metaDataLoad) {
        const subject = new Subject();
        // Wait 5 seconds before checking status and then poll every 5 seconds
        timer(5000, 5000).pipe(
          takeUntil(subject),
        ).subscribe(() => {
          this.filesService.checkProcessingStatus(user).subscribe((status) => {
            if (status.status === 'failed') {
              subject.next();
              this.handleError(new Error(status.error || 'There was an error processing metadata.'), waitDialogRef);
            } else if (status.status === 'complete') {
              subject.next();
              waitDialogRef.close();
            }
          });
        });
      }
      this.authService.setUserInfo(updatedUser);
      this.wizard = 'none';
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
