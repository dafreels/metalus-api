import {Param} from '../../steps.model';
import {DisplayDialogService} from '../../../shared/services/display-dialog.service';
import {Component, OnInit} from '@angular/core';
import {Step} from '../../steps.model';
import {StepsService} from '../../steps.service';
import {PackageObjectsService} from '../../../core/package-objects/package-objects.service';
import {PackageObject} from '../../../core/package-objects/package-objects.model';
import {diff} from 'deep-object-diff';
import {CodeEditorComponent} from '../../../code-editor/components/code-editor/code-editor.component';
import {ObjectEditorComponent} from '../../../shared/components/object-editor/object-editor.component';
import {WaitModalComponent} from '../../../shared/components/wait-modal/wait-modal.component';
import {NameDialogComponent} from '../../../shared/components/name-dialog/name-dialog.component';
import {ErrorModalComponent} from '../../../shared/components/error-modal/error-modal.component';
import {MatChipInputEvent} from '@angular/material/chips';
import {FormControl} from '@angular/forms';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import * as Ajv from 'ajv';
import {ConfirmationModalComponent} from '../../../shared/components/confirmation/confirmation-modal.component';
import {DialogDimensions, generalDialogDimensions,} from 'src/app/shared/models/custom-dialog.model';
import {User} from "../../../shared/models/users.models";
import {AuthService} from "../../../shared/services/auth.service";

@Component({
  selector: 'app-steps-editor',
  templateUrl: './steps-editor.component.html',
  styleUrls: ['./steps-editor.component.scss'],
})
export class StepsEditorComponent implements OnInit {
  packageObjects: PackageObject[];
  steps: Step[];
  selectedStep: Step;
  originalStep: Step;
  tagCtrl = new FormControl();
  separatorKeysCodes: number[] = [ENTER, COMMA];
  stepValidator;
  user: User;

  constructor(
    private stepsService: StepsService,
    private packageObjectsService: PackageObjectsService,
    private displayDialogService: DisplayDialogService,
    private authService: AuthService
  ) {
    this.user = this.authService.getUserInfo();
    this.authService.userItemSelection.subscribe(data => this.user = data);
  }

  ngOnInit(): void {
    this.newStep();
    this.stepsService.getSteps().subscribe((steps: Step[]) => {
      this.steps = steps;
    });

    this.packageObjectsService
      .getPackageObjects()
      .subscribe((pkgObjs: PackageObject[]) => {
        this.packageObjects = pkgObjs;
      });

    this.stepsService.getStepSchema().subscribe((schema) => {
      const ajv = new Ajv({ allErrors: true });
      this.stepValidator = ajv
        .addSchema(schema, 'steps')
        .compile(schema.definitions.BaseStep);
    });
  }

  changeParameterType(param: Param) {
    param.language = undefined;
    param.className = undefined;
    param.defaultValue = undefined;
    param.parameterType = undefined;
    param.required = undefined;
  }

