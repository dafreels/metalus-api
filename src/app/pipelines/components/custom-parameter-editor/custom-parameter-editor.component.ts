import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { PackageObject } from 'src/app/core/package-objects/package-objects.model';
import { PackageObjectsService } from 'src/app/core/package-objects/package-objects.service';
import { DesignerComponent } from 'src/app/designer/components/designer/designer.component';
import { DesignerElement, DesignerModel } from 'src/app/designer/designer-constants';
import { ErrorModalComponent } from 'src/app/shared/components/error-modal/error-modal.component';
import { User } from 'src/app/shared/models/users.models';
import { AuthService } from 'src/app/shared/services/auth.service';
import { DisplayDialogService } from 'src/app/shared/services/display-dialog.service';
import { SharedFunctions } from 'src/app/shared/utils/shared-functions';
import { StaticSteps, Step } from 'src/app/steps/steps.model';
import { StepsService } from 'src/app/steps/steps.service';
import { Pipeline, PipelineData, PipelineStep, PipelineStepParam } from '../../models/pipelines.model';
import { PipelinesService } from '../../services/pipelines.service';
import { StepGroupProperty } from '../pipeline-parameter/pipeline-parameter.component';
import * as _ from 'lodash'
import { WaitModalComponent } from 'src/app/shared/components/wait-modal/wait-modal.component';

@Component({
  selector: 'app-custom-parameter-editor',
  templateUrl: './custom-parameter-editor.component.html',
  styleUrls: ['./custom-parameter-editor.component.scss']
})
export class CustomParameterEditorComponent implements OnInit, OnDestroy{
  @ViewChild('designerElement', {static: false}) designerElement: DesignerComponent;
  pipelinesData: PipelineData[] = [];
  packageObjects: PackageObject[];
  pipelines: Pipeline[];
  stepGroups: Pipeline[];
  stepGroupSteps: Step[];
  steps: Step[];
  paramTemplate: any = {};
  sampleTemplate:any = {};
  selectedPipeline: Pipeline;
  _pipeline: Pipeline;
  private _selectedStep:PipelineStep;
  showPreview:boolean = false;
  set selectedStep(step) {
    this._selectedStep = step;
    this.selectedParam = null;
    this.getStepParamTemplate(step);
  }
  public stepTemplate = {};
  get selectedStep():PipelineStep {
    return this._selectedStep;
  }
  private _selectedParam:PipelineStepParam = null;
  set selectedParam(param){
    this._selectedParam = param;
    this.showPreview = false;
  }
  get selectedParam(){
    return this._selectedParam;
  }
  selectedElement: DesignerElement;
  designerModel: DesignerModel = DesignerComponent.newModel();
  stepCreated: Subject<PipelineStep> = new Subject<PipelineStep>();
  dndSubject: Subject<DesignerElement> = new Subject<DesignerElement>();
  isABranchStep: boolean;
  stepLookup = {};
  typeAhead: string[] = [];
  pipelineValidator;
  stepGroup: StepGroupProperty = { enabled: false };
  user: User;
  editName: boolean = false;
  editStepId: boolean = false;
  errors = [];
  subscriptions: Subscription[] = [];
  private stepsLoading: boolean = false;
  private pipelinesLoading: boolean = false;

  constructor(
    private stepsService: StepsService,
    private pipelinesService: PipelinesService,
    private packageObjectsService: PackageObjectsService,
    public dialog: MatDialog,
    private authService: AuthService,
    private displayDialogService: DisplayDialogService) {
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
    this.stepsService.getSteps().subscribe((steps: Step[]) => {
      steps.push(StaticSteps.FORK_STEP);
      steps.push(StaticSteps.JOIN_STEP);
      steps.push(StaticSteps.STEP_GROUP);
      steps.push(StaticSteps.CUSTOM_BRANCH_STEP);
      this.steps = steps;
      this.stepsLoading = false;
    });
  }
  
  /**
   * This method will handle changes to the id and ensure element name gets the change.
   */
  handleIdChange() {
    if (this.selectedElement) {
      const id = this.selectedStep.id.replace(' ', '_');
      this.stepLookup[id] = this.stepLookup[this.selectedElement.name];
      delete this.stepLookup[this.selectedElement.name];
      this.selectedElement.name = id;
    }
  }

  showErrors() {
    const messages = [];
    this.errors.forEach((err) => {
      messages.push(`${err.component} ${err.field}: ${err.message}`);
    });
    this.dialog.open(ErrorModalComponent, {
      width: '450px',
      height: '300px',
      data: { messages },
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
      data: { messages: message.split('\n') },
    });
  }
  
