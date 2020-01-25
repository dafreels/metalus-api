import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PackageObject } from '../../../core/package-objects/package-objects.model';

export interface ObjectEditorDialogData {
  userObject: object;
  schema: object;
  schemaName: string;
  pkgObjs: PackageObject[];
}

@Component({
  selector: 'app-object-editor',
  templateUrl: './object-editor.component.html',
  styleUrls: ['./object-editor.component.css']
})
export class ObjectEditorComponent {
  formData;
  formDefinition = [
    '*',
    {
      type: 'submit',
      title: 'Save'
    },
    {
      type: 'button',
      title: 'Cancel',
      onClick: () => { this.cancelDialog() }
    }
  ];

  constructor(
    public dialogRef: MatDialogRef<ObjectEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ObjectEditorDialogData) {
    this.formData = {
      schema: data.schema,
      form: this.formDefinition,
      data: data.userObject
    };
  }

  handleSchemaSelection(schemaName) {
    this.data.schema = JSON.parse(this.data.pkgObjs.find(p => p.id === schemaName).schema);
    this.formData = {
      schema: this.data.schema,
      form: this.formDefinition,
      data: this.data.userObject
    };
  }

  onSubmit(event): void {
    this.data.userObject = event;
    this.dialogRef.close({
      userObject: event,
      schemaName: this.data.schemaName
    });
  }

  cancelDialog(): void {
    this.dialogRef.close();
  }
}
