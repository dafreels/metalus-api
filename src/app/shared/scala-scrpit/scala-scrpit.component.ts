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
  public filteredStepResponse: BehaviorSubject<string[]> = new BehaviorSubject<string[]>(null);

  constructor(
    public dialogRef: MatDialogRef<ScalaScrpitComponent>,
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
    const params = this.parameters.reduce((acc, item) => {
      return acc
        ? `${acc},${item.name}:${item.value}:${item.customType}`
        : `${item.name}:${item.value}:${item.customType}`;
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
      return value == 'true' ? true:false;
    } else if(!isNaN(value)){
      return +value;
    }
    return value;
  }
}
