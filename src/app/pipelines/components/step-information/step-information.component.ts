import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-step-information',
  templateUrl: './step-information.component.html',
  styleUrls: ['./step-information.component.scss'],
})
export class StepInformationComponent implements OnInit {
  @Input() selectedStep;

  constructor() {}

  ngOnInit() {}
}
