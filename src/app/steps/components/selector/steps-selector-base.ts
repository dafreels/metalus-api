import { EventEmitter, Input, Output } from '@angular/core';
import { Step } from '../../steps.model';
import { DropEffect } from 'ngx-drag-drop';
import { SharedFunctions } from '../../../shared/utils/shared-functions';

export abstract class StepsSelectorBase {
  steps: Step[];
  dropEffect: DropEffect = 'copy';
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

  getStepIcon(step) {
    return SharedFunctions.getMaterialIconName(step.type);
  }
}
