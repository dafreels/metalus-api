import { Component, Inject } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { IApplication, INameValuePair } from '../../applications.model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfParameter extends INameValuePair {
  id: number;
}

@Component({
  selector: 'app-spark-conf-editor',
  templateUrl: './spark-conf-editor.component.html'
})
export class SparkConfEditorComponent {

  // Chip fields
  separatorKeysCodes: number[] = [ENTER, COMMA];
  kryoClassesCtrl = new FormControl();

  // Properties
  id: number = 0;
  properties: ConfParameter[];

  constructor(public dialogRef: MatDialogRef<SparkConfEditorComponent>,
              @Inject(MAT_DIALOG_DATA) public data: IApplication) {
    if (data.sparkConf.setOptions) {
      this.properties = data.sparkConf.setOptions.map(opt => {
        return {
          id: this.id++,
          name: opt.name,
          value: opt.value
        };
      })
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  removeKryoClass(clazz: string) {
    const index = this.data.requiredParameters.indexOf(clazz);
    if (index > -1) {
      this.data.requiredParameters.splice(index, 1);
    }

    if (this.data.requiredParameters && this.data.requiredParameters.length === 0) {
      delete this.data.requiredParameters;
    }
  }

  addKryoClass(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    // Add our package
    if ((value || '').trim()) {
      if (!this.data.requiredParameters) {
        this.data.requiredParameters = [];
      }
      this.data.requiredParameters.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.kryoClassesCtrl.setValue(null);
  }

  generateOptions() {
    const options = [];
    this.properties.forEach(prop => {
      if (prop.name.trim().length > 0) {
        options.push({
          name: prop.name,
          value: prop.value
        });
      }
    });
    this.data.sparkConf.setOptions = options;
  }

  addOption() {
    this.properties.push({
      id: this.id++,
      name: '',
      value: ''
    });
  }

  removeOption(id: number) {
    const index = this.properties.findIndex(p => p.id === id);
    if (index > -1) {
      this.properties.splice(index, 1);
      this.generateOptions();
    }
  }
}
