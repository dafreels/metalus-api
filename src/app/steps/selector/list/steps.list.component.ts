import {Component} from "@angular/core";
import {StepsSelectionComponent} from "../steps.selection.component";

@Component({
  selector: 'steps-list',
  templateUrl: './steps.list.component.html',
  styleUrls: ['./steps.list.component.css']
})
export class StepsListComponent extends StepsSelectionComponent {
  constructor() {
    super();
  }
}
