import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Application, ExecutionTemplate } from 'src/app/applications/applications.model';
import { ApplicationsService } from 'src/app/applications/applications.service';
import { ExecutionsService } from 'src/app/applications/executions.service';
import { PackageObject } from 'src/app/core/package-objects/package-objects.model';
import { PackageObjectsService } from 'src/app/core/package-objects/package-objects.service';
import { User, Project } from 'src/app/shared/models/users.models';
import { AuthService } from 'src/app/shared/services/auth.service';
import { UsersService } from 'src/app/shared/services/users.service';
import { Step } from 'src/app/steps/steps.model';
import { StepsService } from 'src/app/steps/steps.service';
import { Pipeline } from '../../models/pipelines.model';
import { PipelinesService } from '../../services/pipelines.service';
interface ISelectExtend<T> {
  item: T;
  checked: boolean;
}
@Component({
  selector: 'app-download-metadata',
  templateUrl: './download-metadata.component.html',
  styleUrls: ['./download-metadata.component.scss']
})
export class DownloadMetadataComponent implements OnInit {
  applications: ISelectExtend<Application>[];
  pipelines: ISelectExtend<Pipeline>[];
  packageObjects: ISelectExtend<PackageObject>[];
  executions: ISelectExtend<ExecutionTemplate>[];
  steps: ISelectExtend<Step>[];
  defaultUser: User;
  defaultProject: Project;
  jarName: string;
  recursive = true;
  set user(user) {
    this.defaultUser = user;
    this.defaultProject = user.projects.find(
      (p) => p.id === user.defaultProjectId
    );
  }
  constructor(
    private applicationsService: ApplicationsService,
    private executionsService: ExecutionsService,
    private pipelinesService: PipelinesService,
    private stepsService: StepsService,
    private packageObjectsService: PackageObjectsService,
    private userService: UsersService,
    private _snackBar: MatSnackBar,
    private authService: AuthService) {
    this.user = this.authService.getUserInfo();
  }

  ngOnInit() {
    this.getPipelines();
    this.getApplications();
    this.getpackageObjects();
    this.getSteps();
    this.getExecutions();
  }

  public getPipelines() {
    this.pipelinesService.getPipelines().subscribe(data => {
      this.pipelines = data.map(item => {
        return {
          item, checked: false
        }
      });
    })
  }
  public getApplications() {
    this.applicationsService.getApplications().subscribe(data => {
      this.applications = data.map(item => {
        return {
          item, checked: false
        }
      });
    })
  }

  public getpackageObjects() {
    this.packageObjectsService.getPackageObjects().subscribe(data => {
      this.packageObjects = data.map(item => {
        return {
          item, checked: false
        }
      });
    })
  }
  public getSteps() {
    this.stepsService.getSteps().subscribe(data => {
      this.steps = data.map(item => {
        return {
          item, checked: false
        }
      });
    })
  }
  public getExecutions() {
    this.executionsService.getExecutions().subscribe(data => {
      this.executions = data.map(item => {
        return {
          item, checked: false
        }
      });
    })
  }

  public downloadUI() {
    const applicationIds = this.applications.filter(item => item.checked).map(item => item.item.id);
    const executionIds = this.executions.filter(item => item.checked).map(item => item.item.id);
    const pipelineIds = this.pipelines.filter(item => item.checked).map(item => item.item.id);
    const stepFormIds = this.steps.filter(item => item.checked).map(item => item.item.id);
    const classFormIds = this.packageObjects.filter(item => item.checked).map(item => item.item.id);

    if (this.jarName && applicationIds.length) {

      this.userService.downloadProject(this.defaultUser, this.defaultProject.id, {
        "name": this.jarName,
        "recursive": this.recursive,
        applicationIds,
        executionIds,
        pipelineIds,
        stepFormIds,
        classFormIds
      }).subscribe(data => {
      })
    } else {
      const message = this.jarName ? "Chose at least one application" : "Jar name is required";
      this._snackBar.open(message);
    }
  }
}
