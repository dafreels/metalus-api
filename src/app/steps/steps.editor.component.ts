import {Component, OnInit} from "@angular/core";
import {IStep} from "./steps.model";
import {StepsService} from "./steps.service";
import {PackageObjectsService} from "../packageObjects/package-objects.service";
import {IPackageObject} from "../packageObjects/package-objects.model";

@Component({
  selector: 'steps-editor',
  templateUrl: './steps.editor.component.html',
  styleUrls: ['./steps.editor.component.css']
})
export class StepsEditorComponent implements OnInit {
  packageObjects: IPackageObject[];
  steps: IStep[];
  step: IStep;
  constructor(private stepsService: StepsService, private packageObjectsService: PackageObjectsService) {}

  ngOnInit(): void {
    this.stepsService.getSteps().subscribe((steps: IStep[]) => {
      this.steps = steps;
    });

    this.packageObjectsService.getPackageObjects().subscribe((pkgObjs: IPackageObject[]) => {
      this.packageObjects = pkgObjs;
    });
  }

  stepSelected(step) {
    this.step = step;
  }
}
