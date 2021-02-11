import {
  AfterViewInit,
  EventEmitter,
  Component,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormlyJsonschema } from '@ngx-formly/core/json-schema';

@Component({
  selector: 'app-preview-parameter-editor',
  templateUrl: './preview-parameter-editor.component.html',
  styleUrls: ['./preview-parameter-editor.component.scss'],
})
export class PreviewParameterEditorComponent implements OnInit, AfterViewInit {
  form = new FormGroup({});
  _model;
  @Input() set model(value) {
    this._model = value;
  }
  get model() {
    return this._model;
  }
  @Input() set fields(formlyJson) {
    if (formlyJson) {
      if (formlyJson.schema) {
        this._fields = [this.formlyJsonschema.toFieldConfig(formlyJson.schema)];
      } else if(Array.isArray(formlyJson)) {
        this._fields = formlyJson;
      }
    }
  }
  _fields: FormlyFieldConfig[];
  @Output() valueChange = new EventEmitter(); //this.form.valueChanges;
  constructor(private formlyJsonschema: FormlyJsonschema) {}
  ngAfterViewInit(): void {
    this.form.valueChanges.subscribe((value) => {
      this.valueChange.emit(value);
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.form.valid) {
      alert(JSON.stringify(this.model, null, 2));
    }
  }
}