  addTag(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our tag
    if ((value || '').trim()) {
      if (!this.selectedStep.tags) {
        this.selectedStep.tags = [];
      }
      this.selectedStep.tags.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.tagCtrl.setValue(null);
  }

  removeTag(tag) {
    const index = this.selectedStep.tags.indexOf(tag);
    if (index > -1) {
      this.selectedStep.tags.splice(index, 1);
    }

    if (this.selectedStep.tags && this.selectedStep.tags.length === 0) {
      delete this.selectedStep.tags;
    }
  }

  stepSelected(step) {
    if (step && this.selectedStep && this.selectedStep.id === step.id) {
      return;
    }
    if (this.stepChanged()) {
      const stepSeletectedDialogData = {
        message:
          'You have unsaved changes to the current step. Would you like to continue?',
      };
      const stepSelectionDialogDimension: DialogDimensions = {
        width: '450px',
        height: '200px',
      };
      const stepSelectedDialog = this.displayDialogService.openDialog(
        ConfirmationModalComponent,
        stepSelectionDialogDimension,
        stepSeletectedDialogData
      );
      stepSelectedDialog.afterClosed().subscribe((confirmation) => {
        if (confirmation) {
          this.setSelectedStep(step);
        }
      });
    } else {
      this.setSelectedStep(step);
    }
  }

  private setSelectedStep(step) {
    if (step) {
      this.originalStep = step;
      this.selectedStep = JSON.parse(JSON.stringify(step));
    } else {
      this.newStep();
    }
  }

  newStep() {
    this.stepSelected({
      category: '',
      description: '',
      displayName: '',
      id: '',
      params: [],
      type: 'pipeline',
      engineMeta: {
        pkg: '',
        spark: '',
        stepResults: [],
      },
      tags: [],
    });
  }

  bulkLoadSteps() {
    const bulkStepDialogData = {
      code: '[]',
      language: 'json',
      allowSave: true,
    };
    const bulkStepDialog = this.displayDialogService.openDialog(
      CodeEditorComponent,
      generalDialogDimensions,
      bulkStepDialogData
    );
    bulkStepDialog.afterClosed().subscribe((result) => {
      if (result && result.code.trim().length > 0) {
        const bulkLoad = JSON.parse(result.code);
        let steps = [];
        if (Array.isArray(bulkLoad)) {
          steps = bulkLoad;
        } else if (typeof bulkLoad === 'object') {
          steps = bulkLoad['steps'];
          const pkgObjs = bulkLoad['pkgObjs'];
          if (pkgObjs && pkgObjs.length > 0) {
            this.packageObjectsService.updatePackageObjects(pkgObjs).subscribe(
              (packageObjects: PackageObject[]) => {
                this.packageObjects = packageObjects;
              },
              (error) => this.handleError(error, null)
            );
          }
        }
        this.stepsService.updateSteps(steps).subscribe(
          (steps: Step[]) => {
            this.steps = steps;
          },
          (error) => this.handleError(error, null)
        );
      }
    });
  }

  cancel() {
    if (this.originalStep) {
      this.selectedStep = JSON.parse(JSON.stringify(this.originalStep));
    } else {
      this.newStep();
    }
  }

  isValid() {
    return !(
      this.selectedStep.type.toLocaleLowerCase() === 'branch' &&
      (!this.selectedStep.params ||
        this.selectedStep.params.length === 0 ||
        !this.selectedStep.params.find((p) => p.type === 'result'))
    );
  }

  // TODO Stop allowing the UI to call this
  stepChanged() {
    // TODO undefined is being replaced with an empty string if the user enters text and then deletes
    return (
      Object.entries(diff(this.originalStep, this.selectedStep)).length !== 0
    );
  }

  saveStep() {
    const saveStepDialogDimensions: DialogDimensions = {
      width: '25%',
      height: '25%',
    };
    const saveStepDialog = this.displayDialogService.openDialog(
      WaitModalComponent,
      saveStepDialogDimensions
    );

    const validStep = this.stepValidator(this.selectedStep);
    const validBranch = this.isValid();
    if (!validStep || !validBranch) {
      const error = {
        message: '',
      };
      if (!validBranch) {
        error.message =
          'A branch step requires at least one result parameter!\n';
      }
      if (this.stepValidator.errors && this.stepValidator.errors.length > 0) {
        this.stepValidator.errors.forEach((err) => {
          error.message = `${error.message}${err.dataPath.substring(1)} ${
            err.message
          }\n`;
        });
      }
      this.handleError(error, saveStepDialog);
    } else {
      let observable;
      if (this.selectedStep.id && this.selectedStep.id.trim() !== '') {
        observable = this.stepsService.updateStep(this.selectedStep);
      } else {
        observable = this.stepsService.addStep(this.selectedStep);
      }

      observable.subscribe(
        (step: Step) => {
          this.originalStep = step;
          this.selectedStep = JSON.parse(JSON.stringify(step));
          const index = this.steps.findIndex(
            (s) => s.id === this.selectedStep.id
          );
          if (index === -1) {
            this.steps.push(step);
          } else {
            this.steps[index] = step;
          }
          // Change the reference to force the selector to refresh
          this.steps = [...this.steps];
          saveStepDialog.close();
        },
        (error) => this.handleError(error, saveStepDialog)
      );
    }
  }

  private handleError(error, dialogRef) {
    let message;
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      message = error.error.message;
    } else {
      message = error.message;
    }
    if (dialogRef) {
      dialogRef.close();
    }
    const errorDialogDimensions: DialogDimensions = {
      width: '450px',
      height: '300px',
    };
    const errorDialog = this.displayDialogService.openDialog(
      ErrorModalComponent,
      errorDialogDimensions,
      { message }
    );
  }

