import {Component, Input, OnInit} from "@angular/core";
import {PackageObjectsService} from "../packageObjects/package-objects.service";
import {IPackageObject} from "../packageObjects/package-objects.model";
import {IPipeline, IPipelineStep, IPipelineStepParam} from "./pipelines.model";
import {PipelinesService} from "./pipelines.service";
import {DesignerComponent, DesignerElement, DesignerModel} from "../designer/designer.component";
import {DndDropEvent} from "ngx-drag-drop";
import {Subject} from "rxjs";
import {NameDialogComponent} from "../name-dialog/name.dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {StepsService} from "../steps/steps.service";
import {IStep, StaticSteps} from "../steps/steps.model";
import {CodeEditorComponent} from "../code-editor/code.editor.component";
import {WaitModalComponent} from "../wait-modal/wait.modal.component";
import {diff} from "deep-object-diff";
import {ErrorModalComponent} from "../error-modal/error.modal.component";
import * as Ajv from 'ajv';
import {ConfirmationModalComponent} from "../confirmation/confirmation.modal.component";

@Component({
  selector: 'pipelines-editor',
  templateUrl: './pipelines.editor.component.html',
  styleUrls: ['./pipelines.editor.component.css']
})
export class PipelinesEditorComponent implements OnInit {
  packageObjects: IPackageObject[];
  pipelines: IPipeline[];
  steps: IStep[];
  selectedPipeline: IPipeline;
  _pipeline: IPipeline;
  selectedStep: IPipelineStep;
  selectedElement: DesignerElement;
  designerModel: DesignerModel =  DesignerComponent.newModel();
  dndSubject: Subject<DesignerElement> = new Subject<DesignerElement>();
  stepLookup = {};
  typeAhead: string[] = [];
  pipelineValidator;

  constructor(private stepsService: StepsService,
              private pipelinesService: PipelinesService,
              private packageObjectsService: PackageObjectsService,
              public dialog: MatDialog) {}

  ngOnInit(): void {
    this.newPipeline();
    this.newStep();
    this.stepsService.getSteps().subscribe((steps: IStep[]) => {
      steps.push(StaticSteps.FORK_STEP);
      steps.push(StaticSteps.JOIN_STEP);
      this.steps = steps;
    });

    this.pipelinesService.getPipelines().subscribe((pipelines: IPipeline[]) => {
      this.pipelines = pipelines;
    });

    this.packageObjectsService.getPackageObjects().subscribe((pkgObjs: IPackageObject[]) => {
      this.packageObjects = pkgObjs;
    });

    this.pipelinesService.getPipelineSchema().subscribe((schema) => {
      const ajv = new Ajv({ allErrors: true });
      this.stepsService.getStepSchema().subscribe((stepSchema) => {
        this.pipelineValidator = ajv.addSchema(stepSchema, 'stepSchema').addSchema(schema).compile(schema.definitions.BasePipeline);
      })
    });
  }

  @Input()
  set step(step: IPipelineStep) {
    if (step) {
      let localStep = this.selectedPipeline.steps.find(s => s.id === step.id);
      if (localStep) {
        this.selectedStep = localStep;
      } else {
        this.newStep();
      }
    } else {
      this.newStep();
    }
  }

  newPipeline() {
    this._pipeline = {
      name: "",
      steps: [],
      id: '',
      category: 'pipeline'
    };
    this.selectedPipeline = JSON.parse(JSON.stringify(this._pipeline));
  }

