import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Component, Inject, OnInit} from '@angular/core';
import {StepsService} from "../../../steps/steps.service";
import {Step} from "../../../steps/steps.model";
import {PackageObject} from "../../../core/package-objects/package-objects.model";

@Component({
  selector: 'custom-branch-dialog',
  templateUrl: './custom-branch-dialog.component.html',
  styleUrls: ['./custom-branch-dialog.component.scss']
})
export class CustomBranchDialogComponent implements OnInit {
  steps: Step[];
  step = {
    category: '',
    description: '',
    displayName: '',
    id: '',
    params: [],
    type: 'branch',
  };
  resultParams = [];
  selectedStepId: string;
  stepSelected: boolean = false;
  paramIndex = 0;

  constructor(public dialogRef: MatDialogRef<CustomBranchDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: PackageObject[],
              private stepsService: StepsService) {
  }

  saveDialog(): void {
    this.resultParams.forEach(p => {
      delete p.id;
      this.step.params.push(p);
    });
    this.dialogRef.close(this.step);
  }

  cancelDialog(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {
    this.stepsService.getSteps().subscribe(steps => {
      this.steps = steps.filter(s => s.type.toLocaleLowerCase() !== 'branch');
    });
  }

  handleStepSelected() {
    const step = this.steps.find(s => s.id === this.selectedStepId);
    if (step) {
      const template = JSON.parse(JSON.stringify(step));
      template.stepId = template.id;
      template.id = '';
      template.category = 'Custom';
      template.type = 'branch';
      this.resultParams = [];
      this.step = template;
      this.stepSelected = true;
    }
  }

  addResult() {
    this.resultParams.push({
      id: this.paramIndex++,
      type: 'result',
      name: '',
      required: false,
      defaultValue: undefined,
      language: undefined,
      className: undefined,
      parameterType: undefined,
    })
  }

  removeParam(id: any) {
    const index = this.resultParams.findIndex(p => p.id === id);
    if (index > -1) {
      this.resultParams.splice(index, 1);
    }
  }

  validate(): boolean {
    return this.resultParams.length > 0 &&
      !this.resultParams.find(p => p.name.trim().length === 0) &&
      this.step.id && this.step.id.trim().length > 4;
  }
}
