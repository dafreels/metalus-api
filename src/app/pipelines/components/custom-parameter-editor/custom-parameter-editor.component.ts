import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Subscription} from 'rxjs';
import {PackageObject} from 'src/app/core/package-objects/package-objects.model';
import {PackageObjectsService} from 'src/app/core/package-objects/package-objects.service';
import {DesignerComponent} from 'src/app/designer/components/designer/designer.component';
import {DesignerElement} from 'src/app/designer/designer-constants';
import {ErrorModalComponent} from 'src/app/shared/components/error-modal/error-modal.component';
import {User} from 'src/app/shared/models/users.models';
import {AuthService} from 'src/app/shared/services/auth.service';
import {SharedFunctions} from 'src/app/shared/utils/shared-functions';
import {Step} from 'src/app/steps/steps.model';
import {StepsService} from 'src/app/steps/steps.service';
import {Pipeline, PipelineData, PipelineStep, PipelineStepParam} from '../../models/pipelines.model';
import {PipelinesService} from '../../services/pipelines.service';
import {StepGroupProperty} from '../pipeline-parameter/pipeline-parameter.component';
import {WaitModalComponent} from 'src/app/shared/components/wait-modal/wait-modal.component';
import {HelpComponent} from "../../../core/components/help/help.component";
import {ExecutionsService} from 'src/app/applications/executions.service';
import {ExecutionTemplate} from 'src/app/applications/applications.model';

// import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
@Component({
  selector: 'app-custom-parameter-editor',
  templateUrl: './custom-parameter-editor.component.html',
  styleUrls: ['./custom-parameter-editor.component.scss']
})
export class CustomParameterEditorComponent implements OnInit, OnDestroy {
  private _stepOrPackageSelection: 'Step' | 'Package' | 'Execution' = 'Package';
  selectedExecution: ExecutionTemplate;

  get stepOrPackageSelection() {
    return this._stepOrPackageSelection;
  }

  set stepOrPackageSelection(value: 'Step' | 'Package' | 'Execution') {
    this.selectedPackage = null;
    this.selectedStep = null;
    this.selectedParam = null;
    this._stepOrPackageSelection = value;
  }

  @ViewChild('designerElement', {static: false}) designerElement: DesignerComponent;
  pipelinesData: PipelineData[] = [];
  packageObjects: PackageObject[];
  pipelines: Pipeline[];
  stepGroups: Pipeline[];
  steps: Step[];
  paramTemplate: any = {};
  sampleTemplate: any = {};
  selectedPipeline: Pipeline;
  private _selectedStep: PipelineStep;
  showPreview: boolean = false;
  _selectedPackage: PackageObject;
  get selectedPackage() {
    return this._selectedPackage;
  }

  set selectedPackage(packageObj) {
    this._selectedPackage = packageObj;
    this.sampleTemplate = {};
  }

  enableSave: boolean = false;

  set selectedStep(step) {
    this._selectedStep = step;
    this.selectedParam = null;
    if (step) {
      this.getStepParamTemplate(step);
    }
  }

  public stepTemplate = {};

  get selectedStep(): PipelineStep {
    return this._selectedStep;
  }

  private _selectedParam: PipelineStepParam = null;
  set selectedParam(param) {
    this._selectedParam = param;
    this.sampleTemplate = {};
    this.showPreview = false;
  }

  get selectedParam() {
    return this._selectedParam;
  }

  selectedElement: DesignerElement;
  isABranchStep: boolean;
  typeAhead: string[] = [];
  pipelineValidator;
  stepGroup: StepGroupProperty = {enabled: false};
  user: User;
  editName: boolean = false;
  editStepId: boolean = false;
  errors = [];
  subscriptions: Subscription[] = [];
  private stepsLoading: boolean = false;

  constructor(
    private stepsService: StepsService,
    private pipelinesService: PipelinesService,
    private executionsService: ExecutionsService,
    private packageObjectsService: PackageObjectsService,
    public dialog: MatDialog,
    private authService: AuthService) {
    this.user = this.authService.getUserInfo();
  }

  ngOnInit(): void {
    this.loadUIData();
  }

  ngOnDestroy(): void {
    this.subscriptions = SharedFunctions.clearSubscriptions(this.subscriptions);
  }

