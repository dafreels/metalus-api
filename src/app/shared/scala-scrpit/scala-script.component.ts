import {Component, Inject, Input, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {
  SplitParameter,
  StepGroupProperty,
} from 'src/app/pipelines/components/pipeline-parameter/pipeline-parameter.component';

@Component({
  selector: 'app-scala-script',
  templateUrl: './scala-script.component.html',
  styleUrls: ['./scala-script.component.scss'],
})
export class ScalaScriptComponent implements OnInit {
  parameters: SplitParameter[] = [];
  newParamName = '';
  codeViewData: string = '';
  @Input() stepGroup: StepGroupProperty = { enabled: false };
  @Input() stepSuggestions: string[];

  constructor(
    public dialogRef: MatDialogRef<ScalaScriptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (typeof data.value =='string' && data.value.split(')').length >= 2) {
      const paramsString = data.value.split('').slice(1, data.value.indexOf(')')).join('');
      this.codeViewData = data.value.split('').slice(data.value.indexOf(')')+2).join('');
      this.parameters = paramsString.split(',').map((item, index) => {
        return {
          id: index,
          name: item.split(':')[0],
          value: this.formatedValue(item.split(':')[1]),
          customType: item.split(':')[2],
          type: this.getType(item.split(':')[1])
        };
      });
    }
  }

  ngOnInit() {}
  addParameter() {
    this.parameters.push({
      id: this.parameters.length,
      value: '',
      type: 'text',
      customType: '',
      name: this.newParamName,
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
  formatedValue(value){
    if(value == 'true' || value == 'false') {
      return value == 'true';
    } else if(!isNaN(value)){
      return +value;
    }
    return value;
  }
}
