import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IStep } from '../../../steps.model';

@Component({
  selector: 'app-steps-selector',
  templateUrl: './steps-selector.component.html'
})
export class StepsSelectorComponent {
  @Input() steps: IStep[];
  @Input() draggableSteps: boolean = false;
  @Output() stepItemSelection = new EventEmitter();

  constructor() {}

  stepSelected(step) {
    this.stepItemSelection.emit(step);
  }
}
