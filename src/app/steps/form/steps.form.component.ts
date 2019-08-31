import {Component, Input} from '@angular/core';
import {IStep} from "../steps.model";

@Component({
  selector: 'steps-form',
  templateUrl: './steps.form.component.html',
  styleUrls: ['./steps.form.component.css']
})
export class StepsFormComponent {

  selectedStep: IStep;
  originalStep: IStep;

  constructor() {
  }

  @Input()
  set step(step: IStep) {
    if (step) {
      this.selectedStep = JSON.parse(JSON.stringify(step));
      this.originalStep = step;
    } else {
      this.step = {
        category: '', description: '', displayName: '', id: '', params: [], type: '', engineMeta: {
          pkg: '',
          spark: '',
          stepResults: []
        }
      };
    }
  }

  saveStep() {
    console.log(JSON.stringify(this.selectedStep, null, 4))
  }

  openEditor() {

  }
}
