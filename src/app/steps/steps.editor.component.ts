import {Component, OnInit} from "@angular/core";
import {IStep} from "./steps.model";
import {StepsService} from "./steps.service";

@Component({
  selector: 'steps-editor',
  templateUrl: './steps.editor.component.html',
  styleUrls: ['./steps.editor.component.css']
})
export class StepsEditorComponent implements OnInit {
  steps: IStep[];
  step: IStep;
  constructor(private stepsService: StepsService) {}

  ngOnInit(): void {
    this.stepsService.getSteps().subscribe((steps: IStep[]) => {
      this.steps = steps;
    });
  }

  stepSelected(step) {
    this.step = step;
  }
}
