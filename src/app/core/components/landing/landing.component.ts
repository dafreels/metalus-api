import {PipelinesService} from '../../../pipelines/services/pipelines.service';
import {Component, OnInit} from '@angular/core';
import {StepsService} from '../../../steps/steps.service';
import {ApplicationsService} from '../../../applications/applications.service';
import {PackageObjectsService} from '../../package-objects/package-objects.service';
import {AuthService} from "../../../shared/services/auth.service";
import {UsersService} from "../../../shared/services/users.service";

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  applicationCount = 0;
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
    private usersService: UsersService) {
    this.authService.userItemSelection.subscribe(() => {
      this.loadCounts();
    });
  }

  ngOnInit(): void {
    this.loadCounts();
  }

  private loadCounts() {
    this.usersService.getUsageReport(this.authService.getUserInfo()).subscribe(report => {
      this.applicationCount = report.report.applicationsCount;
      this.pipelineCount = report.report.pipelinesCount;
      this.packageObjectCount = report.report.packageObjectsCount;
      this.stepCount = report.report.stepsCount;
      this.providersCount = report.report.providersCount;
      this.jobsCount = report.report.jobsCount;
    });
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
    this.usersService.updateUser(user).subscribe(updatedUser => {
      this.authService.setUserInfo(updatedUser);
      this.wizard = 'none';
    });
  }
}
