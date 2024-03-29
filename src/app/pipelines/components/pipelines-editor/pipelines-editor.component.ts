import {StepGroupProperty} from '../pipeline-parameter/pipeline-parameter.component';
import {PipelinesService} from '../../services/pipelines.service';
import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {PackageObjectsService} from '../../../core/package-objects/package-objects.service';
import {PackageObject} from '../../../core/package-objects/package-objects.model';
import {Pipeline, PipelineData, PipelineStep, PipelineStepParam,} from '../../models/pipelines.model';
import {DndDropEvent} from 'ngx-drag-drop';
import {Subject, Subscription} from 'rxjs';
import {NameDialogComponent} from '../../../shared/components/name-dialog/name-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {StepsService} from '../../../steps/steps.service';
import {StaticSteps, Step} from '../../../steps/steps.model';
import {CodeEditorComponent} from '../../../code-editor/components/code-editor/code-editor.component';
import {WaitModalComponent} from '../../../shared/components/wait-modal/wait-modal.component';
import {diff} from 'deep-object-diff';
import {ErrorModalComponent} from '../../../shared/components/error-modal/error-modal.component';
import * as Ajv from 'ajv';
import {ConfirmationModalComponent} from '../../../shared/components/confirmation/confirmation-modal.component';
import {SharedFunctions} from '../../../shared/utils/shared-functions';
import {DesignerPreviewComponent} from '../../../designer/components/designer-preview/designer-preview.component';
import {AuthService} from "../../../shared/services/auth.service";
import {User} from "../../../shared/models/users.models";
import {CustomBranchDialogComponent} from "../custom-branch-step/custom-branch-dialog.component";
import {DesignerComponent} from "../../../designer/components/designer/designer.component";
import {
  DesignerConstants,
  DesignerElement,
  DesignerElementAction,
  DesignerElementAddOutput,
  DesignerElementOutput,
  DesignerModel
} from "../../../designer/designer-constants";
import {StepGroupResultModalComponent} from "../step-group-result-modal/step-group-result-modal.component";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {ErrorHandlingComponent} from "../../../shared/utils/error-handling-component";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-pipelines-editor',
  templateUrl: './pipelines-editor.component.html',
  styleUrls: ['./pipelines-editor.component.scss'],
})
export class PipelinesEditorComponent extends ErrorHandlingComponent implements OnInit, OnDestroy {
  @ViewChild('designerElement', {static: false}) designerElement: DesignerComponent;
  pipelinesData: PipelineData[] = [];
  packageObjects: PackageObject[];
  pipelines: Pipeline[];
  stepGroups: Pipeline[];
  stepGroupSteps: Step[];
  steps: Step[];
  selectedPipeline: Pipeline;
  _pipeline: Pipeline;
  selectedStep: PipelineStep;
  selectedStepTemplate: Step;
  stepTemplate = {};
  selectedElement: DesignerElement;
  designerModel: DesignerModel = DesignerComponent.newModel();
  stepCreated: Subject<PipelineStep> = new Subject<PipelineStep>();
  dndSubject: Subject<DesignerElement> = new Subject<DesignerElement>();
  zoomSubject: Subject<number> = new Subject<number>();
  zoomRatio = 1;
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
  addSplitOutput: Subject<DesignerElementAddOutput> = new Subject<DesignerElementAddOutput>();
  useGroups: boolean;

  constructor(
    private stepsService: StepsService,
    private pipelinesService: PipelinesService,
    private packageObjectsService: PackageObjectsService,
    public dialog: MatDialog,
    private authService: AuthService,
    private displayDialogService: DisplayDialogService,
    private route: ActivatedRoute) {
    super(dialog);
    this.user = this.authService.getUserInfo();
    this.subscriptions.push(
      this.authService.userItemSelection.subscribe(data => {
      const newPipeline = this.generatePipeline();
      // Cannot diff the pipeline since step orders could have changed
    if (data.defaultProjectId != this.user.defaultProjectId) {
      if (this.hasPipelineChanged(newPipeline)) {
        const dialogRef = this.dialog.open(ConfirmationModalComponent, {
          width: '450px',
          height: '200px',
          data: {
            message:
              'You have unsaved changes to the current pipeline. Would you like to continue?',
          },
        });

        dialogRef.afterClosed().subscribe((confirmation) => {
          if (confirmation) {
            this.user = data;
            this.loadUIData();
          } else {
            this.authService.setUserInfo({ ...this.user });
          }
        });
      } else {
        this.user = data;
        this.loadUIData();
      }
    }
    }));
    route.queryParams
      .subscribe(params => {
          this.useGroups = params.useGroups && params.useGroups.toLowerCase() === 'true';
        }
      );
  }

  ngOnInit(): void {
    this.loadUIData();
  }

  ngOnDestroy(): void {
    this.subscriptions = SharedFunctions.clearSubscriptions(this.subscriptions);
  }

