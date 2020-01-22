import { Component } from '@angular/core';
import { StepsSelectorBase } from '../steps-selector-base';

@Component({
  selector: 'app-steps-list',
  templateUrl: './steps-list.component.html',
  styleUrls: ['./steps-list.component.scss']
})
export class StepsListComponent extends StepsSelectorBase {
  constructor() {
    super();
  }
}
