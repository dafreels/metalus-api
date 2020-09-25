import { Component, Input, OnInit } from '@angular/core';
import { SplitParameter } from 'src/app/pipelines/components/pipeline-parameter/pipeline-parameter.component';

@Component({
  selector: 'app-parameter-editor',
  templateUrl: './parameter-editor.component.html',
  styleUrls: ['./parameter-editor.component.scss'],
})
export class ParameterEditorComponent implements OnInit {
  isComplex: boolean = false;
  @Input() param: SplitParameter;
  constructor() {}

  ngOnInit() {}
  updateValue(){
    
  }
  deleteItem() {
    
  }
}
