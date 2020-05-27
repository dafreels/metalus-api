import {PipelinesService} from '../../../pipelines/services/pipelines.service';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {StepsService} from '../../../steps/steps.service';
import {ApplicationsService} from '../../../applications/applications.service';
import {PackageObjectsService} from '../../package-objects/package-objects.service';
import {AuthService} from "../../../shared/services/auth.service";
import {User} from "../../../shared/models/users.models";

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  applicationCount = 0;
  pipelineCount = 0;
  packageObjectCount = 0;
  stepCount = 0;
  user: User;
  userSubscription;

  constructor(
    private applicationService: ApplicationsService,
    private packageObjectsService: PackageObjectsService,
    private pipelinesService: PipelinesService,
    private stepsService: StepsService,
    private authService: AuthService) {
    this.user = this.authService.getUserInfo();
    this.userSubscription = this.authService.userItemSelection.subscribe(data => {
      this.user = data;
      this.loadCounts();
    });
  }

  ngOnInit(): void {
    this.loadCounts();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private loadCounts() {
    this.applicationService.getApplications()
      .subscribe(applications => this.applicationCount = applications.length);

    this.packageObjectsService.getPackageObjects()
      .subscribe(packageObjects => this.packageObjectCount = packageObjects.length);

    this.pipelinesService.getPipelines().subscribe(pipelines => this.pipelineCount = pipelines.length);

    this.stepsService.getSteps().subscribe(steps => this.stepCount = steps.length);
  }
}
