import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {SharedFunctions} from "../../../utils/shared-functions";
import {Connector} from "../../../models/connectors";

export interface ConnectorInfo {
  connector: Connector;
  showEmbeddedVariablesToggle: boolean;
}
@Component({
  templateUrl: './connectors-modal.component.html'
})
export class ConnectorsModalComponent {
  connector: Connector;
  validForm: boolean = false;
  constructor(public dialogRef: MatDialogRef<ConnectorsModalComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ConnectorInfo) {
    this.connector = SharedFunctions.clone(data.connector);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  save(){
    this.dialogRef.close(this.connector);
  }

  setValidation(validation: boolean) {
    this.validForm = validation;
  }
}
