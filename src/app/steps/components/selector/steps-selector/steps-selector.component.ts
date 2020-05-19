import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import { Step } from '../../../steps.model';

@Component({
  selector: 'app-steps-selector',
  templateUrl: './steps-selector.component.html',
  styleUrls: ['./steps-selector.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StepsSelectorComponent {
  @Input() draggableSteps = false;
  @Output() stepItemSelection = new EventEmitter();
  originalSteps: Step[];
  filterSteps: Step[];
  tags: string[] = [];

  constructor() {}

  @Input()
  set steps(steps: Step[]) {
    this.originalSteps = steps;
    const updatedSteps = [];
    if (steps) {
      steps.forEach((s) => {
        if (s.tags) {
          s.tags.forEach((t) => {
            if (this.tags.indexOf(t) === -1) {
              this.tags.push(t);
            }
          });
        }
        updatedSteps.push(s);
      });
    }
    this.tags = this.tags.sort();
    this.setSteps(updatedSteps);
  }

  stepSelected(step) {
    this.stepItemSelection.emit(step);
  }

  setSteps(steps) {
    this.filterSteps = steps;
  }

  filterList(filter: string, tags) {
    let stepTags;
    this.setSteps(
      this.originalSteps.filter((s) => {
        stepTags = s.tags || [];
        return (
          (s.displayName.toLocaleLowerCase().indexOf(filter.toLocaleLowerCase()) !== -1 ||
            (s.engineMeta && s.engineMeta.spark &&
              s.engineMeta.spark.toLocaleLowerCase().indexOf(filter.toLocaleLowerCase()) !== -1)) &&
          (!tags ||
            tags.length === 0 ||
            stepTags.findIndex((t) => tags.indexOf(t) > -1) > -1)
        );
      })
    );
  }
}
