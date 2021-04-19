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
import { CodeEditorComponent } from 'src/app/code-editor/components/code-editor/code-editor.component';
import { generalDialogDimensions } from '../../models/custom-dialog.model';
import { DisplayDialogService } from '../../services/display-dialog.service';
import { SharedFunctions } from '../../utils/shared-functions';
import * as _ from "lodash";

const removeObjectsWithNull = (obj) => {
  return _(obj)
    .pickBy(_.isObject)
    .mapValues(removeObjectsWithNull)
    .assign(_.omitBy(obj, _.isObject))
    .omitBy(_.isEmpty)
    .value();
};
@Component({
  selector: 'app-preview-parameter-editor',
  templateUrl: './preview-parameter-editor.component.html',
  styleUrls: ['./preview-parameter-editor.component.scss'],
})
export class PreviewParameterEditorComponent implements OnInit, AfterViewInit {
  @Input() form = new FormGroup({});
  @Input() previewMode: boolean;
  _model;
  @Input() set model(value) {
    if (typeof value === 'object') {
      this._model = value;
    }
  }
  get model() {
    return this._model;
  }
  @Input() set fields(formlyJson) {
    if (typeof formlyJson == 'string') {
      formlyJson = JSON.parse(formlyJson);
    }
    if (formlyJson) {
      if (formlyJson.schema) {
        this._fields = [this.formlyJsonschema.toFieldConfig(formlyJson.schema)];
      } else if (Array.isArray(formlyJson)) {
        this._fields = SharedFunctions.clone(formlyJson);
      } else if (formlyJson.form) {
        this._fields = formlyJson.form;
      }
    }
  }
  _fields: FormlyFieldConfig[];
  @Output() valueChange = new EventEmitter();
  constructor(
    private formlyJsonschema: FormlyJsonschema,
    private displayDialogService: DisplayDialogService
  ) {}

  ngAfterViewInit(): void {
    this.form.valueChanges.subscribe((value) => {
        this.valueChange.emit(removeObjectsWithNull(value));
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.form.valid) {
      alert(JSON.stringify(this.model, null, 2));
    }
  }
  previewData() {
    const exportApplicationDialogData = {
      code: JSON.stringify(removeObjectsWithNull(this.form.getRawValue()), null, 4),
      language: 'json',
      allowSave: false,
    };
    this.displayDialogService.openDialog(
      CodeEditorComponent,
      generalDialogDimensions,
      exportApplicationDialogData
    );
  }
}
