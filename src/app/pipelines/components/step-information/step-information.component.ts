import {Component, Input, OnInit} from '@angular/core';
import {PipelineStep} from "../../models/pipelines.model";

@Component({
  selector: 'app-step-information',
  templateUrl: './step-information.component.html',
  styleUrls: ['./step-information.component.scss'],
})
export class StepInformationComponent implements OnInit {
  @Input() selectedStep: PipelineStep;

  constructor() {}

  ngOnInit() {}
}
