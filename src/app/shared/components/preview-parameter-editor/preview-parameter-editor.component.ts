import { Component, Input, OnInit } from '@angular/core';
import {FormGroup} from '@angular/forms';
import {FormlyFieldConfig} from '@ngx-formly/core';

@Component({
  selector: 'app-preview-parameter-editor',
  templateUrl: './preview-parameter-editor.component.html',
  styleUrls: ['./preview-parameter-editor.component.scss']
})
export class PreviewParameterEditorComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  form = new FormGroup({});
  model = {};
  @Input() fields: FormlyFieldConfig[];

  onSubmit() {
    if (this.form.valid) {
      alert(JSON.stringify(this.model, null, 2));
    }
  }

}
