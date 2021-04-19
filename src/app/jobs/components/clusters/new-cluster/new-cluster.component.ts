import {AfterViewInit, Component, Inject, Input, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Provider, ProviderType} from "../../../models/providers.model";
import {FormlyFieldConfig} from "@ngx-formly/core";
import {FormlyJsonschema} from "@ngx-formly/core/json-schema";
import {FormGroup} from "@angular/forms";
import {ProvidersService} from "../../../services/providers.service";
import {SharedFunctions} from "../../../../shared/utils/shared-functions";

export interface NewEngineData {
  providerTypes: ProviderType[];
  provider: Provider;
}
// TODO A lot of this is boilerplate with the NewProviderComponent. Abstract code later.
@Component({
  templateUrl: './new-cluster.component.html'
})
export class NewClusterComponent implements OnInit {
  showSpinner: boolean = true;
  _model;
  @Input() set model(value) {
    this._model = value;
  }
  get model() {
    return this._model;
  }
  _fields: FormlyFieldConfig[];

  formValue: object;
  providerId: string;

  constructor(public dialogRef: MatDialogRef<NewClusterComponent>,
              @Inject(MAT_DIALOG_DATA) public data: NewEngineData,
              private formlyJsonschema: FormlyJsonschema,
              private providersService: ProvidersService) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  saveDialog() {
    this.dialogRef.close(this.formValue);
  }

 
  templateValueChanged(value) {
    this.formValue = value; 
  }

  ngOnInit(): void {
    this.showSpinner = true;
    this.providersService.getNewClusterForm(this.data.provider.id).subscribe(formlyJson => {
      if (formlyJson) {
        if (formlyJson.schema) {
          this._fields = [this.formlyJsonschema.toFieldConfig(formlyJson.schema)];
        } else if(Array.isArray(formlyJson)) {
          this._fields = SharedFunctions.convertFormlyForm(formlyJson);
        } else {
          this._fields = SharedFunctions.convertFormlyForm([formlyJson]);
        }
        this.showSpinner = false;
      }
    });
  }
}
