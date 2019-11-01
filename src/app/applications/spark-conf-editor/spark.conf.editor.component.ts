import {Component, Input} from "@angular/core";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {FormControl} from "@angular/forms";
import {MatChipInputEvent} from "@angular/material/chips";
import {IApplication} from "../applications.model";

@Component({
  selector: 'spark-conf-editor',
  templateUrl: './spark.conf.editor.component.html'
})
export class SparkConfEditorComponent {
  @Input() selectedApplication: IApplication;

  // Chip fields
  separatorKeysCodes: number[] = [ENTER, COMMA];
  kryoClassesCtrl = new FormControl();

  removeKryoClass(clazz: string) {
    const index = this.selectedApplication.requiredParameters.indexOf(clazz);
    if (index > -1) {
      this.selectedApplication.requiredParameters.splice(index, 1);
    }

    if (this.selectedApplication.requiredParameters && this.selectedApplication.requiredParameters.length === 0) {
      delete this.selectedApplication.requiredParameters;
    }
  }

  addKryoClass(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    // Add our package
    if ((value || '').trim()) {
      if (!this.selectedApplication.requiredParameters) {
        this.selectedApplication.requiredParameters = [];
      }
      this.selectedApplication.requiredParameters.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.kryoClassesCtrl.setValue(null);
  }
}
