import {Component, EventEmitter, Input, Output} from "@angular/core";
import {IStep} from "../steps.model";

@Component({
  selector: 'steps-list',
  templateUrl: './steps.list.component.html',
  styleUrls: ['./steps.list.component.css']
})
export class StepsListComponent {
  steps: IStep[];

  @Output() stepItemSelection = new EventEmitter();

  constructor() {}

  @Input()
  set stepList(steps: IStep[]) {
    this.steps = steps;
  }

  handleStepSelection(step) {
    this.stepItemSelection.emit(step);
  }
}
