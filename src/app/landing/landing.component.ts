import {Component, OnInit} from '@angular/core';
import {StepsService} from "../common/steps.service";
import {IStep} from "../common/steps.model";

@Component({
  selector: 'landing-page',
  templateUrl: './landing.component.html'
})
export class LandingComponent implements OnInit {
  applicationCount: number = 0;
  pipelineCount: number = 0;
  stepCount: number = 0;
  packageObjectCount: number = 0;

  constructor(private stepsService: StepsService) {}

  ngOnInit(): void {
    this.stepsService.getSteps().subscribe((steps: IStep[]) => {
      this.stepCount = steps.length;
    });
  }
}
