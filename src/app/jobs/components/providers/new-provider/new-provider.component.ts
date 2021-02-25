import {AfterViewInit, Component, Inject, Input} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ProviderType} from "../../../models/providers.model";
import {FormlyFieldConfig} from "@ngx-formly/core";
import {FormlyJsonschema} from "@ngx-formly/core/json-schema";
import {FormGroup} from "@angular/forms";
import {ProvidersService} from "../../../services/providers.service";

@Component({
  templateUrl: './new-provider.component.html'
})
export class NewProviderComponent implements AfterViewInit {
  form = new FormGroup({});
  _model;
  @Input() set model(value) {
    this._model = value;
  }
  get model() {
    return this._model;
  }
  _fields: FormlyFieldConfig[];

  formValue: object;
  providerTypeId: string;

  constructor(public dialogRef: MatDialogRef<NewProviderComponent>,
              @Inject(MAT_DIALOG_DATA) public providers: ProviderType[],
              private formlyJsonschema: FormlyJsonschema,
              private providersService: ProvidersService) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  saveDialog() {
    const response = this.formValue;
    response['providerTypeId'] = this.providerTypeId;
    this.dialogRef.close(response);
  }

  ngAfterViewInit(): void {
    this.form.valueChanges.subscribe(value => this.formValue = value);
  }

  setFields($event) {
    this.providerTypeId = $event.value;
    const provider = this.providers.find(p => p.id === this.providerTypeId);
    this.providersService.getNewProviderForm(provider.id).subscribe(formlyJson => {
      if (formlyJson) {
        if (formlyJson.schema) {
          this._fields = [this.formlyJsonschema.toFieldConfig(formlyJson.schema)];
        } else if(Array.isArray(formlyJson)) {
          this._fields = formlyJson;
        } else {
          this._fields = [formlyJson];
        }
      }
    });
  }
}
