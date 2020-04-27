import {EventEmitter, Input, Output} from '@angular/core';
import {Step} from '../../steps.model';

export abstract class StepsSelectorBase {
  steps: Step[];
  @Input() draggableSteps = false;
  @Output() stepItemSelection = new EventEmitter();

  @Input()
  set stepList(steps: Step[]) {
    this.setSteps(steps);
  }

  handleStepSelection(step) {
    this.stepItemSelection.emit(step);
  }

  setSteps(steps) {
    this.steps = steps;
  }
}