  @Input()
  set step(step: PipelineStep) {
    if (step) {
      let localStep = this.selectedPipeline.steps.find((s) => s.id === step.id);
      if (localStep) {
        this.selectedStep = localStep;
      }
    }
  }

  private loadUIData() {
    this.steps = [];
    this.stepsLoading = true;
    this.stepsService.getSteps(true).subscribe((steps: Step[]) => {
      this.steps = steps;
      this.stepsLoading = false;
    });
  }

  showErrors() {
    const messages = [];
    this.errors.forEach((err) => {
      messages.push(`${err.component} ${err.field}: ${err.message}`);
    });
    this.dialog.open(ErrorModalComponent, {
      width: '450px',
      height: '300px',
      data: {messages},
    });
  }

  private handleError(error, dialogRef) {
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
      height: '300px',
      data: {messages: message.split('\n')},
    });
  }

  selectStep($event) {
    this.selectedStep = $event;
    this.selectedPackage = null;
  }

  selectPackage($event) {
    const pkg = $event;
    if (pkg.template && typeof pkg.template === 'string') {
      pkg.template = JSON.parse(pkg.template);
    }
    this.selectedPackage = pkg;
    this.selectedStep = null;
    this._selectedParam = null;
  }

  selectExecution($event) {
    const execution = $event;
    if (execution.template && execution.template.form && typeof execution.template.form === 'string') {
      execution.template.form = JSON.parse(execution.template.form);
    } else {
      execution.template = {
        form: {}
      };
    }
    this.selectedExecution = execution;
  }

  exportTemplate() {
    let fileName = '';
    let template;
    if (this.isPackage && !this.paramTemplate.form) {
      fileName = `${this.selectedPackage.id.split('.').join('_')}.json`;
      template = {
        form: this.paramTemplate
      };
    } else if(this.isStep) {
      fileName = `${this.selectedStep.displayName}-${this.selectedStep.id}-${this.selectedParam.name}.json`;
      template = this.paramTemplate;
    } else if(this.isExecution) {
      fileName =  `${this.selectedExecution.displayName}-${this.selectedExecution.id}.json`;
      template = {
        form: this.paramTemplate
      };
    }
    SharedFunctions.downloadAsFile(fileName, JSON.stringify(template));
  }

  onFileLoad(event) {
    const f = event.target.files[0];
    const reader = new FileReader();

    reader.onload = ((theFile) => {
      return (e) => {
        try {
          const json = JSON.parse(e.target.result);
          this.paramTemplate = json;
          if (this.isStep) {
            this.stepTemplate[this.selectedParam.name] = json;
          } else if (this.isPackage) {
            this.selectedPackage.template = json;
          }
          this.enableSave = true;
        } catch (err) {
        }
      };
    })(f);
    reader.readAsText(f);
  }


  selectParam($event) {
    this.selectedParam = $event;
  }

  get codeViewData() {
    if (this.isStep && this.stepTemplate && this.selectedParam && this.stepTemplate[this.selectedParam.name]) {
      return JSON.stringify(this.stepTemplate[this.selectedParam.name], null, 4);
    } else if (this.isPackage && this.selectedPackage) {
      return JSON.stringify(this.selectedPackage.template || this.sampleTemplate, null, 4);
    } else if (this.isExecution && this.selectedExecution) {
      return JSON.stringify((this.selectedExecution.template && this.selectedExecution.template.form) || this.sampleTemplate, null, 4);
    } else {
      return JSON.stringify(this.sampleTemplate, null, 4);
    }
  }

  set codeViewData(data) {
    try {
      if (this.selectedStep || this.selectedPackage || this.selectedExecution) {
        this.paramTemplate = JSON.parse(data);
      }
    } catch (err) {
    }
  }

  get templateChanged() {
    if (this.selectedParam) {
      return (this.stepTemplate && this.selectedParam && (JSON.stringify(this.stepTemplate[this.selectedParam.name]) !== JSON.stringify(this.paramTemplate)));
    } else if (this.selectedPackage) {
      return (this.selectedPackage && (JSON.stringify(this.selectedPackage.template) !== JSON.stringify(this.paramTemplate)));
    } else if (this.selectedExecution) {
      return (this.selectedExecution.template && this.selectedExecution.template.form && (JSON.stringify(this.selectedExecution.template.form) !== JSON.stringify(this.paramTemplate)));
    }
  }

  getStepParamTemplate(step) {
    this.stepsService.getParamTemplate(step.id)
      .subscribe(resp => {
        this.stepTemplate = resp;
      })
  }

  saveStepParamTemplate() {
    const dialogRef = this.dialog.open(WaitModalComponent, {
      width: '25%',
      height: '25%',
    });
    if (this.isPackage) {
      this.savePackageTemplate(dialogRef);
      return;
    }
    if (this.isExecution) {
      this.saveExecutionTemplate(dialogRef);
      return;
    }
    this.stepTemplate[this.selectedParam.name] = this.paramTemplate;
    this.stepsService.updateParamTemplate(this.selectedStep.id, this.stepTemplate).subscribe(() => {
        dialogRef.close();
      },
      (error) => this.handleError(error, dialogRef)
    )
  }

  savePackageTemplate(dialogRef) {
    this.packageObjectsService.updatePackageTemplate(this.selectedPackage, this.paramTemplate).subscribe(() => {
        dialogRef.close();
        this.selectedPackage.template = this.paramTemplate;
        this.enableSave = false;
      },
      (error) => this.handleError(error, dialogRef)
    )
  }

  saveExecutionTemplate(dialogRef) {
    this.executionsService.updateExecutionTemplate(this.selectedExecution, this.paramTemplate).subscribe(() => {
        dialogRef.close();
        this.selectedExecution.template = {
          form: this.paramTemplate
        };
        this.enableSave = false;
      },
      (error) => this.handleError(error, dialogRef)
    )
  }

  cancelStepParamTemplateChanges() {
    this.selectedParam = null;
  }

  previewStepParamTemplate() {
    this.showPreview = !this.showPreview;
  }

  addSampleTemplate() {
    this.sampleTemplate = [
      {
        "key": "attributes",
        "type": "repeat",
        "templateOptions": {
          "addText": "Add another attribute",
          "removeText": "-"
        },
        "fieldArray": {
          "fieldGroup": [
            {
              "type": "input",
              "key": "name",
              "templateOptions": {
                "label": "Name"
              }
            },
            {
              "type": "select",
              "key": "dataType",
              "templateOptions": {
                "label": "Data Type",
                "options": [
                  {"id": "string", "name": "String"},
                  {"id": "double", "name": "Double"},
                  {"id": "integer", "name": "Integer"},
                  {"id": "timestamp", "name": "Timestamp"},
                  {"id": "decimal", "name": "Decimal"},
                  {"id": "array", "name": "Array"},
                  {"id": "map", "name": "Map"},
                  {"id": "struct", "name": "Struct"}
                ],
                "valueProp": "id",
                "labelProp": "name"
              }
            }
          ]
        }
      }
    ];
  }

  openHelp() {
    this.dialog.open(HelpComponent, {
      width: '75%',
      height: '75%',
      data: 'https://formly.dev/guide/expression-properties',
    });
  }

  get isStep() {
    return this.stepOrPackageSelection === 'Step';
  }

  get isPackage() {
    return this.stepOrPackageSelection === 'Package';
  }

  get isExecution() {
    return this.stepOrPackageSelection === 'Execution';
  }

  get canAddSampleJSON() {
    if (this.isPackage && this.selectedPackage) {
      return !this.selectedPackage.template;
    }
    if (this.isStep && this.stepTemplate && this.selectedParam) {
      return !this.stepTemplate[this.selectedParam.name];
    }
    return this.canShowCodeView;
  }

  get canShowCodeView() {
    if (this.isPackage) {
      return !!this.selectedPackage;
    } else if (this.isStep) {
      return !!(this.stepTemplate && this.selectedParam);
    } else if (this.isExecution) {
      return !!this.selectedExecution;
    }
  }

  get canPreviewPackageTemplate() {
    return this.selectedPackage.template || (JSON.stringify(this.paramTemplate) != '{}' && this.showPreview);
  }

  get canPreviewExecutionTemplate() {
    return (this.selectedExecution.template && this.selectedExecution.template.form) || (JSON.stringify(this.paramTemplate) != '{}' && this.showPreview);
  }
}
