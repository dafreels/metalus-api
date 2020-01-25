import { EventEmitter, Input, Output } from '@angular/core';
import { Step } from '../../steps.model';
import { DropEffect } from 'ngx-drag-drop';
import { SharedFunctions } from '../../../shared/utils/shared-functions';

export abstract class StepsSelectorBase {
  steps: Step[];
  filterSteps: Step[];
  tags: string[] = [];
  dropEffect: DropEffect = 'copy';
  @Input() draggableSteps = false;

  @Output() stepItemSelection = new EventEmitter();

  @Input()
  set stepList(steps: Step[]) {
    this.steps = steps;
    const updatedSteps = [];
    if (this.steps) {
      this.steps.forEach((s) => {
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

  handleStepSelection(step) {
    this.stepItemSelection.emit(step);
  }

  filterList(filter: string, tags) {
    let stepTags;
    this.setSteps(
      this.steps.filter((s) => {
        stepTags = s.tags || [];
        return (
          s.displayName.toLocaleLowerCase().indexOf(filter) !== -1 &&
          (!tags ||
            tags.length === 0 ||
            stepTags.findIndex((t) => tags.indexOf(t) > -1) > -1)
        );
      })
    );
  }

  setSteps(steps) {
    this.filterSteps = steps;
  }

  getStepIcon(step) {
    return SharedFunctions.getMaterialIconName(step.type);
  }
}
