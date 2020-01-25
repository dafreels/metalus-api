import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Step } from '../../../steps.model';

@Component({
  selector: 'app-steps-selector',
  templateUrl: './steps-selector.component.html',
})
export class StepsSelectorComponent {
  @Input() steps: Step[];
  @Input() draggableSteps = false;
  @Output() stepItemSelection = new EventEmitter();

  constructor() {}

  stepSelected(step) {
    this.stepItemSelection.emit(step);
  }
}
