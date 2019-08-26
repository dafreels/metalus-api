import {Component, OnInit} from "@angular/core";
import {IStep} from "../steps.model";
import {StepsService} from "../steps.service";

@Component({
  selector: 'steps-list',
  templateUrl: './steps.list.component.html',
  styleUrls: ['./steps.list.component.css']
})
export class StepsListComponent implements OnInit {
  steps: IStep[];

  constructor(private stepsService: StepsService) {}

  ngOnInit(): void {
    this.stepsService.getSteps().subscribe((steps: IStep[]) => {
      this.steps = steps;
    });
  }
}
