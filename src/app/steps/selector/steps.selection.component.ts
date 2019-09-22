import {EventEmitter, Input, Output} from "@angular/core";
import {IStep} from "../steps.model";
import {DropEffect} from "ngx-drag-drop";

export abstract class StepsSelectionComponent {

  steps: IStep[];
  filterSteps: IStep[];
  @Input() draggableSteps: boolean = false;
  dropEffect: DropEffect = 'copy';

  @Output() stepItemSelection = new EventEmitter();

  @Input()
  set stepList(steps: IStep[]) {
    this.steps = steps;
    const updatedSteps = [];
    if (this.steps) {
      this.steps.forEach(s => updatedSteps.push(s));
    }
    this.setSteps(updatedSteps);
  }

  handleStepSelection(step) {
    this.stepItemSelection.emit(step);
  }

  filterList(filter: string) {
    this.setSteps(this.steps.filter(s => s.displayName.toLocaleLowerCase().indexOf(filter) !== -1));
  }

  setSteps(steps) {
    this.filterSteps = steps;
  }
}
