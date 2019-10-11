import {EventEmitter, Input, Output} from "@angular/core";
import {IStep} from "../steps.model";
import {DropEffect} from "ngx-drag-drop";
import {FormControl} from "@angular/forms";

export abstract class StepsSelectionComponent {
  steps: IStep[];
  filterSteps: IStep[];
  tags: string[] = [];
  dropEffect: DropEffect = 'copy';
  @Input() draggableSteps: boolean = false;

  @Output() stepItemSelection = new EventEmitter();

  @Input()
  set stepList(steps: IStep[]) {
    this.steps = steps;
    const updatedSteps = [];
    if (this.steps) {
      this.steps.forEach(s => {
        if (s.tags) {
          s.tags.forEach(t => {
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
    this.setSteps(this.steps.filter(s => {
      stepTags = s.tags || [];
      return s.displayName.toLocaleLowerCase().indexOf(filter) !== -1 &&
        (!tags || tags.length === 0 || stepTags.findIndex(t => tags.indexOf(t) > -1) > -1);
    }));
  }

  setSteps(steps) {
    this.filterSteps = steps;
  }
}
