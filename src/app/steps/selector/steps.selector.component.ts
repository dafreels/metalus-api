import {Component, EventEmitter, Input, Output} from "@angular/core";
import {IStep} from "../steps.model";

@Component({
  selector: 'steps-selector',
  templateUrl: './steps.selector.component.html'
})
export class StepsSelectorComponent {
  stepList: IStep[];
  @Output() stepItemSelection = new EventEmitter();
  constructor() {}

  @Input()
  set steps(steps: IStep[]) {
    this.stepList = steps;
  }

  stepSelected(step) {
    this.stepItemSelection.emit(step);
  }
}
