import {PipelinesService} from '../../../pipelines/services/pipelines.service';
import {Component, OnInit} from '@angular/core';
import {StepsService} from '../../../steps/steps.service';
import {ApplicationsService} from '../../../applications/applications.service';
import {PackageObjectsService} from '../../package-objects/package-objects.service';

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

  constructor(
    private applicationService: ApplicationsService,
    private packageObjectsService: PackageObjectsService,
    private pipelinesService: PipelinesService,
    private stepsService: StepsService,
    ) {}

  ngOnInit(): void {
    this.loadCounts();
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