  private loadUIData() {
    this.newPipeline();
    this.newStep();
    this.pipelinesLoading = true;
    this.stepsLoading = true;
    this.steps = [];
    this.pipelines = [];
    this.stepGroupSteps = [];
    this.stepsService.getSteps(true).subscribe((steps: Step[]) => {
      this.steps = steps;
      this.stepsLoading = false;
      this.createStepGroupSteps();
      this.verifyLoadMetadata();
    });

    this.pipelinesService.getPipelines().subscribe((pipelines: Pipeline[]) => {
      let stepGroups;
      if (pipelines && pipelines.length > 0) {
        this.pipelines = pipelines;
        stepGroups = pipelines.filter((p) => p.category === 'step-group');
      } else {
        this.pipelines = [];
        stepGroups = [];
      }
      this.stepGroups = stepGroups;

      let stepGroup;
      this.stepGroups.forEach(sg => {
        stepGroup = JSON.parse(JSON.stringify(StaticSteps.STEP_GROUP));
        stepGroup.stepId = stepGroup.id;
        stepGroup.category = 'StepGroups';
        stepGroup.params[0].value = sg.id;
        stepGroup.displayName = sg.name;
        this.stepGroupSteps.push(stepGroup);
      });

      this.createStepGroupSteps();

      pipelines.forEach((element: PipelineData) => {
        const pipeline: PipelineData = {
          id: element.id,
          name: element.name,
        };
        this.pipelinesData.push(pipeline);
      });
      this.pipelinesLoading = false;
      this.verifyLoadMetadata();
    });

    this.packageObjectsService
      .getPackageObjects()
      .subscribe((pkgObjs: PackageObject[]) => {
        this.packageObjects = pkgObjs;
      });

    this.pipelinesService.getPipelineSchema().subscribe((schema) => {
      const ajv = new Ajv({allErrors: true});
      this.stepsService.getStepSchema().subscribe((stepSchema) => {
        this.pipelineValidator = ajv
          .addSchema(stepSchema, 'stepSchema')
          .addSchema(schema)
          .compile(schema.definitions.BasePipeline);
      });
    });
  }

  changeZoom(increase: boolean) {
    this.zoomRatio += (increase ? 0.25 : -0.25);
    this.zoomSubject.next(this.zoomRatio);
  }

  resetZoom() {
    this.zoomRatio = 1;
    this.zoomSubject.next(this.zoomRatio);
  }

  private createStepGroupSteps() {
    if (this.stepGroupSteps &&
      this.stepGroupSteps.length > 0 &&
      !this.steps.find(s => s.id === this.stepGroups[0].id)) {
      this.steps = this.steps.concat(this.stepGroupSteps);
    }
  }

  private verifyLoadMetadata() {
    if (!this.stepsLoading && !this.pipelinesLoading && this.steps.length < 5 ) {
      this.dialog.open(ErrorModalComponent, {
        width: '450px',
        height: '300px',
        data: { messages: ['This project has no step metadata loaded.', 'Please visit the Upload Metadata screen to continue.'] },
      });
    }
  }

  modelChange(event) {
    if (this.selectedPipeline.steps.length === 0) {
      this.selectedPipeline = this.generatePipeline();
    } else if (Object.keys(event.nodes).length !== this.selectedPipeline.steps.length) {
      this.subscriptions.push(this.stepCreated.subscribe((response: PipelineStep) => {
        const duplicated = this.selectedPipeline.steps.find(
          (step) => step.id === response.id
        );
        if (!duplicated) {
          this.selectedPipeline.steps.push(response);
        }
      }));
    }
    // Build out the step lookup from the new model
    let node;
    Object.keys(this.designerModel.nodes).forEach(key => {
      node = this.designerModel.nodes[key];
      this.stepLookup[node.data.name] = key;
    });
    this.validateChanges();
  }

  @Input()
  set step(step: PipelineStep) {
    if (step) {
      let localStep = this.selectedPipeline.steps.find((s) => s.id === step.id);
      if (localStep) {
        this.selectedStep = localStep;
        this.getStepParamTemplate(this.selectedStep);
      } else {
        this.newStep();
      }
    } else {
      this.newStep();
    }
    this.validateChanges();
  }

  newPipeline() {
    this._pipeline = {
      name: '',
      project: null,
      steps: [],
      id: '',
      category: 'pipeline',
    };
    this.selectedPipeline = JSON.parse(JSON.stringify(this._pipeline));
    this.resetZoom();
    this.newStep();
    this.enableNameEdit();
    this.loadPipelineToDesigner();
  }

  newStep() {
    this.selectedStep = {
      stepId: '',
      executeIfEmpty: '',
      retryLimit: 0,
      nextStepId: '',
      category: '',
      description: '',
      displayName: '',
      id: '',
      params: [],
      type: '',
      engineMeta: {
        pkg: '',
        spark: '',
        stepResults: [],
      },
    };
  }

