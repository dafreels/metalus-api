import { PipelinesService } from './../../../pipelines/services/pipelines.service';
import { Component, OnInit } from '@angular/core';
import { StepsService } from '../../../steps/steps.service';
import { Step } from '../../../steps/steps.model';
import { Pipeline } from '../../../pipelines/models/pipelines.model';
import { ApplicationsService } from '../../../applications/applications.service';
import { Application } from '../../../applications/applications.model';
import { PackageObjectsService } from '../../package-objects/package-objects.service';
import { PackageObject } from '../../package-objects/package-objects.model';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing.component.html',
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
    private stepsService: StepsService
  ) {}

  ngOnInit(): void {
    this.applicationService
      .getApplications()
      .subscribe((applications: Application[]) => {
        this.applicationCount = applications.length;
      });

    this.packageObjectsService
      .getPackageObjects()
      .subscribe((packageObjects: PackageObject[]) => {
        this.packageObjectCount = packageObjects.length;
      });

    this.pipelinesService.getPipelines().subscribe((pipelines: Pipeline[]) => {
      this.pipelineCount = pipelines.length;
    });

    this.stepsService.getSteps().subscribe((steps: Step[]) => {
      this.stepCount = steps.length;
    });
  }
}
