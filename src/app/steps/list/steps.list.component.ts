import {Component, EventEmitter, Input, Output} from "@angular/core";
import {IStep} from "../steps.model";

@Component({
  selector: 'steps-list',
  templateUrl: './steps.list.component.html',
  styleUrls: ['./steps.list.component.css']
})
export class StepsListComponent {
  steps: IStep[];
  filterSteps: IStep[];

  @Output() stepItemSelection = new EventEmitter();

  constructor() {
  }

  @Input()
  set stepList(steps: IStep[]) {
    this.steps = steps;
    this.filterSteps = [];
    if (this.steps) {
      this.steps.forEach(s => this.filterSteps.push(s));
    }
  }

  handleStepSelection(step) {
    this.stepItemSelection.emit(step);
  }

  filterList(filter: string) {
    this.filterSteps = this.steps.filter(s => s.displayName.toLocaleLowerCase().indexOf(filter) !== -1);
  }
}
