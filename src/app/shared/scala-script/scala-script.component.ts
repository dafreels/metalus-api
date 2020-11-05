import {Component, Inject, Input, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {StepGroupProperty,} from 'src/app/pipelines/components/pipeline-parameter/pipeline-parameter.component';
import {PipelineStepParam} from "../../pipelines/models/pipelines.model";

@Component({
  selector: 'app-scala-script',
  templateUrl: './scala-script.component.html',
  styleUrls: ['./scala-script.component.scss'],
})
export class ScalaScriptComponent implements OnInit {
  parameters: PipelineStepParam[] = [];
  newParamName = '';
  codeViewData: string = '';
  @Input() stepGroup: StepGroupProperty = { enabled: false };
  stepSuggestions: string[];

  constructor(
    public dialogRef: MatDialogRef<ScalaScriptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const inputData = data.data;
    if (typeof inputData.value === 'string' && inputData.value.split(')').length >= 2) {
      const paramsString = inputData.value.split('').slice(1, inputData.value.indexOf(')')).join('');
      this.codeViewData = inputData.value.split('').slice(inputData.value.indexOf(')')+2).join('');
      this.parameters = paramsString.split(',').map((item, index) => {
        return {
          id: index,
          name: item.split(':')[0],
          value: this.formattedValue(item.split(':')[1]),
          customType: item.split(':')[2] || '',
          type: this.getType(item.split(':')[1])
        };
      });
    }
    this.stepSuggestions = data.stepSuggestions;
  }

  ngOnInit() {}

  addParameter() {
    this.parameters.push({
      value: '',
      type: 'text',
      customType: '',
      name: this.newParamName,
      required: true,
      defaultValue: undefined,
      language: undefined,
      className: undefined,
      parameterType: undefined,
    });
    this.newParamName = '';
  }

  deleteParameter(parameter) {
    this.parameters = this.parameters.filter(param=>param!=parameter)
  }

  saveDialog() {
    this.dialogRef.close(this.output);
  }

  get output() {
    let customType;
    const params = this.parameters.reduce((acc, item) => {
      customType = item.customType ? `:${item.customType}` : '';
      return acc
        ? `${acc},${item.name}:${item.value}${customType}`
        : `${item.name}:${item.value}${customType}`;
    }, '');
    return `(${params}) ${this.codeViewData}`;
  }

  cancelDialog() {
    this.dialogRef.close();
  }

  getType(value){
    if(value == 'true' || value == 'false') {
      return 'boolean';
    }else if(!isNaN(value)){
      return 'number';
    }
    return 'text';
  }

  formattedValue(value){
    if(value == 'true' || value == 'false') {
      return value == 'true';
    } else if(!isNaN(value)){
      return +value;
    }
    return value;
  }
}
