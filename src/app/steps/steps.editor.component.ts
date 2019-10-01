import {Component, OnInit} from "@angular/core";
import {IStep} from "./steps.model";
import {StepsService} from "./steps.service";
import {PackageObjectsService} from "../packageObjects/package-objects.service";
import {IPackageObject} from "../packageObjects/package-objects.model";
import {diff} from "deep-object-diff";
import {CodeEditorComponent} from "../code-editor/code.editor.component";
import {ObjectEditorComponent} from "../object-editor/object.editor.component";
import {MatDialog} from "@angular/material/dialog";
import {WaitModalComponent} from "../wait-modal/wait.modal.component";
import {NameDialogComponent} from "../name-dialog/name.dialog.component";
import {ErrorModalComponent} from "../error-modal/error.modal.component";

@Component({
  selector: 'steps-editor',
  templateUrl: './steps.editor.component.html',
  styleUrls: ['./steps.editor.component.css']
})
export class StepsEditorComponent implements OnInit {
  packageObjects: IPackageObject[];
  steps: IStep[];
  selectedStep: IStep;
  originalStep: IStep;
  constructor(private stepsService: StepsService,
              private packageObjectsService: PackageObjectsService,
              public dialog: MatDialog) {}

  ngOnInit(): void {
    this.newStep();
    this.stepsService.getSteps().subscribe((steps: IStep[]) => {
      this.steps = steps;
    });

    this.packageObjectsService.getPackageObjects().subscribe((pkgObjs: IPackageObject[]) => {
      this.packageObjects = pkgObjs;
    });
  }

  stepSelected(step) {
    // TODO: Handle selecting a step when there are changes
    if (step) {
      this.originalStep = step;
      this.selectedStep = JSON.parse(JSON.stringify(step));
    } else {
      this.newStep();
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
    if (this.originalStep) {
      this.selectedStep = JSON.parse(JSON.stringify(this.originalStep));
    } else {
      this.newStep();
    }
  }

  stepChanged() {
    // TODO undefined is being replaced with an empty string if the user enters text and then deletes
    return Object.entries(diff(this.originalStep, this.selectedStep)).length !== 0;
  }

  saveStep() {
    /* TODO:
     * Validate (use form validation and custom validator)
     * Once the steps are updated with the new step, how does the selector get updated?
     */
    const dialogRef = this.dialog.open(WaitModalComponent, {
      width: '25%',
      height: '25%'
    });
    let observable;
    if (this.selectedStep.id && this.selectedStep.id.trim() !== '') {
      observable = this.stepsService.updateStep(this.selectedStep);
    } else {
      observable = this.stepsService.addStep(this.selectedStep);
    }

    observable.subscribe((step: IStep) => {
      this.originalStep = step;
      this.selectedStep = JSON.parse(JSON.stringify(step));
      const index = this.steps.findIndex(s => s.id === this.selectedStep.id);
      if (index === -1) {
        this.steps.push(step);
      } else {
        this.steps[index] = step;
      }
      // Change the reference to force the selector to refresh
      this.steps = [...this.steps];
      dialogRef.close();
    }, (error) => {
      let message;
      if (error.error instanceof ErrorEvent) {
        // A client-side or network error occurred. Handle it accordingly.
        message = error.error.message;
      } else {
        message = error.message;
      }
      dialogRef.close();
      this.dialog.open(ErrorModalComponent, {
        width: '450px',
        height: '250px',
        data: { message }
      });
    });
  }

  isValid() {
    return !(this.selectedStep.type === 'branch' &&
      (!this.selectedStep.params ||
        this.selectedStep.params.length === 0 ||
        !this.selectedStep.params.find(p => p.type === 'result')));

  }

  changeStepType(branch) {
    this.selectedStep.type = branch ? 'branch' : 'pipeline';
  }

  addNewParameter() {
    const dialogRef = this.dialog.open(NameDialogComponent, {
      width: '25%',
      height: '25%',
      data: {name: ''}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.trim().length > 0) {
        this.selectedStep.params.push({
          type: 'text',
          name: result,
          required: false,
          defaultValue: undefined,
          language: undefined,
          className: undefined,
          parameterType: undefined
        });
      }
    });
  }

  deleteParameter(param) {
    const params = [];
    this.selectedStep.params.forEach((p) => {
      if (p.name !== param.name) {
        params.push(p);
      }
    });
    this.selectedStep.params = params;
  }

  // TODO optimize this code
  openEditor(inputData) {
    if (inputData.type === 'script') {
      const dialogRef = this.dialog.open(CodeEditorComponent, {
        width: '75%',
        height: '90%',
        data: {code: inputData.defaultValue, language: inputData.language, allowSave: true}
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result) {
          const param = this.selectedStep.params.find(p => p.name === inputData.name);
          param.defaultValue = result.code;
          param.language = result.language;
        }
      });
    } else if (inputData.type === 'object') {
      const schema = this.packageObjects.find(p => p.id === inputData.className);
      let pkgSchema;
      if (schema) {
        pkgSchema = JSON.parse(schema.schema);
      }
      const dialogRef = this.dialog.open(ObjectEditorComponent, {
        width: '75%',
        height: '90%',
        data: {userObject: inputData.defaultValue, schema: pkgSchema, schemaName: inputData.className, pkgObjs: this.packageObjects }
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