  newStep() {
    this.selectedStep = {
      stepId: '',
      executeIfEmpty: '',
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
        stepResults: []
      }
    };
  }

  stepSelected(data: DesignerElement) {
    this.selectedStep = data.data as IPipelineStep;
    this.selectedElement = data;
    /*
     * TODO:
     *  Expose the result parameters for secondary to type ahead when a '.' is detected
     */
    this.typeAhead = [];
    const nodeId = this.stepLookup[data.name];
    if (nodeId) {
      this.addNodeToTypeAhead(nodeId, this.typeAhead);
    }
  }

  private addNodeToTypeAhead(nodeId, typeAhead) {
    const parents = Object.values(this.designerModel.connections).filter(c => c.targetNodeId === nodeId);
    if (parents && parents.length > 0) {
      let stepId;
      parents.forEach(p => {
        stepId = this.designerModel.nodes[p.sourceNodeId].data.name;
        if (typeAhead.indexOf(stepId) === -1) {
          typeAhead.push(stepId);
        }
        this.addNodeToTypeAhead(p.sourceNodeId, typeAhead);
      });
    }
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

  handleParameterUpdate(name: string, parameter: IPipelineStepParam) {
    if (name === 'executeIfEmpty') {
      this.selectedStep.executeIfEmpty = parameter.value;
    }
  }

  addStep(event: DndDropEvent) {
    const dialogRef = this.dialog.open(NameDialogComponent, {
      width: '25%',
      height: '25%',
      data: {name: ''}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.trim().length > 0) {
        const id = result as string;
        const step = JSON.parse(JSON.stringify(event.data));
        // Switch the id and stepId
        step.stepId = step.id;
        step.id = id.replace(' ', '_');

        this.dndSubject.next({
          name: step.id,
          tooltip: step.description,
          icon: `../assets/${step.type.toLocaleLowerCase()}.png`,
          input: true,
          outputs: this.generateOutputs(step),
          data: step,
          event
        })
      }
    });
  }

  private generateOutputs(step) {
    let outputs = [];
    if (step.type.toLocaleLowerCase() === 'branch') {
      step.params.forEach((p) => {
        if (p.type.toLocaleLowerCase() === 'result') {
          outputs.push(p.name);
        }
      });
    } else {
      outputs.push('output');
    }
    return outputs;
  }

  loadPipeline(id: string) {
    if (id === this.selectedPipeline.id) {
      return;
    }
    const newPipeline = this.generatePipeline();
    // Cannot diff the pipeline since step orders could have changed
    let changed = this._pipeline.steps.length !== newPipeline.steps.length;
    let originalStep;
    newPipeline.steps.forEach(step => {
      originalStep = this._pipeline.steps.find(s => s.id === step.id);
      if (!originalStep) {
        changed = true;
      } else {
        if (Object.entries(diff(originalStep, step)).length !== 0) {
          changed = true;
        }
      }
    });
    if (this._pipeline.name !== newPipeline.name || changed || this._pipeline.category !== newPipeline.category) {
      const dialogRef = this.dialog.open(ConfirmationModalComponent, {
        width: '450px',
        height: '200px',
        data: { message: 'You have unsaved changes to the current pipeline. Would you like to continue?' }
      });

      dialogRef.afterClosed().subscribe(confirmation => {
        if (confirmation) {
          this.handleLoadPipeline(id);
        }
      });
    } else {
      this.handleLoadPipeline(id);
    }
  }

  private handleLoadPipeline(id: string) {
    this._pipeline = this.pipelines.find(p => p.id === id);
    this.selectedPipeline = JSON.parse(JSON.stringify(this._pipeline));
    this.loadPipelineToDesigner();
  }

  private loadPipelineToDesigner() {
    const model = DesignerComponent.newModel();
    let nodeId;
    this.stepLookup = {};
    this.selectedPipeline.steps.forEach(step => {
      nodeId = `designer-node-${model.nodeSeq++}`;
      model.nodes[nodeId] = {
        data: {
          name: step.id,
          tooltip: step.description,
          icon: `../assets/${step.type.toLocaleLowerCase()}.png`,
          input: true,
          outputs: this.generateOutputs(step),
          data: step,
          event: undefined
        },
        x: this.selectedPipeline.layout && this.selectedPipeline.layout[step.id].x ? this.selectedPipeline.layout[step.id].x : -1,
        y: this.selectedPipeline.layout && this.selectedPipeline.layout[step.id].y ? this.selectedPipeline.layout[step.id].y : -1
      };
      this.stepLookup[step.id] = nodeId;
    });
    // Add connections
    let connectedNodes = [];
    this.selectedPipeline.steps.forEach(step => {
      if (step.type !== 'branch' && step.nextStepId) {
        model.connections[`${this.stepLookup[step.id]}::${this.stepLookup[step.nextStepId]}`] = {
          sourceNodeId: this.stepLookup[step.id],
          targetNodeId: this.stepLookup[step.nextStepId],
          endpoints: [{
            sourceEndPoint: 'output',
            targetEndPoint: 'input'
          }]
        };
        connectedNodes.push(step.nextStepId);
      } else {
        let connection;
        step.params.filter(p => p.type.toLowerCase() === 'result').forEach(output => {
          if (output.value) {
            connectedNodes.push(output.value);
            connection = model.connections[`${this.stepLookup[step.id]}::${this.stepLookup[output.value]}`];
            if (!connection) {
              connection = {
                sourceNodeId: this.stepLookup[step.id],
                targetNodeId: this.stepLookup[output.value],
                endpoints: []
              };
              model.connections[`${this.stepLookup[step.id]}::${this.stepLookup[output.value]}`] = connection;
            }
            connection.endpoints.push({
              sourceEndPoint: output.name,
              targetEndPoint: 'input'
            });
          }
        });
      }
    });
    // See if automatic layout needs to be applied
    if (!this.selectedPipeline.layout ||
      Object.keys(this.selectedPipeline.layout).length === 0) {
      this.performAutoLayout(this.stepLookup, connectedNodes, model);
    }
    this.designerModel = model;
  }

  cancelPipelineChange() {
    if (this.selectedPipeline.id) {
      this.loadPipeline(this.selectedPipeline.id);
    } else {
      this.newPipeline();
      // this.changed = false;
      // this.valid = true;
    }
  }

  exportPipeline() {
    this.dialog.open(CodeEditorComponent, {
      width: '75%',
      height: '90%',
      data: {code: JSON.stringify(this.generatePipeline(), null, 4),
        language: 'json',
      allowSave: false}
    });
  }

  importPipeline() {
    const dialogRef = this.dialog.open(CodeEditorComponent, {
      width: '75%',
      height: '90%',
      data: {code: '',
        language: 'json',
        allowSave: true}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.code.trim().length > 0) {
        const pipeline = JSON.parse(result.code);
        delete pipeline._id;
        this._pipeline = pipeline;
        this.selectedPipeline = JSON.parse(JSON.stringify(pipeline));
        this.loadPipelineToDesigner();
      }
    });
  }

  savePipeline() {
    const dialogRef = this.dialog.open(WaitModalComponent, {
      width: '25%',
      height: '25%'
    });
    const newPipeline = this.generatePipeline();
    const stepValidations = this.validatePipelineSteps(newPipeline);
    if (!this.pipelineValidator(newPipeline) || stepValidations.length > 0) {
      const error = {
        message: ''
      };
      stepValidations.forEach(e => error.message = `${error.message}${e}\n`);
      if (this.pipelineValidator.errors && this.pipelineValidator.errors.length > 0) {
        this.pipelineValidator.errors.forEach(err => {
          error.message = `${error.message}${err.dataPath.substring(1)} ${err.message}\n`;
        });
      }
      this.handleError(error, dialogRef);
    } else {
      let observable;
      if (this.selectedPipeline.id && this.pipelines.findIndex(p => p.id === this.selectedPipeline.id)) {
        observable = this.pipelinesService.updatePipeline(newPipeline);
      } else {
        observable = this.pipelinesService.addPipeline(newPipeline);
      }
      observable.subscribe((pipeline: IPipeline) => {
        this._pipeline = pipeline;
        this.selectedPipeline = JSON.parse(JSON.stringify(pipeline));
        const index = this.pipelines.findIndex(s => s.id === this.selectedPipeline.id);
        if (index === -1) {
          this.pipelines.push(this.selectedPipeline);
        } else {
          this.pipelines[index] = this.selectedPipeline;
        }
        // Change the reference to force the selector to refresh
        this.pipelines = [...this.pipelines];
        dialogRef.close();
      }, (error) => this.handleError(error, dialogRef));
    }
  }

  private validatePipelineSteps(pipeline: IPipeline): String[] {
    const errors = [];
    if (pipeline.steps.length > 0) {
      pipeline.steps.forEach(step => {
        if (step.params && step.params.length > 0) {
          step.params.forEach(param => {
            if (param.required && (!param.value ||
              (param.type !== 'object' && param.value.trim().length === 0))) {
              errors.push(`Step ${step.id} has a required parameter ${param.name} that is missing a value`);
            }
          });
        }
      });
    }
    return errors;
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
      data: {message}
    });
  }

  handleModelChange() {
    /*
     * TODO:
     * Validate the pipeline
     */
    // if (!this.loading) {
    //   const pipeline = this.generatePipeline();
    //   const changes = diff(this._pipeline, pipeline);
      // console.log(`Changes: ${JSON.stringify(changes, null, 4)}`);
    //   this.changed = Object.keys(changes).length > 0;
    //   this.valid = true;
    // }
  }

  private generatePipeline(): IPipeline {
    const targetIds = Object.values(this.designerModel.connections).map(conn => conn.targetNodeId);
    const nodeIds = Object.keys(this.designerModel.nodes).filter(key => targetIds.indexOf(key) === -1);
    const rootNode = this.designerModel.nodes[nodeIds[0]];
    const pipeline = {
      id: this.selectedPipeline.id,
      name: this.selectedPipeline.name,
      category: this.selectedPipeline.category,
      layout: {},
      steps: []
    };
    if (this.selectedPipeline.id) {
      pipeline['creationDate'] = this.selectedPipeline['creationDate'];
      pipeline['modifiedDate'] = this.selectedPipeline['modifiedDate'];
    }
    this.addNodeToPipeline(rootNode, pipeline);
    return pipeline;
  }

  private addNodeToPipeline(node, pipeline) {
    if (!node) {
      return;
    }
    const nodeId = Object.keys(this.designerModel.nodes).find(key => this.designerModel.nodes[key].data.name === node.data.name);
    const step = node.data.data;
    delete step._id;
    if (pipeline.steps.findIndex(s => s.id === step.id) === -1) {
      pipeline.steps.push(step);
      pipeline.layout[step.id] = {
        x: node.x,
        y: node.y
      };
      // TODO Should the result parameter be set when the connection is made (model change) or only when saving?
      const children = Object.values(this.designerModel.connections).filter(conn => conn.sourceNodeId === nodeId);
      if (children.length > 0) {
        if (step.type === 'branch') {
          let childNode;
          delete step.nextStepId;
          children.forEach(child => {
            childNode = this.designerModel.nodes[child.targetNodeId];
            child.endpoints.forEach(ep => {
              step.params.find(p => p.name === ep.sourceEndPoint).value = childNode.data.name;
              this.addNodeToPipeline(childNode, pipeline);
            });
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

  // TODO This may need to be moved to the designer component
  // TODO This is a basic layout algorithm, need to try to use a proper library like dagre
  private performAutoLayout(nodeLookup, connectedNodes, model) {
    let x = 300;
    let y = 100;
    const nodeId = nodeLookup[Object.keys(nodeLookup).filter(key => connectedNodes.indexOf(key) === -1)[0]];
    const rootNode = model.nodes[nodeLookup[Object.keys(nodeLookup).filter(key => connectedNodes.indexOf(key) === -1)[0]]];
    this.setNodeCoordinates(model, nodeLookup, rootNode, nodeId, x, y);
  }

  private setNodeCoordinates(model, nodeLookup, parentNode, nodeId, x, y) {
    if (parentNode.x === -1) {
      parentNode.x = x;
    }
    parentNode.y = y;
    const children = Object.keys(model.connections).filter(key => key.indexOf(nodeId) === 0);
    const totalWidth = children.length * 80;
    y += 125;
    x = children.length === 1 ? x : x - (totalWidth / 2);
    if (x < 0) {
      x = 100;
    }
    let childNode;
    children.forEach(child => {
      nodeId = model.connections[child].targetNodeId;
      childNode = model.nodes[nodeId];
      this.setNodeCoordinates(model, nodeLookup, childNode, nodeId, x, y);
      x += 80;
    });
  }
}
