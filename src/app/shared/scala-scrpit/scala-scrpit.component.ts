import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { BehaviorSubject } from 'rxjs';
import {
  SplitParameter,
  StepGroupProperty,
} from 'src/app/pipelines/components/pipeline-parameter/pipeline-parameter.component';

@Component({
  selector: 'app-scala-scrpit',
  templateUrl: './scala-scrpit.component.html',
  styleUrls: ['./scala-scrpit.component.scss'],
})
export class ScalaScrpitComponent implements OnInit {
  parameters: SplitParameter[] = [];
  newParamName = '';
  complexParameter = false;
  codeViewData: string = '';
  @Input() stepGroup: StepGroupProperty = { enabled: false };
  @Input() stepSuggestions: string[];
  public filteredStepResponse: BehaviorSubject<string[]> = new BehaviorSubject<
    string[]
  >(null);

  constructor(
    public dialogRef: MatDialogRef<ScalaScrpitComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log('ScalaScrpitComponent -> data', data, data.value.split(')').length);
    if (data.value.split(')').length >= 2) {
      const paramsString = data.value.split('').slice(1, data.value.indexOf(')')).join('');
      this.codeViewData = data.value.split('').slice(data.value.indexOf(')')+2).join('');
      this.parameters = paramsString.split(',').map((item, index) => {
        return {
          id: index,
          value: item.split(':')[1],
          type: item.split(':')[2],
          name: item.split(':')[0],
        };
      });
    }
  }

  ngOnInit() {}
  addParameter() {
    this.parameters.push({
      id: this.parameters.length,
      value: '',
      type: 'string',
      name: this.newParamName,
    });
    this.newParamName = '';
  }
  parameterUpdated($event, param) {
    console.log(
      'ScalaScrpitComponent -> parameterUpdated -> $event, param',
      $event,
      param
    );
  }
  saveDialog() {
    console.log(
      'ScalaScrpitComponent -> saveDialog -> this.output',
      this.output
    );
    this.dialogRef.close(this.output);
  }
  get output() {
    const params = this.parameters.reduce((acc, item) => {
      return acc
        ? `${acc},${item.name}:${item.value}:${item.type}`
        : `${item.name}:${item.value}:${item.type}`;
    }, '');
    return `(${params}) ${this.codeViewData}`;
  }
  cancelDialog() {
    this.dialogRef.close();
  }
}