  private updateStep(step: PipelineStep) {
    const stepMeta = this.steps.find(s => s.id === step.stepId);
    if (stepMeta) {
      const originalParameters = step.params;
      const pipelineStepId = step.id;
      const mergedStep = Object.assign({}, step, stepMeta);
      let metaParam;
      mergedStep.params = originalParameters.map((param) => {
        metaParam = stepMeta.params.find(p => p.name === param.name);
        if (metaParam) {
          return Object.assign({}, metaParam, param);
        } else {
          return param;
        }
      });
      mergedStep.id = pipelineStepId;
      mergedStep.stepId = stepMeta.id;
      return mergedStep;
    }
    return step;
  }
  selectStep($event) {
    this.selectedStep = $event;
  }
  selectParam($event){
    this.selectedParam = $event;
  }
  get codeViewData() {
    if(this.stepTemplate && this.stepTemplate[this.selectedParam.name]){
      return JSON.stringify(this.stepTemplate[this.selectedParam.name], null, 4);
    } else {
      return JSON.stringify(this.sampleTemplate, null, 4);
    }
  }
  set codeViewData(data) {
    try {
      this.paramTemplate = JSON.parse(data);
    } catch(err) {
    }
  }
  get templateChanged() {
    if(this.selectedParam) {
      return (this.stepTemplate && this.selectedParam && !(JSON.stringify(this.stepTemplate[this.selectedParam.name]) === JSON.stringify(this.paramTemplate)));
    }
  }
  
  getStepParamTemplate(step){
    this.stepsService.getParamTemplate(step.id)
    .subscribe(resp=>{
      this.stepTemplate = resp;
    })    
  }
  saveStepParamTemplate() {
    const dialogRef = this.dialog.open(WaitModalComponent, {
      width: '25%',
      height: '25%',
    });
    this.stepTemplate[this.selectedParam.name] = this.paramTemplate;
    this.stepsService.updateParamTemplate(this.selectedStep.id, this.stepTemplate).subscribe(resp=>{
      dialogRef.close();
    },
    (error) => this.handleError(error, dialogRef)
    )    
  }
  saveStep(){
    let stepParams = this.selectedStep.params.map(param=>{
      if(param.name===this.selectedParam.name) {
        param.template = this.paramTemplate;
      }
      return param;
    });
    this.selectedStep.params = stepParams;
    
    this.stepsService.updateStep(this.selectedStep).subscribe(resp=>{
    });
  }
  cancelStepParamTemplateChanges() {
    this.selectedParam = null;
  }
  previewStepParamTemplate(){
    this.showPreview = !this.showPreview;
  }
  
  addSampleTemplate() {
    const formlySampleSchema = [
      {
          "key": "input",
          "type": "input",
          "templateOptions": {
              "label": "Name",
              "placeholder": "Input placeholder",
              "required": true,
              "focus": false,
              "disabled": false
          },
          "id": "formly_5_input_input_0",
          "hooks": {},
          "modelOptions": {},
          "wrappers": [
              "form-field"
          ],
          "_keyPath": {
              "key": "input",
              "path": [
                  "input"
              ]
          }
      },
      {
          "key": "textarea",
          "type": "textarea",
          "templateOptions": {
              "label": "Textarea",
              "placeholder": "Textarea placeholder",
              "required": true,
              "focus": false,
              "disabled": false,
              "cols": 1,
              "rows": 1
          },
          "id": "formly_5_textarea_textarea_1",
          "hooks": {},
          "modelOptions": {},
          "wrappers": [
              "form-field"
          ],
          "_keyPath": {
              "key": "textarea",
              "path": [
                  "textarea"
              ]
          }
      },
      {
          "key": "checkbox",
          "type": "checkbox",
          "templateOptions": {
              "label": "Checkbox",
              "placeholder": "",
              "focus": false,
              "disabled": false,
              "hideFieldUnderline": true,
              "indeterminate": true,
              "floatLabel": "always",
              "hideLabel": true,
              "align": "start",
              "color": "accent"
          },
          "id": "formly_5_checkbox_checkbox_2",
          "hooks": {},
          "modelOptions": {},
          "wrappers": [
              "form-field"
          ],
          "_keyPath": {
              "key": "checkbox",
              "path": [
                  "checkbox"
              ]
          }
      },
      {
          "key": "select",
          "type": "select",
          "templateOptions": {
              "label": "Select",
              "placeholder": "Select placeholder",
              "required": true,
              "options": [
                  {
                      "label": "Option 1",
                      "value": "1"
                  },
                  {
                      "label": "Option 2",
                      "value": "2"
                  },
                  {
                      "label": "Option 3",
                      "value": "3"
                  }
              ],
              "focus": false,
              "disabled": false,
              "_flatOptions": true
          },
          "id": "formly_5_select_select_3",
          "hooks": {},
          "modelOptions": {},
          "wrappers": [
              "form-field"
          ],
          "_keyPath": {
              "key": "select",
              "path": [
                  "select"
              ]
          }
      },
      {
          "key": "radio",
          "type": "radio",
          "templateOptions": {
              "label": "Radio",
              "required": true,
              "options": [
                  {
                      "label": "Option 1",
                      "value": "1"
                  },
                  {
                      "label": "Option 2",
                      "value": "2"
                  }
              ],
              "placeholder": "",
              "focus": false,
              "disabled": false,
              "hideFieldUnderline": true,
              "floatLabel": "always",
              "tabindex": -1,
              "_flatOptions": true
          },
          "id": "formly_5_radio_radio_4",
          "hooks": {},
          "modelOptions": {},
          "wrappers": [
              "form-field"
          ],
          "_keyPath": {
              "key": "radio",
              "path": [
                  "radio"
              ]
          }
      }
    ];
    this.sampleTemplate = formlySampleSchema;
  }
}
