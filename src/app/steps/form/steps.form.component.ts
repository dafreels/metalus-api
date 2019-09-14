import {Component, Input} from '@angular/core';
import {IStep} from "../steps.model";
import {CodeEditorComponent} from "../../code-editor/code.editor.component";
import {MatDialog} from "@angular/material/dialog";
import {ObjectEditorComponent} from "../../object-editor/object.editor.component";
import {IPackageObject} from "../../packageObjects/package-objects.model";

@Component({
  selector: 'steps-form',
  templateUrl: './steps.form.component.html',
  styleUrls: ['./steps.form.component.css']
})
export class StepsFormComponent {

  selectedStep: IStep;
  originalStep: IStep;
  pkgObjs: IPackageObject[] = [];

  constructor(public dialog: MatDialog) {}

  @Input()
  set step(step: IStep) {
    if (step) {
      this.selectedStep = JSON.parse(JSON.stringify(step));
      this.originalStep = step;
    } else {
      this.selectedStep = {
        category: '', description: '', displayName: '', id: '', params: [], type: '', engineMeta: {
          pkg: '',
          spark: '',
          stepResults: []
        }
      };
    }
  }

  @Input()
  set packageObjects(pkgObjs: IPackageObject[]) {
    if (pkgObjs) {
      this.pkgObjs = pkgObjs;
    } else {
      this.pkgObjs = [];
    }
  }

  newStep() {
    this.selectedStep = {
      category: '', description: '', displayName: '', id: '', params: [], type: '', engineMeta: {
        pkg: '',
        spark: '',
        stepResults: []
      }
    };
  }

  cancel() {
    this.selectedStep = JSON.parse(JSON.stringify(this.originalStep));
  }

  stepChanged() {
    return true;
  }

  saveStep() {
    console.log(JSON.stringify(this.selectedStep, null, 4))
  }

  changeStepType(branch) {
    this.selectedStep.type = branch ? 'branch' : 'pipeline';
  }

  // TODO optimize this code
  openEditor(inputData) {
    if (inputData.type === 'script') {
      const dialogRef = this.dialog.open(CodeEditorComponent, {
        width: '75%',
        height: '90%',
        data: {code: inputData.defaultValue, language: inputData.language}
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result) {
          const param = this.selectedStep.params.find(p => p.name === inputData.name);
          param.defaultValue = result.code;
          param.language = result.language;
        }
      });
    } else if (inputData.type === 'object') {
      const schema = this.pkgObjs.find(p => p.id === inputData.className);
      let pkgSchema;
      if (schema) {
        pkgSchema = JSON.parse(schema.schema);
      }
      const dialogRef = this.dialog.open(ObjectEditorComponent, {
        width: '75%',
        height: '90%',
        data: {userObject: inputData.defaultValue, schema: pkgSchema, schemaName: inputData.className, pkgObjs: this.pkgObjs }
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result) {
          const param = this.selectedStep.params.find(p => p.name === inputData.name);
          param.defaultValue = result.userObject;
          param.className = result.schemaName;
        }
      });
    }
  }
}
