import {Component, OnInit} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import {Application, ExecutionTemplate} from 'src/app/applications/applications.model';
import {ApplicationsService} from 'src/app/applications/applications.service';
import {ExecutionsService} from 'src/app/applications/executions.service';
import {PackageObject} from 'src/app/core/package-objects/package-objects.model';
import {PackageObjectsService} from 'src/app/core/package-objects/package-objects.service';
import {Project, User} from 'src/app/shared/models/users.models';
import {AuthService} from 'src/app/shared/services/auth.service';
import {UsersService} from 'src/app/shared/services/users.service';
import {StepTemplate} from 'src/app/steps/steps.model';
import {StepsService} from 'src/app/steps/steps.service';
import {Pipeline} from '../../models/pipelines.model';
import {PipelinesService} from '../../services/pipelines.service';
import * as fileSaver from 'file-saver';
import {WaitModalComponent} from "../../../shared/components/wait-modal/wait-modal.component";
import {MatDialog} from "@angular/material/dialog";

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
  steps: ISelectExtend<StepTemplate>[];
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
    private authService: AuthService,
    public dialog: MatDialog) {
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
      this.packageObjects = data.filter(p => !!p.template).map(item => {
        return {
          item, checked: false
        }
      });
    })
  }
  public getSteps() {
    this.stepsService.getStepTemplates().subscribe(data => {
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

    if (this.jarName) {
      const waitDialogRef = this.dialog.open(WaitModalComponent, {
        width: '25%',
        height: '25%',
      });
      this.userService.downloadMetadata(this.defaultUser, this.defaultProject.id, {
        "name": this.jarName,
        "recursive": this.recursive,
        applicationIds,
        executionIds,
        pipelineIds,
        stepFormIds,
        classFormIds
      }).subscribe((data) => {
        waitDialogRef.close();
        let blob = new Blob([data], { type: 'application/octet-stream'});
        fileSaver.saveAs(blob, `${this.jarName}.jar`);
      });
    } else {
      this._snackBar.open("Jar name is required");
    }
  }
}