  changeStepType(branch) {
    this.selectedStep.type = branch ? 'branch' : 'pipeline';
  }

  addNewParameter() {
    const newParameterDialogDimensions: DialogDimensions = {
      width: '25%',
      height: '25%',
    };
    const newParameterDialog = this.displayDialogService.openDialog(
      NameDialogComponent,
      newParameterDialogDimensions,
      { name: '' }
    );

    newParameterDialog.afterClosed().subscribe((result) => {
      if (result && result.trim().length > 0) {
        this.selectedStep.params.push({
          type: 'text',
          name: result,
          required: false,
          defaultValue: undefined,
          language: undefined,
          className: undefined,
          parameterType: undefined,
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
      const scriptDialogData = {
        code: inputData.defaultValue,
        language: inputData.language,
        allowSave: true,
      };
      const scriptDialog = this.displayDialogService.openDialog(
        CodeEditorComponent,
        generalDialogDimensions,
        scriptDialogData
      );

      scriptDialog.afterClosed().subscribe((result) => {
        if (result) {
          const param = this.selectedStep.params.find(
            (p) => p.name === inputData.name
          );
          param.defaultValue = result.code;
          param.language = result.language;
        }
      });
    } else if (inputData.type === 'object') {
      const schema = this.packageObjects.find(
        (p) => p.id === inputData.className
      );
      let pkgSchema;
      if (schema) {
        pkgSchema = JSON.parse(schema.schema);
      }

      const objectDialogData = {
        userObject: inputData.defaultValue,
        schema: pkgSchema,
        schemaName: inputData.className,
        pkgObjs: this.packageObjects,
      };
      const objectDialog = this.displayDialogService.openDialog(
        ObjectEditorComponent,
        generalDialogDimensions,
        objectDialogData
      );

      objectDialog.afterClosed().subscribe((result) => {
        if (result) {
          const param = this.selectedStep.params.find(
            (p) => p.name === inputData.name
          );
          param.defaultValue = result.userObject;
          param.className = result.schemaName;
        }
      });
    }
  }

  deleteStep() {
    const deleteStepDialogData = {
      message:
        'Are you sure you wish to delete the current step? This will not remove the step from any existing pipelines. Would you like to continue?',
    };
    const deleteStepDialogDimensions: DialogDimensions = {
      width: '450px',
      height: '200px',
    };
    const deleteStepDialog = this.displayDialogService.openDialog(
      ConfirmationModalComponent,
      deleteStepDialogDimensions,
      deleteStepDialogData
    );

    deleteStepDialog.afterClosed().subscribe((confirmation) => {
      if (confirmation) {
        this.stepsService.deleteStep(this.selectedStep).subscribe(
          (result) => {
            if (result) {
              const index = this.steps.findIndex(
                (s) => s.id === this.selectedStep.id
              );
              if (index > -1) {
                this.steps.splice(index, 1);
                // Change the reference to force the selector to refresh
                this.steps = [...this.steps];
              }
              this.newStep();
            }
          },
          (error) => this.handleError(error, deleteStepDialog)
        );
      }
    });
  }
}
