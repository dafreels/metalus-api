import {SharedFunctions} from "../../../../shared/utils/shared-functions";
import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Step} from "../../../steps.model";
import {DropEffect} from "ngx-drag-drop";

@Component({
  selector: 'app-steps-list-item',
  templateUrl: './steps-list-item.component.html',
  styleUrls: ['./steps-list-item.component.scss']
})
export class StepsListItemComponent {
  @Input() steps: Step[];
  @Input() draggableSteps = false;
  dropEffect: DropEffect = 'copy';
  @Output() stepItemSelection = new EventEmitter();

  constructor() {}

  getStepIcon(step) {
    return SharedFunctions.getMaterialIconName(step.type);
  }

  handleStepSelection(step) {
    this.stepItemSelection.emit(step);
  }
}