  stepSelected(data: DesignerElement) {
    this.selectedStep = data.data as PipelineStep;
    this.selectedStepTemplate = this.steps.find(s => s.id === this.selectedStep.stepId);
    this.getStepParamTemplate(this.selectedStep);
    if (this.selectedStep.params.length > 0) {
      if (this.selectedStep.params[0].name === 'executeIfEmpty') {
        this.selectedStep.params.shift();
      }
    }
    if (this.selectedStep.params.length > 0) {
      if (this.selectedStep.params[0].name === 'retryLimit') {
        this.selectedStep.params.shift();
      }
    }
    this.selectedElement = data;
    this.configureStepGroup();
    this.typeAhead = [];
    const nodeId = this.stepLookup[data.name];
    if (nodeId) {
      this.addNodeToTypeAhead(nodeId, this.typeAhead);
    }
    const executeIfEmpty = {
      name: 'executeIfEmpty',
      value: this.selectedStep.executeIfEmpty || ' ',
      type: 'text',
      required: false,
      defaultValue: undefined,
      language: undefined,
      className: undefined,
      parameterType: undefined,
      description: 'Execute this step if the provided value is missing or empty'
    };
    const retry = {
      name: 'retryLimit',
      value: this.selectedStep.retryLimit || 0,
      type: 'integer',
      required: false,
      defaultValue: undefined,
      language: undefined,
      className: undefined,
      parameterType: undefined,
      description: 'Number of times to retry this step if an exception is thrown'
    };
    if (this.selectedStepTemplate) {
      this.selectedStep.params.forEach(p => p.parameterTemplate = this.selectedStepTemplate.params.find(p1 => p1.name === p.name));
    }
    this.selectedStep.params.unshift(retry);
    this.selectedStep.params.unshift(executeIfEmpty);
    this.selectedStep.type.toLocaleLowerCase() === 'branch'
      ? (this.isABranchStep = true)
      : (this.isABranchStep = false);
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

  handleParameterUpdate(name: string, parameter: PipelineStepParam) {
    if (name === 'executeIfEmpty') {
      this.selectedStep.executeIfEmpty = parameter.value;
    }
    if (name === 'retryLimit') {
      this.selectedStep.retryLimit = parameter.value;
    }
    this.configureStepGroup();
    this.validateChanges();
  }

  addStep(event: DndDropEvent) {
    let dialogRef;
    if (event.data.id === '6344948a-2032-472b-873c-064e6530989e') {
      dialogRef = this.dialog.open(CustomBranchDialogComponent, {
        width: '40%',
        height: '60%',
        data: this.packageObjects
      });
    } else {
      dialogRef = this.dialog.open(NameDialogComponent, {
        width: '25%',
        height: '212px',
        data: {name: ''},
      });
    }
    this.subscriptions.push(dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let step;
        if (result.stepId) {
          step = result;
        } else {
          const id = result as string;
          step = JSON.parse(JSON.stringify(event.data));
          // Switch the id and stepId
          step.stepId = step.id;
          step.id = id;
        }
        step.id = step.id.replace(/ /g, '_');
        // Set the value of boolean parameters if undefined
        step.params.forEach((p) => {
          if (p.type.toLocaleLowerCase() === 'boolean' && !p.value) {
            p.value = false;
          }
        });
        this.dndSubject.next(this.createDesignerElement(step, event));
        this.stepCreated.next(step);
      }
    }));
  }

  loadPipeline(id: string) {
    if (id === this.selectedPipeline.id) {
      return;
    }
    this.disableNameEdit();
    const newPipeline = this.generatePipeline();
    // Cannot diff the pipeline since step orders could have changed
    if (this.hasPipelineChanged(newPipeline)) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        width: '450px',
        height: '200px',
        data: {
          message:
            'You have unsaved changes to the current pipeline. Would you like to continue?',
        },
      });

      this.subscriptions.push(dialogRef.afterClosed().subscribe((confirmation) => {
        if (confirmation) {
          this.handleLoadPipeline(id);
        }
      }));
    } else {
      this.handleLoadPipeline(id);
    }
  }

  cancelPipelineChange() {
    if (this.selectedPipeline.id) {
      this.loadPipeline(this.selectedPipeline.id);
    } else {
      this.newPipeline();
    }
  }

  exportPipeline() {
    const pipeline = this.generatePipeline();
    delete pipeline.project;
    delete pipeline['_id'];
    delete pipeline['creationDate'];
    delete pipeline['modifiedDate'];
    this.dialog.open(CodeEditorComponent, {
      width: '75%',
      height: '90%',
      data: {
        code: JSON.stringify(pipeline, null, 4),
        language: 'json',
        allowSave: false,
        exportFileName: `${pipeline.name}-${pipeline.id}.json`
      },
    });
  }

  importPipeline() {
    const dialogRef = this.dialog.open(CodeEditorComponent, {
      width: '75%',
      height: '90%',
      data: { code: '', language: 'json', allowSave: true },
    });
    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.code.trim().length > 0) {
          try {
            const pipeline = JSON.parse(result.code);
            delete pipeline._id;
            this._pipeline = pipeline;
            this.selectedPipeline = JSON.parse(JSON.stringify(pipeline));
            this.loadPipelineToDesigner();
          } catch (error) {
            this.dialog.open(ErrorModalComponent, {
              width: '450px',
              data: {
                messages: ['Unable to parse the JSON', error],
              },
            });
          }
        }
      })
    );
  }

  savePipeline() {
    const dialogRef = this.dialog.open(WaitModalComponent, {
      width: '25%',
      height: '25%',
    });
    const newPipeline = this.generatePipeline();
    let observable;
    if (
      this.selectedPipeline.id &&
      this.pipelines.findIndex((p) => p.id === this.selectedPipeline.id)
    ) {
      observable = this.pipelinesService.updatePipeline(newPipeline);
    } else {
      observable = this.pipelinesService.addPipeline(newPipeline);
    }
    this.subscriptions.push(observable.subscribe(
      (pipeline: Pipeline) => {
        this._pipeline = pipeline;
        this.selectedPipeline = JSON.parse(JSON.stringify(pipeline));
        let index = this.pipelines.findIndex(
          (s) => s.id === this.selectedPipeline.id
        );
        if (index === -1) {
          this.pipelines.push(this.selectedPipeline);
        } else {
          this.pipelines[index] = this.selectedPipeline;
        }
        if (pipeline.category === 'step-group') {
          index = this.stepGroups.findIndex(
            (s) => s.id === this.selectedPipeline.id
          );
          if (index === -1) {
            this.stepGroups.push(this.selectedPipeline);
          } else {
            this.stepGroups[index] = this.selectedPipeline;
          }
        }
        // Change the reference to force the selector to refresh
        this.pipelines = [...this.pipelines];
        this.stepGroups = [...this.stepGroups];
        dialogRef.close();
      },
      (error) => this.handleError(error, dialogRef)
    ));
  }

  deletePipeline() {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '450px',
      height: '200px',
      data: {
        message: 'Are you sure you wish to permanently delete this pipeline?',
      },
    });

    this.subscriptions.push(dialogRef.afterClosed().subscribe(
      (confirmation) => {
        if (confirmation) {
          this.pipelinesService
            .deletePipeline(this.selectedPipeline)
            .subscribe((result) => {
              if (result) {
                const index = this.pipelines.findIndex(
                  (s) => s.id === this.selectedPipeline.id
                );
                if (index > -1) {
                  this.pipelines.splice(index, 1);
                  this.newPipeline();
                  // Change the reference to force the selector to refresh
                  this.pipelines = [...this.pipelines];
                }
              }
            });
        }
      },
      (error) => this.handleError(error, dialogRef)
    ));
  }

  copyPipeline() {
    if (this.hasPipelineChanged(this.selectedPipeline)) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        width: '450px',
        height: '200px',
        data: {
          message:
            'You have unsaved changes to the current pipeline. Would you like to continue?',
        },
      });

      this.subscriptions.push(dialogRef.afterClosed().subscribe((confirmation) => {
        if (confirmation) {
          this.handleCopyPipeline();
        }
      }));
    } else {
      this.handleCopyPipeline();
    }
  }

  handleElementAction(action: DesignerElementAction) {
    if (action.action === 'showPipeline') {
      if (action.element.data['type'] === 'step-group') {
        // TODO Show something to the user letting them know we can't determine the pipelineId
        const pipeline = this.getPipeline(<PipelineStep>action.element.data);
        if (pipeline) {
          const model = this.generateModelFromPipeline(pipeline);
          this.dialog.open(DesignerPreviewComponent, {
            width: '75%',
            height: '90%',
            data: model,
          });
        }
      }
    } else if (action.action === 'refreshStep') {
      this.refreshStepMetadata(action.element.data['id']);
    } else if (action.action === 'addSplit') {
      let param = {
        required: false,
        defaultValue: undefined,
        language: undefined,
        className: undefined,
        parameterType: undefined,
        type: 'result',
        name: `split-output-${this.selectedStep.params.length}`,
        value: undefined,
        description: 'The path to the linked nextStepId'
      };
      this.selectedStep.params.push(param);
      this.addSplitOutput.next({
        element: action.element,
        output: param.name,
      });
    } else if (action.action === 'mapStepGroupOutput') {
      let param = this.selectedStep.params.find(p => p.type === 'result');
      if (!param) {
        param = {
          required: false,
          defaultValue: undefined,
          language: undefined,
          className: undefined,
          parameterType: undefined,
          type: 'result',
          name: 'output',
          value: undefined,
          description: 'The final result that will be set as the primary when the step-group completes'
        };
        this.selectedStep.params.push(param);
      }
      const stepGroupResultDialogResponse =
        this.openStepGroupResultModal(param, this.getPipeline(<PipelineStep>action.element.data));
      stepGroupResultDialogResponse.afterClosed().subscribe((result) => {
        if (result && result.value && `${result.value}`.trim().length > 0) {
          param.value = result.value;
        }
      });
    }
  }

  private createDesignerElement(step: PipelineStep, event) {
    let actions = [{
      displayName: 'Refresh Step',
      action: 'refreshStep',
      enableFunction: () => {
        return true;
      },
      }];
    if (step.type === 'step-group') {
      actions.push({
          displayName: 'Map Step Group Result',
          action: 'mapStepGroupOutput',
          enableFunction: () => {
            return this.getPipeline(this.selectedStep);
          },
        },
        {
          displayName: 'Show pipeline',
          action: 'showPipeline',
          enableFunction: () => {
            return this.getPipeline(this.selectedStep);
          },
        });
    } else if (step.type === 'split') {
      actions.push({
        displayName: 'Add Split',
        action: 'addSplit',
        enableFunction: () => {
          return true;
        },
      });
    }
    return {
      name: step.id,
      tooltip: step.description,
      icon: SharedFunctions.getMaterialIconName(step.type),
      input: true,
      outputs: this.generateOutputs(step),
      data: step,
      event,
      style: step.type === 'step-group' ? 'designer-node-step-group' : null,
      actions,
      endGroupNode: step.type.toLowerCase() === 'join' || step.type.toLowerCase() === 'merge',
      rootGroupNode: step.type.toLowerCase() === 'fork' || step.type.toLowerCase() === 'split'
    };
  }

  private addNodeToTypeAhead(nodeId, typeAhead) {
    const parents = Object.values(this.designerModel.connections).filter(
      (c) => c.targetNodeId === nodeId
    );
    if (parents && parents.length > 0) {
      let stepId;
      parents.forEach((p) => {
        stepId = this.designerModel.nodes[p.sourceNodeId].data.name;
        if (typeAhead.indexOf(stepId) === -1) {
          typeAhead.push(stepId);
          this.addNodeToTypeAhead(p.sourceNodeId, typeAhead);
        }
      });
    }
  }

  private configureStepGroup() {
    if (this.selectedStep.type === 'step-group') {
      let pipeline = this.getPipeline(this.selectedStep);
      this.stepGroup = {
        enabled: true,
        pipeline: pipeline,
      };
    } else {
      this.stepGroup = {
        enabled: false,
      };
    }
  }

  private getPipeline(step: PipelineStep) {
    let pipelineId;
    let pipeline;
    let param = step.params.find((p) => p.name === 'pipelineId');
    let value = SharedFunctions.getParameterValue(param);
    if (value) {
      pipelineId = PipelinesEditorComponent.getPipelineId(value);
    }

    if (!pipelineId || pipelineId.trim().length === 0) {
      param = step.params.find((p) => p.name === 'pipeline');
      if (param) {
        value = SharedFunctions.getParameterValue(param);
        switch (typeof value) {
          case 'object':
            if (param.className) {
              pipeline = value;
              pipelineId = null;
            }
            break;
          case 'string':
            const p = value
              .split('||')
              .filter((v) => v.trim().indexOf('&') === 0)[0];
            pipelineId = PipelinesEditorComponent.getPipelineId(p);
            break;
        }
      }
    }

    pipeline = this.pipelines.find((p) => p.id === pipelineId);
    return pipeline;
  }

  private static getPipelineId(value: string) {
    if (SharedFunctions.getType(value, '') === 'pipeline') {
      return value.substring(1);
    } else {
      return value;
    }
  }

  private generateOutputs(step: PipelineStep) {
    let outputs = [];
    let stepType = step.type.toLocaleLowerCase();
    if (stepType === 'branch' || stepType === 'split') {
      step.params.forEach((p) => {
        if (p.type.toLocaleLowerCase() === 'result') {
          outputs.push(new DesignerElementOutput(p.name, stepType === 'split' ? 'normal' : 'result', DesignerConstants.getSourceEndpointOptions()));
        }
      });
    } else {
      outputs.push(new DesignerElementOutput('output', 'normal', DesignerConstants.getSourceEndpointOptions()));
    }
    outputs.push(PipelinesEditorComponent.generateErrorOutput());
    return outputs;
  }

  private static generateErrorOutput() {
    return new DesignerElementOutput('onError', 'error',
      DesignerConstants.getSourceEndpointOptions({
          fill: '#DE4854',
          stroke: '7'
        },
        {
          fill: '#AD1C28',
          stroke: '7',
          strokeWidth: 4
        },
        {
          stroke: '#A4243B',
          strokeWidth: 1
        },
        {
          stroke: '#861929',
          strokeWidth: 2
        }),
      );
  }

  get hasChanges() {
    return this.hasPipelineChanged(this.selectedPipeline);
  }

  private hasPipelineChanged(newPipeline) {
    let changed = this._pipeline.steps.length !== newPipeline.steps.length;
    let originalStep;
    newPipeline.steps.forEach((step) => {
      originalStep = this._pipeline.steps.find((s) => s.id === step.id);
      if (!originalStep) {
        changed = true;
      } else {
        if (Object.entries(diff(originalStep, step)).length !== 0) {
          changed = true;
        }
      }
    });
    return (
      this._pipeline.name !== newPipeline.name ||
      changed ||
      this._pipeline.category !== newPipeline.category
    );
  }

  private handleLoadPipeline(id: string) {
    this._pipeline = this.pipelines.find((p) => p.id === id);
    this.selectedPipeline = JSON.parse(JSON.stringify(this._pipeline));
    this.loadPipelineToDesigner();
  }

  private loadPipelineToDesigner() {
    this.errors = [];
    this.designerModel = this.generateModelFromPipeline(this.selectedPipeline);
  }

  private generateModelFromPipeline(pipeline: Pipeline) {
    const model = DesignerComponent.newModel();
    let nodeId;
    this.stepLookup = {};
    let existingLayout = pipeline.layout && Object.keys(pipeline.layout).length > 0;
    pipeline.steps.forEach((step) => {
      nodeId = `designer-node-${model.nodeSeq++}`;
      model.nodes[nodeId] = {
        data: this.createDesignerElement(step, null),
        x:
          existingLayout && pipeline.layout[step.id] && pipeline.layout[step.id].x
            ? pipeline.layout[step.id].x
            : -1,
        y:
          existingLayout && pipeline.layout[step.id] && pipeline.layout[step.id].y
            ? pipeline.layout[step.id].y
            : -1,
      };
      this.stepLookup[step.id] = nodeId;
    });
    // Add connections
    let source;
    let target;
    pipeline.steps.forEach((step) => {
      source = this.stepLookup[step.id];
      if (step.nextStepOnError) {
        target = this.stepLookup[step.nextStepOnError];
        if (source && target) {
          model.connections[`${source}::${target}`] = {
            sourceNodeId: this.stepLookup[step.id],
            targetNodeId: this.stepLookup[step.nextStepOnError],
            endpoints: [
              {
                sourceEndPoint: 'onError',
                targetEndPoint: 'input',
              },
            ],
          };
        }
      }
      if (step.type.toLocaleLowerCase() !== 'branch' && step.nextStepId) {
        target = this.stepLookup[step.nextStepId];
        if (source && target) {
          model.connections[`${source}::${target}`] = {
            sourceNodeId: this.stepLookup[step.id],
            targetNodeId: this.stepLookup[step.nextStepId],
            endpoints: [
              {
                sourceEndPoint: 'output',
                targetEndPoint: 'input',
              },
            ],
          };
        }
      } else {
        let connection;
        step.params
          .filter((p) => p.type.toLowerCase() === 'result')
          .forEach((output) => {
            target = this.stepLookup[output.value];
              if (output.value) {
                if (source && target) {
                  connection =
                    model.connections[`${source}::${target}`];
                  if (!connection) {
                    connection = {
                      sourceNodeId: this.stepLookup[step.id],
                      targetNodeId: this.stepLookup[output.value],
                      endpoints: [],
                    };
                    model.connections[
                      `${this.stepLookup[step.id]}::${
                        this.stepLookup[output.value]
                      }`
                      ] = connection;
                  }
                  connection.endpoints.push({
                    sourceEndPoint: output.name,
                    targetEndPoint: 'input',
                  });
                }
              }
          });
      }
    });
    // Setup groups
    if (this.useGroups) {
      pipeline.steps.forEach(step => this.buildGroup(step, model, null));
      // Handle groups layout
      Object.keys(model.groups).forEach((group) => {
        if (pipeline.layout && pipeline.layout[group]) {
          model.groups[group].x = pipeline.layout[group].x;
          model.groups[group].y = pipeline.layout[group].y;
          model.groups[group].expanded = pipeline.layout[group].expanded;
        } else {
          // Need to use automatic layout
          existingLayout = false;
        }
      });
    }
    // See if automatic layout needs to be applied
    if (!existingLayout) {
      DesignerComponent.performAutoLayout(model, this.designerElement, this.useGroups);
      if (!pipeline.layout) {
        pipeline.layout = {};
      }
      // Since an automatic layout was performed, capture the new coordinates
      Object.keys(model.nodes).forEach(k => {
        pipeline.layout[model.nodes[k].data.data.id] = {
            x: model.nodes[k].x,
            y: model.nodes[k].y,
          };
      });
      if (this.useGroups) {
        Object.keys(model.groups).forEach((group) => {
          pipeline.layout[group] = {
            x: model.groups[group].x,
            y: model.groups[group].y,
            expanded: model.groups[group].expanded,
          };
        });
      }
    }
    return model;
  }

  private buildGroup(step, model, group) {
    if (!model.groups[step.id]) {
      switch (step.type.toLocaleLowerCase()) {
        case 'fork':
        case 'split':
          if (!model.groups[`group-${step.id}`]) {
            model.groups[`group-${step.id}`] = {
              childNodes: [],
              parentNode: this.stepLookup[step.id],
              name: step.id,
              parent: group
            };
          }
          this.getChildNodes(step, model, `group-${step.id}`);
          break;
        case 'join':
        case 'merge':
          if (group && model.groups[group].childNodes.indexOf(this.stepLookup[step.id]) === -1) {
            model.groups[group].childNodes.push(this.stepLookup[step.id]);
          }
          break;
        default:
          if (group && model.groups[group].childNodes.indexOf(this.stepLookup[step.id]) === -1) {
            model.groups[group].childNodes.push(this.stepLookup[step.id]);
            this.getChildNodes(step, model, group);
          }
      }
    }
  }

  private getChildNodes(step, model, group) {
    // Branch/Split steps have results that have to be followed
    if (step.type.toLocaleLowerCase() === 'branch' || step.type.toLocaleLowerCase() === 'split') {
      step.params.filter(p => p.type === 'result').forEach(param => this.buildGroup(model.nodes[this.stepLookup[param.value]].data.data, model, group));
    } else if (step.nextStepId) { // Check nextStepId
      this.buildGroup(model.nodes[this.stepLookup[step.nextStepId]].data.data, model, group);
    }
  }

  private handleCopyPipeline() {
    const dialogRef = this.dialog.open(NameDialogComponent, {
      width: '25%',
      height: '212px',
      data: { name: `Copy of ${this.selectedPipeline.name}` },
    });
    this.subscriptions.push(dialogRef.afterClosed().subscribe((result) => {
      if (result && result.trim().length > 0) {
        const newpipeline = JSON.parse(JSON.stringify(this.selectedPipeline));
        delete newpipeline['_id'];
        delete newpipeline.id;
        newpipeline.name = result as string;
        this.selectedPipeline = newpipeline;
        this._pipeline = {
          name: '',
          project: null,
          steps: [],
          id: '',
          category: 'pipeline',
        };
        this.loadPipelineToDesigner();
      }
    }));
  }

  findSingleNodes(dif: number) {
    const singleNodes = [];
    const errors = [];
    let message = `Current nodes without input are:`;
    Object.keys(this.designerModel.nodes).forEach((node) => {
      Object.keys(this.designerModel.connections).forEach((connection) => {
        if (connection.includes(node)) {
          singleNodes.push(node);
        }
      });
    });

    Object.keys(this.designerModel.nodes).forEach((node) => {
      const only = singleNodes.includes(node);
      if (!only && dif > 1) {
        const nodename: {} = Object.values(this.designerModel.nodes[node]);
        message += ` ${nodename[0].name}`;
        errors.push({
          component: 'step',
          field: nodename[0].name,
          message: 'is not connected to another node'
        });
      }
    });
    return errors;
  }

  private validatePipelineSteps(pipeline: Pipeline): string[] {
    let errors = [];

    const difNodesAndConnections =
      Object.keys(this.designerModel.nodes).length -
      Object.keys(this.designerModel.connections).length;

    const nodesAlone = this.findSingleNodes(difNodesAndConnections);
    if (nodesAlone.length > 0) {
      nodesAlone.forEach(e => errors.push(e));
    }

    if (difNodesAndConnections > 1) {
      const nodes = Object.keys(this.designerModel.nodes);
      const connections = Object.values(this.designerModel.connections);
      const targetNodesId = connections.map(
        (connection) => connection.targetNodeId
      );
      targetNodesId.forEach((targetNode) => {
        const index = nodes.findIndex((node) => node === targetNode);
        nodes.splice(index, 1);
      });
      let parentNodes = '';
      nodes.forEach((node) => {
        const nodeRoot: {} = Object.values(this.designerModel.nodes[node]);
        parentNodes += ` ${nodeRoot[0].name}`;
      });
      errors.push({
          component: 'pipeline',
          field: '',
          message: 'can only have one starting step, and currently there are more than one. Please connect all steps.'
        }
      );
    }
    if (pipeline.steps.length > 0) {
      const stepsLookup = {};
      pipeline.steps.forEach((step) => {
        stepsLookup[step.id] = step;
      });
      let forkCount = 0;
      let joinCount = 0;
      const splitFlows = [];
      pipeline.steps.forEach((step) => {
        if (step.type === 'fork') {
          forkCount++;
        } else if (step.type === 'join') {
          joinCount++;
        } else if (step.type === 'split') {
          if (step.params.length < 2) {
            errors.push({
              component: 'pipeline',
              field: 'split',
              message: `${step.id} must have at least two paths!`
            });
          } else {
            const splitFlow = {
              step,
              flows: []
            };
            step.params.forEach(p => {
              if (p.type !== 'result') {
                errors.push({
                  component: 'pipeline',
                  field: 'split',
                  message: `${step.id} must only have result parameters!`
                });
              } else {
                splitFlow.flows.push(this.buildSplitStepFlow(stepsLookup[p.value], stepsLookup, [], errors));
              }
            });
            splitFlows.push(splitFlow);
          }
        }
        if (step.params && step.params.length > 0) {
          if (step.type.toLocaleLowerCase() === 'branch') {
            const hasResultParameter = step.params.find(
              (param) => param.type === 'result'
            );
            if (!hasResultParameter) {
              errors.push({
                component: 'pipeline',
                field: 'step',
                message: `${step.id} is a branch step and needs at least one result.`
              });
            }
          }
          step.params.forEach((param) => {
            if (
              param.required &&
              (!param.defaultValue || param.defaultValue === '')
            ) {
              if (param.value === undefined ||
                param.value === null ||
                (typeof param.value === 'string' &&
                  (param.value.endsWith('!') || param.value.endsWith('$')))) {
                errors.push({
                  component: 'pipeline',
                  field: 'step',
                  message: `${step.id} has a required parameter ${param.name} that is missing a value.`
                });
              }
            }
            if (
              param.value &&
              typeof param.value === 'string' &&
              param.value.trim().endsWith('&')
            ) {
              errors.push({
                component: 'pipeline',
                field: 'step group',
                message: `needs a selection for ${step.id} pipeline parameter.`
              });
            }
          });
        }
      });
      if (forkCount > 1 && forkCount !== joinCount) {
        errors.push({
          component: 'pipeline',
          field: 'fork',
          message: `must have closing join when multiple forks are present.`
        });
      }
      splitFlows.forEach(flow => {
        const result = flow.flows.shift().filter((v) => {
          return flow.flows.every((a) => {
            return a.indexOf(v) !== -1;
          });
        });
        if (result.length > 0) {
          errors.push({
            component: 'pipeline',
            field: 'split',
            message: `step ids ${result} must be unique across split flows!`
          });
        }
      });
    }
    return errors;
  }

  private buildSplitStepFlow(step: PipelineStep, stepLookup, flow: string[], errors) {
    flow.push(step.id);
    if (step.type.toLowerCase() === 'branch') {
      step.params.filter(p => p.type === 'result').forEach(path => {
        this.buildSplitStepFlow(stepLookup[path.value], stepLookup, flow, errors);
      });
    } else if (step.type === 'split') {
      // This is an error and needs to be recorded
      errors.push({
        component: 'pipeline',
        field: 'split',
        message: `${step.id} does not allow embedded split steps!`
      });
    } else if (step.type === 'merge') {
      flow.pop();
      return flow;
    } else if (step.nextStepId) {
      return this.buildSplitStepFlow(stepLookup[step.nextStepId], stepLookup, flow, errors);
    }
    return flow;
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

  showStepGroupResult() {
    const param = {
      type: 'text',
      name: 'output',
      value: this.selectedPipeline.stepGroupResult,
      description: 'The final result that will be set as the primary when the step-group completes'
    };
    const stepGroupResultDialogResponse =this.openStepGroupResultModal(param, this.selectedPipeline);
    stepGroupResultDialogResponse.afterClosed().subscribe((result) => {
      if (result && result.value && `${result.value}`.trim().length > 0) {
        this.selectedPipeline.stepGroupResult = result.value;
      }
    });
  }

  openStepGroupResultModal(param, pipeline) {
    return this.displayDialogService.openDialog(
      StepGroupResultModalComponent,
      generalDialogDimensions,
      {
        param,
        packageObjects: this.packageObjects,
        typeAhead: pipeline.steps.map(step => step.id),
        pipelinesData: this.pipelinesData
      }
    );
  }

  private generatePipeline(): Pipeline {
    const targetIds = Object.values(this.designerModel.connections).map(
      (conn) => conn.targetNodeId
    );
    const nodeIds = Object.keys(this.designerModel.nodes).filter(
      (key) => targetIds.indexOf(key) === -1
    );
    const rootNode = this.designerModel.nodes[nodeIds[0]];
    const pipeline = {
      id: this.selectedPipeline.id,
      name: this.selectedPipeline.name,
      category: this.selectedPipeline.category,
      stepGroupResult: this.selectedPipeline.stepGroupResult,
      project: null,
      layout: {},
      steps: [],
    };
    if (this.selectedPipeline.id) {
      pipeline['creationDate'] = this.selectedPipeline['creationDate'];
      pipeline['modifiedDate'] = this.selectedPipeline['modifiedDate'];
    }
    this.addNodeToPipeline(rootNode, pipeline);
    // Identify the error connections
    const connections = Object.values(this.designerModel.connections).filter(
      (conn) => conn.endpoints[0].sourceEndPoint === 'onError');
    let step;
    connections.forEach(conn => {
      step = pipeline.steps.find(s => s.id === this.designerModel.nodes[conn.sourceNodeId].data.name);
      step.nextStepOnError = this.designerModel.nodes[conn.targetNodeId].data.name;
      if (!pipeline.steps.find(s => s.id === this.designerModel.nodes[conn.targetNodeId].data.name)) {
        this.addNodeToPipeline(this.designerModel.nodes[conn.targetNodeId], pipeline);
      }
    });
    // Update layout with group x/y
    Object.keys(this.designerModel.groups || {}).forEach((group) => {
      pipeline.layout[group] = {
        x: this.designerModel.groups[group].x,
        y: this.designerModel.groups[group].y,
        expanded: this.designerModel.groups[group].expanded,
      };
    });
    return pipeline;
  }

  private addNodeToPipeline(node, pipeline) {
    if (!node) {
      return;
    }
    const nodeId = Object.keys(this.designerModel.nodes).find(
      (key) => this.designerModel.nodes[key].data.name === node.data.name
    );
    // Clone the step data
    const step = JSON.parse(JSON.stringify(node.data.data));
    delete step._id;
    delete step.project; // Remove project data since it serves no purpose outside of the UI
    if (step.executeIfEmpty && step.executeIfEmpty.trim().length === 0) {
      delete step.executeIfEmpty;
    }
    if (step.retryLimit) {
      delete step.retryLimit;
    }
    if (step.params && step.params.find(p => p.name === 'executeIfEmpty')) {
      const index = step.params.findIndex(p => p.name === 'executeIfEmpty');
      step.params.splice(index, 1);
    }
    if (step.params && step.params.find(p => p.name === 'retryLimit')) {
      const index = step.params.findIndex(p => p.name === 'retryLimit');
      step.params.splice(index, 1);
    }
    if (step.type === 'step-group' && step.params && step.params.find(p => p.type === 'result')) {
      const index = step.params.findIndex(p => p.type === 'result');
      if (!step.params[index].value ||
        (typeof step.params[index].value === 'string' &&
          step.params[index].value.trim().length <= 1)) {
        step.params.splice(index, 1);
      }
    }
    PipelinesEditorComponent.adjustStepParameterType(step);
    if (pipeline.steps.findIndex((s) => s.id === step.id) === -1) {
      pipeline.steps.push(step);
      pipeline.layout[step.id] = {
        x: node.x,
        y: node.y,
      };
      const children = Object.values(this.designerModel.connections).filter(
        (conn) => conn.sourceNodeId === nodeId && conn.endpoints[0].sourceEndPoint !== 'onError'
      );
      if (children.length > 0) {
        if (step.type.toLocaleLowerCase() === 'branch' ||
            step.type.toLocaleLowerCase() === 'split') {
          let childNode;
          delete step.nextStepId;
          children.forEach((child) => {
            childNode = this.designerModel.nodes[child.targetNodeId];
            if (childNode) {
              child.endpoints.forEach((ep) => {
                step.params.find((p) => p.name === ep.sourceEndPoint).value =
                  childNode.data.name;
                this.addNodeToPipeline(childNode, pipeline);
              });
            }
          });
        } else {
          const childNode = this.designerModel.nodes[children[0].targetNodeId];
          step.nextStepId = childNode.data.data.id;
          this.addNodeToPipeline(childNode, pipeline);
        }
      } else {
        delete step.nextStepId;
      }
    }
  }

  private static adjustStepParameterType(step: PipelineStep) {
    if (step.params) {
      step.params.forEach((param) => {
        switch (param.type) {
          case 'global':
          case 'runtime':
          case 'mapped_runtime':
          case 'pipeline':
          case 'step':
          case 'secondary':
          case 'credential':
            param.type = 'text';
            break;
          default:
        }
        delete param.parameterTemplate;
      });
    }
  }

  enableNameEdit() {
    this.editName = true;
  }

  disableNameEdit() {
    this.editName = false;
    this.validateChanges();
  }

  enableStepIdEdit() {
    this.editStepId = true;
  }

  disableStepIdEdit() {
    this.editStepId = false;
    this.validateChanges();
  }

  validateChanges() {
    const errors = [];
    const newPipeline = this.generatePipeline();
    const stepValidations = this.validatePipelineSteps(newPipeline);
    if (!this.pipelineValidator(newPipeline) || stepValidations.length > 0) {
      stepValidations.forEach(e => errors.push(e));
      if (this.pipelineValidator.errors && this.pipelineValidator.errors.length > 0) {
        this.pipelineValidator.errors.forEach((err) => {
          errors.push({
            component: 'pipeline',
            field: err.dataPath.substring(1),
            message: err.message
          });
        });
      }
    }
    this.errors = errors;
  }

  autoLayout() {
    const pipeline = this.generatePipeline();
    delete pipeline.layout;
    this.designerModel = this.generateModelFromPipeline(pipeline);
  }

  refreshStepMetadata(id: string) {
    const nodeIds = Object.keys(this.designerModel.nodes);
    if (id) {
      const nodeId = nodeIds.find(key => this.designerModel.nodes[key].data.data.id === id);
      this.designerModel.nodes[nodeId].data.data = this.updateStep(this.designerModel.nodes[nodeId].data.data);
      this.designerModel.nodes[nodeId].data.tooltip = this.designerModel.nodes[nodeId].data.data.description;
    } else {
      nodeIds.forEach((key) => {
        this.designerModel.nodes[key].data.data = this.updateStep(this.designerModel.nodes[key].data.data);
        this.designerModel.nodes[key].data.tooltip = this.designerModel.nodes[key].data.data.description;
      });
    }
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
  getStepParamTemplate(step){
    switch(step.type.toLowerCase()) {
      case 'fork':
      case 'join':
      case 'split':
      case 'merge':
        break;
      default:
        this.stepsService.getParamTemplate(step.stepId)
          .subscribe(resp=>{
            this.stepTemplate = resp;
          });
    }
  }
}
